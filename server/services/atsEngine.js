/**
 * atsEngine.js
 * ─────────────────────────────────────────────────────────────
 * Master ATS scoring pipeline.
 *
 * SCORING BREAKDOWN (100 base + 10 bonus):
 *   A: Base Structure       25 pts  (A1–A5)
 *   B: Content Quality      35 pts  (B1–B7)
 *   C: Writing Quality      20 pts  (C1–C5)
 *   D: ATS Compatibility    20 pts  (D1–D4)
 *   E: Advanced Metrics     10 pts  (E1–E5, bonus)
 *
 * NORMALIZATION:
 *   Final score = min(100, A+B+C+D+E)
 *
 * Each sub-score has detailed breakdown + suggestions.
 * ─────────────────────────────────────────────────────────────
 */

import {
  analyzeActionVerbs,
  detectQuantification,
  computeReadability,
  detectFluffWords,
  detectTenseConsistency,
  detectRepetition,
  analyzeContactInfo,
  analyzeSummary,
  analyzeExperience,
  analyzeEducation,
  analyzeSkills,
  analyzeProjects,
  extractBullets,
  buildFullText,
} from './textAnalyzer.js';

import {
  inferDomain,
  extractTfIdfKeywords,
  analyzeKeywordDensity,
  simulateATS,
  analyzeFormatSafety,
} from './keywordEngine.js';

// ─────────────────────────────────────────────────────────────
// SUGGESTION BUILDER
// Generates human-readable actionable suggestions
// ─────────────────────────────────────────────────────────────
function mkSuggestion(priority, category, message, impact, original = null, rewrite = null) {
  return { priority, category, message, impact, original, rewrite };
}

// ─────────────────────────────────────────────────────────────
// scoreA — Base Structure (25 pts)
// A1: Format & Layout      max 5
// A2: Section Organization  max 5
// A3: Length Appropriateness max 5
// A4: Visual Hierarchy      max 5
// A5: Whitespace Balance    max 5
// ─────────────────────────────────────────────────────────────
function scoreA(resumeData, formatReport) {
  const sections = {
    hasSummary:    Boolean(resumeData.professional_summary?.trim()),
    hasExperience: (resumeData.experience || []).length > 0,
    hasEducation:  (resumeData.education  || []).length > 0,
    hasSkills:     (resumeData.skills     || []).length > 0,
    hasProjects:   (resumeData.project    || []).length > 0,
  };

  const sectionCount = Object.values(sections).filter(Boolean).length;
  const exp          = resumeData.experience || [];
  const fullText     = buildFullText(resumeData);
  const wordCount    = (fullText.match(/\b\w+\b/g) || []).length;

  // A1: Format & Layout (based on ATS format safety)
  const A1 = Math.min(5, formatReport.formatSafeScore);

  // A2: Section Organization
  // 5 sections present = 5, 4 = 4, 3 = 3, 2 = 2, 1 = 1
  let A2 = Math.min(5, sectionCount);
  const missingSections = [];
  if (!sections.hasSummary)    missingSections.push('Professional Summary');
  if (!sections.hasExperience) missingSections.push('Work Experience');
  if (!sections.hasEducation)  missingSections.push('Education');
  if (!sections.hasSkills)     missingSections.push('Skills');

  // A3: Length Appropriateness
  // Ideal: 400–700 words (1–2 pages)
  let A3 = 0;
  if (wordCount >= 350 && wordCount <= 800)       A3 = 5;
  else if (wordCount >= 250 && wordCount < 350)   A3 = 3;
  else if (wordCount > 800 && wordCount <= 1000)  A3 = 3;
  else if (wordCount > 1000)                      A3 = 1;
  else if (wordCount >= 150)                      A3 = 2;
  else                                            A3 = 0;

  // A4: Visual Hierarchy (section titles + subsections present)
  let A4 = 5;
  if (!sections.hasSummary)    A4 -= 1;
  if (!sections.hasExperience) A4 -= 1.5;
  if (!sections.hasSkills)     A4 -= 0.5;
  if (exp.length > 0 && !exp.some(e => e.description?.trim())) A4 -= 1;
  A4 = Math.max(0, A4);

  // A5: Whitespace Balance (bullet point usage in experience)
  const bullets = extractBullets(exp);
  const avgBullets = exp.length > 0 ? bullets.length / exp.length : 0;
  let A5 = 0;
  if (avgBullets >= 3 && avgBullets <= 6) A5 = 5;
  else if (avgBullets >= 2)               A5 = 4;
  else if (avgBullets >= 1)               A5 = 3;
  else if (exp.length > 0)                A5 = 1;

  const total = Math.round((A1 + A2 + A3 + A4 + A5) * 10) / 10;

  // Suggestions
  const suggestions = [];
  if (A1 < 4) suggestions.push(mkSuggestion('high', 'format',
    'Resume format may cause ATS parsing issues', 8,
    formatReport.issues?.join(', ') || null
  ));
  if (missingSections.length > 0) suggestions.push(mkSuggestion('high', 'structure',
    `Missing critical sections: ${missingSections.join(', ')}`, 5 * missingSections.length
  ));
  if (A3 < 3 && wordCount < 350) suggestions.push(mkSuggestion('medium', 'content',
    `Resume is too short (${wordCount} words). Aim for 400–700 words for best ATS performance`, 5
  ));
  if (A3 < 3 && wordCount > 800) suggestions.push(mkSuggestion('medium', 'structure',
    `Resume is too long (${wordCount} words). Trim to 1–2 pages (500–700 words)`, 4
  ));
  if (avgBullets < 2 && exp.length > 0) suggestions.push(mkSuggestion('medium', 'content',
    'Add 3–6 bullet points per job role to describe your responsibilities and achievements', 5
  ));

  return {
    scores: { A1, A2, A3, A4: Math.round(A4 * 10) / 10, A5, total },
    meta: { wordCount, sectionCount, missingSections, avgBulletsPerJob: Math.round(avgBullets * 10) / 10 },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// scoreB — Content Quality (35 pts)
// B1: Contact Information    max 3
// B2: Experience Description  max 7
// B3: Education Details       max 5
// B4: Skills Presentation     max 5
// B5: Achievements & Results  max 7
// B6: Projects Portfolio      max 4
// B7: Certifications          max 4
// ─────────────────────────────────────────────────────────────
function scoreB(resumeData, expAnalysis, eduAnalysis, skillsAnalysis, projAnalysis, contactAnalysis, quantReport) {
  const B1 = Math.min(3, contactAnalysis.score);
  const B2 = Math.min(7, expAnalysis.score);
  const B3 = Math.min(5, eduAnalysis.score);
  const B4 = Math.min(5, skillsAnalysis.score);
  const B5 = Math.min(7, quantReport.score + (expAnalysis.score >= 4 ? 1 : 0));

  // B6: Projects
  const B6 = Math.min(4, projAnalysis.score);

  // B7: Certifications (check for cert keywords in skills + text)
  const fullText = buildFullText(resumeData).toLowerCase();
  const certPatterns = [
    /\baws\s+certified\b/i, /\bpmp\b/i, /\bcissp\b/i, /\bcpa\b/i,
    /\bcfa\b/i, /\bgoogle\s+certified\b/i, /\bmicrosoft\s+certified\b/i,
    /\bcompTIA\b/i, /\bscrum\s+master\b/i, /\bisc\b/i, /\bcertificate\b/i,
    /\bcertification\b/i, /\bcertified\b/i,
  ];
  const certCount = certPatterns.filter(p => p.test(fullText)).length;
  const B7 = certCount >= 3 ? 4 : certCount === 2 ? 3 : certCount === 1 ? 2 : 0;

  const total = Math.round((B1 + B2 + B3 + B4 + B5 + B6 + B7) * 10) / 10;

  const suggestions = [];
  if (B1 < 2) suggestions.push(mkSuggestion('high', 'contact',
    `Missing contact info: ${contactAnalysis.missing.join(', ')}`, 5
  ));
  if (B2 < 4) suggestions.push(mkSuggestion('high', 'content',
    expAnalysis.hasExperience
      ? 'Add more detail to each work experience — include company, role title, dates, and 3+ bullet points'
      : 'Work Experience section is missing — this is critical for ATS scoring', 10
  ));
  if (B3 < 3) suggestions.push(mkSuggestion('medium', 'content',
    'Education section needs more detail — include degree, institution, graduation date, and field of study', 4
  ));
  if (B4 < 3) suggestions.push(mkSuggestion('high', 'keywords',
    `Add more skills — currently ${skillsAnalysis.totalCount || 0} listed. Aim for 10–15 relevant skills`, 6
  ));
  if (B5 < 4) suggestions.push(mkSuggestion('high', 'content',
    `Only ${quantReport.count} bullet point(s) contain measurable results. Add numbers, percentages, and metrics to at least 30% of bullets`, 8
  ));
  if (B7 === 0) suggestions.push(mkSuggestion('low', 'content',
    'Adding relevant certifications can significantly boost your resume credibility', 3
  ));

  return {
    scores: { B1, B2, B3, B4, B5, B6, B7, total },
    meta: {
      certCount,
      contactMissing: contactAnalysis.missing,
      skillsCount:    skillsAnalysis.totalCount || 0,
      hasProjects:    projAnalysis.hasProjects,
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// scoreC — Writing Quality (20 pts)
// C1: Grammar & Spelling   max 4
// C2: Action Verbs          max 4
// C3: Quantifiable Metrics  max 4
// C4: Clarity & Readability  max 4
// C5: Conciseness           max 4
// ─────────────────────────────────────────────────────────────
function scoreC(resumeData, verbAnalysis, quantReport, readability, fluffReport, tenseReport, repetitionReport) {
  // C1: Grammar & Spelling (using tense + repetition as proxy)
  const C1 = Math.min(4, (tenseReport.score + repetitionReport.score) / 2);

  // C2: Action Verbs
  const C2 = Math.min(4, verbAnalysis.score);

  // C3: Quantifiable Metrics
  const C3 = Math.min(4, quantReport.score);

  // C4: Clarity & Readability
  // FK grade 8–12 = best for resume, 5–7 = too simple, 13+ = too complex
  let C4 = 2;
  const fk = readability.fleschKincaid || 0;
  if (fk >= 8 && fk <= 12) C4 = 4;
  else if (fk >= 6 && fk < 8) C4 = 3;
  else if (fk >= 5) C4 = 2;
  else C4 = 1;

  // C5: Conciseness (penalise fluff + repetition)
  const C5 = Math.min(4, Math.round((fluffReport.score + repetitionReport.score) / 2));

  const total = Math.round((C1 + C2 + C3 + C4 + C5) * 10) / 10;

  const suggestions = [];
  if (C2 < 3 && verbAnalysis.weak?.length > 0) {
    const examples = verbAnalysis.weak.slice(0, 3).map(w =>
      w.verb ? `"${w.verb}" in "${w.bullet}"` : `Bullet doesn't start with a verb: "${w.bullet}"`
    );
    suggestions.push(mkSuggestion('high', 'content',
      `${verbAnalysis.weak.length} bullet points use weak or missing action verbs. Start every bullet with a strong, specific verb.`,
      6, examples.join(' | ')
    ));
  }
  if (C3 < 3) suggestions.push(mkSuggestion('high', 'content',
    `Only ${quantReport.count} bullet point(s) contain measurable achievements. Add specific numbers, percentages, dollar amounts, or team sizes`, 8
  ));
  if (fluffReport.found?.length > 0) suggestions.push(mkSuggestion('medium', 'content',
    `Remove ${fluffReport.found.length} buzzword(s): "${fluffReport.found.slice(0, 4).join('", "')}" — these are overused and hurt your credibility`, 4,
    fluffReport.found.join(', ')
  ));
  if (repetitionReport.repeated?.length > 0) {
    const top = repetitionReport.repeated.slice(0, 3).map(r => `"${r.word}" (${r.count}x)`).join(', ');
    suggestions.push(mkSuggestion('low', 'content',
      `Overused words detected: ${top} — vary your language to improve readability`, 2
    ));
  }

  return {
    scores: { C1: Math.round(C1 * 10) / 10, C2, C3, C4, C5, total },
    meta: {
      strongVerbs:       verbAnalysis.strong?.slice(0, 10) || [],
      weakVerbCount:     verbAnalysis.weak?.length || 0,
      verbDiversity:     verbAnalysis.diversity || 0,
      quantifiedBullets: quantReport.count,
      quantExamples:     quantReport.examples?.slice(0, 3) || [],
      fluffWords:        fluffReport.found || [],
      readability:       readability,
      tenseConsistent:   tenseReport.consistent,
      repeatedWords:     repetitionReport.repeated?.slice(0, 5) || [],
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// scoreD — ATS Compatibility (20 pts)
// D1: Keyword Optimization  max 6
// D2: Parsing Friendliness  max 5
// D3: Format Safety          max 5
// D4: File Format            max 4
// ─────────────────────────────────────────────────────────────
function scoreD(kwReport, formatReport, atsSimulation) {
  const D1 = Math.min(6, kwReport.score);
  const D2 = Math.min(5, formatReport.parseabilityScore);
  const D3 = Math.min(5, formatReport.formatSafeScore);
  const D4 = Math.min(4, formatReport.fileFormatScore);

  const total = Math.round((D1 + D2 + D3 + D4) * 10) / 10;

  const suggestions = [];
  if (D1 < 4) suggestions.push(mkSuggestion('high', 'keywords',
    `Low keyword density — only ${kwReport.totalFound || 0} industry keywords found. Add these missing critical keywords: ${(kwReport.missing || []).slice(0, 5).join(', ')}`, 8
  ));
  if (formatReport.issues?.length > 0) suggestions.push(mkSuggestion('high', 'format',
    `ATS parsing issues detected: ${formatReport.issues.join('; ')}`, 10
  ));
  if (formatReport.warnings?.length > 0) suggestions.push(mkSuggestion('medium', 'format',
    formatReport.warnings[0], 4
  ));

  return {
    scores: { D1, D2, D3, D4, total },
    meta: {
      keywordsFound:   kwReport.totalFound || 0,
      keywordsMissing: (kwReport.missing || []).slice(0, 10),
      atsSimulation,
      formatIssues:    formatReport.issues || [],
      formatWarnings:  formatReport.warnings || [],
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// scoreE — Advanced Metrics / Bonus (max +10)
// E1: Career Narrative      +2
// E2: Personal Branding     +2
// E3: Industry Alignment    +2
// E4: Skill Recency         +2
// E5: Cultural Fit Indicators +2
// ─────────────────────────────────────────────────────────────
function scoreE(resumeData, domainInference, kwReport, expAnalysis) {
  const info    = resumeData.personal_info || {};
  const exp     = resumeData.experience    || [];
  const skills  = resumeData.skills        || [];
  const summary = resumeData.professional_summary || '';
  const fullText = buildFullText(resumeData);

  // E1: Career Narrative — is there a clear progression?
  // Checks: summary present + role titles show progression + chronological order
  let E1 = 0;
  if (summary.length >= 50) E1 += 1;
  if (exp.length >= 2) {
    // Check for progressive titles (junior → senior, analyst → manager, etc.)
    const PROGRESSION_WORDS = ['senior','lead','principal','manager','director','head','chief','vp','president'];
    const hasProgression = exp.some(e =>
      PROGRESSION_WORDS.some(p => (e.position || '').toLowerCase().includes(p))
    );
    if (hasProgression) E1 += 1;
  }

  // E2: Personal Branding — LinkedIn, GitHub, portfolio, professional email
  let E2 = 0;
  if (/linkedin\.com/i.test(info.linkedin || ''))  E2 += 0.8;
  if (/github\.com/i.test(info.website || info.linkedin || '')) E2 += 0.8;
  if (info.website?.trim() && !/linkedin|github/i.test(info.website)) E2 += 0.4; // personal portfolio
  const hasProfEmail = /gmail|outlook|yahoo|hotmail/i.test(info.email || '');
  if (!hasProfEmail && info.email) E2 = Math.min(2, E2 + 0.5); // custom domain = bonus
  E2 = Math.min(2, E2);

  // E3: Industry Alignment
  const E3 = Math.min(2, domainInference.confidence >= 60 ? 2 :
                          domainInference.confidence >= 40 ? 1.5 :
                          domainInference.confidence >= 20 ? 1 : 0.5);

  // E4: Skill Recency — are top skills in-demand current skills?
  const CURRENT_HOT_SKILLS = new Set([
    'ai','machine learning','deep learning','llm','langchain','pytorch','tensorflow',
    'kubernetes','terraform','rust','go','typescript','react','next.js','graphql',
    'devops','mlops','devsecops','cloud','aws','gcp','azure','data engineering',
    'spark','dbt','snowflake','vector database','rag','prompt engineering',
  ]);
  const userSkillsLower = skills.map(s => s.toLowerCase());
  const hotSkillMatches = userSkillsLower.filter(s =>
    [...CURRENT_HOT_SKILLS].some(h => s.includes(h))
  ).length;
  const E4 = hotSkillMatches >= 3 ? 2 : hotSkillMatches >= 2 ? 1.5 : hotSkillMatches >= 1 ? 1 : 0;

  // E5: Cultural Fit — mentions of culture / values / soft skills
  const CULTURE_INDICATORS = [
    'mentor','coach','diversity','inclusion','sustainability','innovation',
    'community','volunteer','open source','contribute','collaborate','impact',
    'mission','values','culture','remote','distributed','cross-functional',
  ];
  const textLower = fullText.toLowerCase();
  const cultureHits = CULTURE_INDICATORS.filter(c => textLower.includes(c)).length;
  const E5 = cultureHits >= 4 ? 2 : cultureHits >= 2 ? 1 : 0;

  const total = Math.round((E1 + E2 + E3 + E4 + E5) * 10) / 10;

  const suggestions = [];
  if (E1 < 1.5 && !summary) suggestions.push(mkSuggestion('medium', 'content',
    'Add a Professional Summary (3–4 sentences) that tells your career story and value proposition', 5
  ));
  if (E2 < 1) suggestions.push(mkSuggestion('medium', 'general',
    'Add your LinkedIn URL and GitHub/portfolio link to strengthen your personal brand', 4
  ));
  if (E4 < 1) suggestions.push(mkSuggestion('low', 'keywords',
    'Add in-demand skills like cloud technologies, AI/ML tools, or modern frameworks relevant to your field', 3
  ));

  return {
    scores: {
      E1: Math.round(E1 * 10) / 10,
      E2: Math.round(E2 * 10) / 10,
      E3: Math.round(E3 * 10) / 10,
      E4: Math.round(E4 * 10) / 10,
      E5: Math.round(E5 * 10) / 10,
      total,
    },
    meta: {
      domainInference,
      hotSkillMatches,
      cultureIndicators: cultureHits,
      hasLinkedIn: /linkedin\.com/i.test(info.linkedin || ''),
      hasGitHub:   /github\.com/i.test(info.website || info.linkedin || ''),
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// generateScoreLabel(score) → human label
// ─────────────────────────────────────────────────────────────
function generateScoreLabel(score) {
  if (score >= 90) return { label: 'Excellent',   color: '#10b981', emoji: '🏆' };
  if (score >= 75) return { label: 'Great',        color: '#3b82f6', emoji: '⭐' };
  if (score >= 60) return { label: 'Good',         color: '#f59e0b', emoji: '✅' };
  if (score >= 45) return { label: 'Fair',         color: '#f97316', emoji: '⚠️' };
  return                  { label: 'Needs Work',   color: '#ef4444', emoji: '🔧' };
}

// ─────────────────────────────────────────────────────────────
// generateSmartSuggestions(allSuggestions, scores) → prioritised list
// Deduplicates + ranks suggestions by impact
// ─────────────────────────────────────────────────────────────
function generateSmartSuggestions(allSuggestions, scores) {
  const priority = { high: 3, medium: 2, low: 1 };

  return allSuggestions
    .sort((a, b) => {
      const pDiff = (priority[b.priority] || 0) - (priority[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return (b.impact || 0) - (a.impact || 0);
    })
    .slice(0, 20); // Top 20 suggestions
}

// ─────────────────────────────────────────────────────────────
// analyzeResume(resumeData, source)
// ─────────────────────────────────────────────────────────────
// source: 'builder' | 'upload'
// Returns complete ATSAnalysis object
// ─────────────────────────────────────────────────────────────
export async function analyzeResume(resumeData, source = 'builder') {
  // ── Phase 1: Extract raw data ──────────────────────────────
  const fullText       = buildFullText(resumeData);
  const bullets        = extractBullets(resumeData.experience || []);
  const info           = resumeData.personal_info || {};
  const skills         = resumeData.skills || [];

  // ── Phase 2: NLP Analysis ─────────────────────────────────
  const [
    contactAnalysis,
    expAnalysis,
    eduAnalysis,
    skillsAnalysis,
    projAnalysis,
    verbAnalysis,
    quantReport,
    readability,
    fluffReport,
    tenseReport,
    repetitionReport,
    summaryAnalysis,
  ] = await Promise.all([
    Promise.resolve(analyzeContactInfo(info)),
    Promise.resolve(analyzeExperience(resumeData.experience || [])),
    Promise.resolve(analyzeEducation(resumeData.education || [])),
    Promise.resolve(analyzeSkills(skills, fullText)),
    Promise.resolve(analyzeProjects(resumeData.project || [])),
    Promise.resolve(analyzeActionVerbs(bullets)),
    Promise.resolve(detectQuantification(bullets)),
    Promise.resolve(computeReadability(fullText)),
    Promise.resolve(detectFluffWords(fullText)),
    Promise.resolve(detectTenseConsistency(bullets)),
    Promise.resolve(detectRepetition(bullets)),
    Promise.resolve(analyzeSummary(resumeData.professional_summary || '')),
  ]);

  // ── Phase 3: Keyword & Domain Analysis ───────────────────
  const domainInference = inferDomain(fullText, skills);
  const tfidfKeywords   = extractTfIdfKeywords(fullText);
  const kwReport        = analyzeKeywordDensity(fullText, domainInference.domain, skills);
  const formatReport    = analyzeFormatSafety(resumeData, source);
  const atsSimulation   = simulateATS(resumeData, kwReport, {});

  // ── Phase 4: Scoring ───────────────────────────────────────
  const sectionA = scoreA(resumeData, formatReport);
  const sectionB = scoreB(resumeData, expAnalysis, eduAnalysis, skillsAnalysis, projAnalysis, contactAnalysis, quantReport);
  const sectionC = scoreC(resumeData, verbAnalysis, quantReport, readability, fluffReport, tenseReport, repetitionReport);
  const sectionD = scoreD(kwReport, formatReport, atsSimulation);
  const sectionE = scoreE(resumeData, domainInference, kwReport, expAnalysis);

  // ── Phase 5: Final Score ───────────────────────────────────
  const baseScore  = sectionA.scores.total + sectionB.scores.total + sectionC.scores.total + sectionD.scores.total;
  const bonusScore = sectionE.scores.total;
  const finalScore = Math.min(100, Math.round(baseScore + bonusScore));

  const scoreLabel = generateScoreLabel(finalScore);

  // ── Phase 6: Collect all suggestions ─────────────────────
  const allSuggestions = [
    ...sectionA.suggestions,
    ...sectionB.suggestions,
    ...sectionC.suggestions,
    ...sectionD.suggestions,
    ...sectionE.suggestions,
  ];
  const suggestions = generateSmartSuggestions(allSuggestions, finalScore);

  // ── Phase 7: Build full report ────────────────────────────
  return {
    // ─── Scores ───────────────────────────────────────────
    scores: {
      final:     finalScore,
      base:      Math.round(baseScore),
      bonus:     Math.round(bonusScore),
      label:     scoreLabel,

      // Category totals (out of max)
      structure:    { score: sectionA.scores.total, max: 25 },
      content:      { score: sectionB.scores.total, max: 35 },
      writing:      { score: sectionC.scores.total, max: 20 },
      ats:          { score: sectionD.scores.total, max: 20 },
      advanced:     { score: sectionE.scores.total, max: 10 },

      // Sub-scores for detailed breakdown
      breakdown: {
        A: sectionA.scores,
        B: sectionB.scores,
        C: sectionC.scores,
        D: sectionD.scores,
        E: sectionE.scores,
      },
    },

    // ─── Analysis data ────────────────────────────────────
    contact: {
      ...contactAnalysis,
      score: sectionB.scores.B1,
    },
    experience: {
      ...expAnalysis,
      bullets: undefined, // don't store full text in report
      totalBullets: expAnalysis.totalBullets,
    },
    education:  eduAnalysis,
    skills:     skillsAnalysis,
    projects:   projAnalysis,
    summary:    summaryAnalysis,

    // ─── Writing quality ──────────────────────────────────
    writing: {
      actionVerbs: {
        strong:      verbAnalysis.strong,
        weakCount:   verbAnalysis.weak?.length || 0,
        weakSamples: verbAnalysis.weak?.slice(0, 5) || [],
        diversity:   verbAnalysis.diversity,
        strongRatio: verbAnalysis.strongRatio,
      },
      quantification: {
        count:    quantReport.count,
        ratio:    quantReport.ratio,
        examples: quantReport.examples,
      },
      readability,
      fluff: {
        found: fluffReport.found,
        count: fluffReport.count,
      },
      tenseConsistency: {
        consistent:          tenseReport.consistent,
        inconsistencyRatio:  tenseReport.inconsistencyRatio,
      },
      repetition: {
        words: repetitionReport.repeated?.slice(0, 8) || [],
      },
    },

    // ─── Keywords ─────────────────────────────────────────
    keywords: {
      found:        kwReport.found,
      missing:      kwReport.missing,
      density:      kwReport.density,
      totalFound:   kwReport.totalFound,
      tfidf:        tfidfKeywords.slice(0, 20),
      domain:       domainInference,
    },

    // ─── ATS Compatibility ────────────────────────────────
    atsCompatibility: {
      simulation: atsSimulation,
      format:     formatReport,
    },

    // ─── Advanced ─────────────────────────────────────────
    advanced: sectionE.meta,

    // ─── Suggestions (prioritised) ───────────────────────
    suggestions,

    // ─── Meta ─────────────────────────────────────────────
    meta: {
      source,
      wordCount:    sectionA.meta.wordCount,
      sectionCount: sectionA.meta.sectionCount,
      analyzedAt:   new Date().toISOString(),
      engineVersion: '2.0.0',
    },
  };
}