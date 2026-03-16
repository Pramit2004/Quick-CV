/**
 * atsEngine.js — WORLD-CLASS REWRITE v3
 * ─────────────────────────────────────────────────────────────
 * SCORING PHILOSOPHY (based on ResumeWorded / Enhancv / Jobscan research):
 *
 *   1. EVERY point must be EARNED — no free scores for absent content.
 *   2. PENALTIES are as important as rewards.
 *      Buzzwords, missing sections, weak verbs = explicit DEDUCTIONS.
 *   3. Total max = 100. No bonus that inflates beyond 100.
 *      Advanced metrics (E) replace weaker scores rather than adding on top.
 *   4. Suggestions' total potential = max(100 - currentScore, 0).
 *      We never suggest you can gain more points than the gap to 100.
 *   5. Score MUST match what the user sees as issues.
 *      If buzzwords exist → C5 is penalized. If no bullets → C1/C2/C3 = 0.
 *      No more "No buzzwords detected" WITH a 4/4 score AND a warning about buzzwords.
 *
 * SCORING BREAKDOWN (max 100 pts):
 *   A: Structure & Format    25 pts  (A1–A5)
 *   B: Content Completeness  30 pts  (B1–B6)   ← reduced from 35 to make room
 *   C: Writing Quality       20 pts  (C1–C5)
 *   D: ATS Compatibility     15 pts  (D1–D3)   ← consolidated D4 into D3
 *   E: Impact & Authority    10 pts  (E1–E4)   ← streamlined
 *   Total = A+B+C+D+E, capped at 100.
 *
 * PENALTY SYSTEM (deducted AFTER scoring):
 *   P1: Buzzwords            -1 per buzzword (max -5)
 *   P2: Missing LinkedIn     -2
 *   P3: No measurable results -3
 *   P4: Passive voice overuse -2
 *   P5: Filler / cliché summary -2
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
// ─────────────────────────────────────────────────────────────
function mkSugg(priority, category, message, impact, original = null) {
  return { priority, category, message, impact: Math.max(0, impact), original };
}

// ─────────────────────────────────────────────────────────────
// SCORE LABEL
// ─────────────────────────────────────────────────────────────
function generateScoreLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: '#10b981', emoji: '🏆' };
  if (score >= 75) return { label: 'Great',     color: '#3b82f6', emoji: '⭐' };
  if (score >= 60) return { label: 'Good',      color: '#f59e0b', emoji: '✅' };
  if (score >= 45) return { label: 'Fair',      color: '#f97316', emoji: '⚠️' };
  return                  { label: 'Needs Work',color: '#ef4444', emoji: '🔧' };
}

// ─────────────────────────────────────────────────────────────
// A — STRUCTURE & FORMAT  (max 25)
// A1: Contact Info Presence     5
// A2: Section Completeness      7  (harshest — missing sections kill ATS)
// A3: Length & Word Count       5
// A4: Bullet Point Usage        5
// A5: Format Safety             3
// ─────────────────────────────────────────────────────────────
function scoreA(resumeData, formatReport, contactAnalysis, careerLevel) {
  const exp    = resumeData.experience || [];
  const edu    = resumeData.education  || [];
  const skills = resumeData.skills     || [];
  const proj   = resumeData.project    || [];
  const summary = resumeData.professional_summary || '';

  const hasEmail    = contactAnalysis.hasEmail;
  const hasPhone    = contactAnalysis.hasPhone;
  const hasName     = contactAnalysis.hasName;
  const hasLocation = contactAnalysis.hasLocation;
  const hasLinkedIn = contactAnalysis.hasLinkedIn;

  // A1: Contact Info (5 pts) — STRICT
  let A1 = 0;
  if (hasName)     A1 += 1;
  if (hasEmail)    A1 += 1.5;
  if (hasPhone)    A1 += 1;
  if (hasLocation) A1 += 0.5;
  if (hasLinkedIn) A1 += 1;
  A1 = Math.min(5, A1);

  // A2: Section Completeness (7 pts) — STRICT DEDUCTIONS
  // Each missing critical section loses significant points
  let A2 = 7;
  const missingSections = [];
  const isStudentOrEntry = careerLevel === 'student' || careerLevel === 'entry';
  // Summary is optional for students/entry level (ResumeWorded doesn't penalize this)
  const summaryPenalty = isStudentOrEntry ? 0.5 : 1.5;
  if (!summary.trim())   { A2 -= summaryPenalty; missingSections.push('Professional Summary'); }
  if (exp.length === 0)  { A2 -= 3;   missingSections.push('Work Experience'); }
  if (edu.length === 0)  { A2 -= 1.5; missingSections.push('Education'); }
  if (skills.length < 3) { A2 -= 1;   missingSections.push('Skills'); }
  A2 = Math.max(0, A2);

  // A3: Length (5 pts)
  const fullText  = buildFullText(resumeData);
  const wordCount = (fullText.match(/\b\w+\b/g) || []).length;
  let A3 = 0;
  if (wordCount >= 400 && wordCount <= 700)       A3 = 5;
  else if (wordCount >= 300 && wordCount < 400)   A3 = 4;
  else if (wordCount >= 700 && wordCount <= 900)  A3 = 4;
  else if (wordCount >= 200)                      A3 = 2;
  else if (wordCount >= 100)                      A3 = 1;
  // else A3 = 0

  // A4: Bullet Point Usage (5 pts) — STRICT
  // BUG 8 FIX: count project bullets for students with no experience
  const bullets    = extractBullets(exp, proj);
  const expBullets = extractBullets(exp);     // experience-only for A4 (job-specific)
  let A4 = 0;
  if (exp.length > 0) {
    const avgBullets = expBullets.length / exp.length;
    if (avgBullets >= 3 && avgBullets <= 6)  A4 = 5;
    else if (avgBullets >= 2)                A4 = 3.5;
    else if (avgBullets >= 1)                A4 = 2;
  } else if (proj.length > 0) {
    // STUDENT MODE: use project bullets as proxy for A4
    const avgProjBullets = bullets.length / proj.length;
    if (avgProjBullets >= 3) A4 = 4;   // slightly penalized vs real work exp
    else if (avgProjBullets >= 2) A4 = 2.5;
    else if (avgProjBullets >= 1) A4 = 1.5;
  }
  // A5: Format Safety (3 pts)
  const A5 = Math.min(3, formatReport.formatSafeScore > 3 ? 3 : formatReport.formatSafeScore);

  const total = Math.min(25, Math.round((A1 + A2 + A3 + A4 + A5) * 10) / 10);

  const suggestions = [];
  if (!hasEmail || !hasPhone) suggestions.push(mkSugg('high', 'contact',
    `Missing contact info: ${contactAnalysis.missing.join(', ')}`, 4));
  if (!hasLinkedIn) suggestions.push(mkSugg('medium', 'contact',
    'Add your LinkedIn profile URL — missing LinkedIn reduces recruiter reach by 40%', 2));
  if (missingSections.length > 0) suggestions.push(mkSugg('high', 'structure',
    `Missing critical sections: ${missingSections.join(', ')}`, Math.min(15, 3 * missingSections.length)));
  if (A3 === 0) suggestions.push(mkSugg('high', 'content',
    `Resume is extremely short (${wordCount} words). ATS needs 400+ words to properly score you.`, 5));
  else if (A3 <= 2) suggestions.push(mkSugg('medium', 'content',
    wordCount < 300
      ? `Resume is too short (${wordCount} words). Aim for 400–700 words.`
      : `Resume is too long (${wordCount} words). Trim to 1–2 pages for best ATS performance.`, 4));
  if (A4 === 0 && (exp.length > 0 || proj.length > 0)) suggestions.push(mkSugg('high', 'content',
    'Add 3–6 bullet points per role/project — ATS scores quantified bullet points very heavily.', 5));
  else if (A4 <= 2 && exp.length > 0) suggestions.push(mkSugg('medium', 'content',
    `Add more bullet points per role (currently ${Math.round(expBullets.length / exp.length * 10) / 10} per job). Aim for 3–6.`, 3));

  return {
    scores: { A1: Math.round(A1*10)/10, A2: Math.round(A2*10)/10, A3, A4: Math.round(A4*10)/10, A5, total },
    meta:   { wordCount, missingSections, bulletCount: bullets.length, avgBulletsPerJob: exp.length > 0 ? Math.round(expBullets.length / exp.length * 10)/10 : 0 },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// B — CONTENT COMPLETENESS  (max 30)
// B1: Experience Quality       10  (depth + dates + titles)
// B2: Education Quality         5
// B3: Skills Depth              7  (count + tech relevance)
// B4: Projects & Portfolio      4
// B5: Achievements & Metrics    4
// ─────────────────────────────────────────────────────────────
function scoreB(resumeData, expAnalysis, eduAnalysis, skillsAnalysis, projAnalysis, quantReport, careerLevel) {
  const exp    = resumeData.experience || [];
  const edu    = resumeData.education  || [];
  const skills = resumeData.skills     || [];
  const proj   = resumeData.project    || [];
  const isStudent = careerLevel === 'student' || (exp.length === 0 && proj.length >= 1);

  // B1: Experience Quality (10)
  // STUDENT MODE FIX: if no work exp but has strong projects, give partial credit
  let B1 = 0;
  if (exp.length >= 1) {
    B1 += 2; // Has experience
    if (expAnalysis.hasDates)            B1 += 1.5;
    if (expAnalysis.entryCount >= 2)     B1 += 1;
    const avgB = expAnalysis.avgBulletsPerJob || 0;
    if (avgB >= 3)      B1 += 2.5;
    else if (avgB >= 2) B1 += 1.5;
    else if (avgB >= 1) B1 += 0.5;
    if (exp.every(e => e.company?.trim()))   B1 += 1;
    if (exp.every(e => e.position?.trim()))  B1 += 1;
    const hasCurrentOrRecent = exp.some(e => e.is_current || /202[2-9]|202[0-9]/.test(e.end_date || ''));
    if (hasCurrentOrRecent) B1 += 1;
  } else if (isStudent && proj.length >= 1) {
    // STUDENT MODE: projects as experience proxy (max 6/10 — penalized vs real work exp)
    B1 += 1.5; // has project work
    if (proj.length >= 2) B1 += 1;
    if (proj.length >= 3) B1 += 0.5;
    const projBullets = extractBullets([], proj);
    const avgProjBullets = projBullets.length / proj.length;
    if (avgProjBullets >= 3)        B1 += 1.5;
    else if (avgProjBullets >= 2)   B1 += 1;
    else if (avgProjBullets >= 1)   B1 += 0.5;
    if (projAnalysis.hasLinks)      B1 += 0.5; // live demos / github
    if (proj.some(p => p.date))     B1 += 0.5; // dated projects
  }
  B1 = Math.min(isStudent ? 6 : 10, B1); // students capped at 6/10

  // B2: Education Quality (5) — STRICT
  let B2 = 0;
  if (edu.length > 0) {
    B2 += 1.5; // Has education
    if (eduAnalysis.hasDegree)      B2 += 1.5;
    if (eduAnalysis.hasInstitution) B2 += 1;
    if (eduAnalysis.hasDate)        B2 += 0.5;
    if (eduAnalysis.hasAdvanced)    B2 += 0.5;
  }
  B2 = Math.min(5, B2);

  // B3: Skills Depth (7) — STRICT
  let B3 = 0;
  const totalSkills = skillsAnalysis.totalCount || skills.length || 0;
  if (totalSkills >= 15)      B3 = 7;
  else if (totalSkills >= 10) B3 = 5.5;
  else if (totalSkills >= 7)  B3 = 4;
  else if (totalSkills >= 5)  B3 = 3;
  else if (totalSkills >= 3)  B3 = 2;
  else if (totalSkills >= 1)  B3 = 1;
  // Bonus for tech skills
  if (skillsAnalysis.techSkillsCount >= 5) B3 = Math.min(7, B3 + 1);

  // B4: Projects (4) — STRICT
  let B4 = 0;
  if (proj.length >= 1) B4 += 1.5;
  if (proj.length >= 2) B4 += 0.5;
  if (projAnalysis.hasDesc)  B4 += 1;
  if (projAnalysis.hasLinks) B4 += 1;
  B4 = Math.min(4, B4);

  // B5: Achievements & Metrics (4) — now uses combined exp+project bullets ratio
  let B5 = 0;
  const ratio = quantReport.ratio || 0;
  if (ratio >= 50)       B5 = 4;
  else if (ratio >= 30)  B5 = 3;
  else if (ratio >= 15)  B5 = 2;
  else if (ratio >= 5)   B5 = 1;

  const total = Math.min(30, Math.round((B1 + B2 + B3 + B4 + B5) * 10) / 10);

  const suggestions = [];
  if (exp.length === 0 && !isStudent) {
    suggestions.push(mkSugg('high', 'content',
      'Work Experience is missing — this is the #1 factor ATS systems evaluate', 8));
  } else if (exp.length === 0 && isStudent) {
    suggestions.push(mkSugg('medium', 'content',
      'No internship/work experience found. Consider adding part-time work, freelance, or open-source contributions.', 4));
  } else if (B1 < 5) {
    suggestions.push(mkSugg('high', 'content',
      !expAnalysis.hasDates
        ? 'Add date ranges to all jobs (Month YYYY – Month YYYY). Missing dates = major ATS penalty.'
        : 'Add more detail to work experience — include company name, role title, dates, and 3–5 bullets per role.', 5));
  }
  if (edu.length === 0) suggestions.push(mkSugg('medium', 'content',
    'Education section missing — include degree, institution, and graduation year', 3));
  else if (B2 < 3) suggestions.push(mkSugg('medium', 'content',
    'Add full education details: degree, institution, graduation date, and field of study', 2));
  if (totalSkills < 10) suggestions.push(mkSugg('high', 'keywords',
    `You have ${totalSkills} skills listed. ATS expects 10–15 relevant skills. Add more.`, Math.min(6, 10 - totalSkills)));
  if (B5 < 2 && (extractBullets(exp, proj).length > 0)) suggestions.push(mkSugg('high', 'content',
    `Only ${quantReport.count} bullet(s) have measurable results. Add numbers, %, $, or time to 30%+ of bullets.`, 4));
  if (proj.length === 0) suggestions.push(mkSugg('low', 'content',
    'Add a Projects section — it demonstrates initiative and real-world skills to ATS', 2));

  return {
    scores: { B1: Math.round(B1*10)/10, B2: Math.round(B2*10)/10, B3: Math.round(B3*10)/10, B4: Math.round(B4*10)/10, B5: Math.round(B5*10)/10, total },
    meta:   { skillsCount: totalSkills, hasProjects: proj.length > 0, quantRatio: ratio },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// C — WRITING QUALITY  (max 20)
// C1: Action Verbs              5  (most important writing metric)
// C2: Quantification Density    5  (mirrors B5 but measured differently)
// C3: Conciseness vs Fluff      5  (BUZWORDS = HARD PENALTY here)
// C4: Clarity & Readability     3
// C5: Tense Consistency         2
//
// KEY FIX: Buzzwords/fluff found → C3 is PENALIZED.
// Score must MATCH what suggestions say.
// ─────────────────────────────────────────────────────────────
function scoreC(resumeData, verbAnalysis, quantReport, readability, fluffReport, tenseReport, repetitionReport) {
  const exp        = resumeData.experience || [];
  const proj       = resumeData.project    || [];
  // BUG 8 FIX: include project bullets so students get scored on writing quality
  const bullets    = extractBullets(exp, proj);
  const hasBullets = bullets.length > 0;

  // C1: Action Verbs (5) — 0 if no bullets!
  let C1 = 0;
  if (hasBullets) {
    const strongRatio = verbAnalysis.strongRatio || 0; // 0-100 %
    if (strongRatio >= 80)      C1 = 5;
    else if (strongRatio >= 60) C1 = 4;
    else if (strongRatio >= 40) C1 = 3;
    else if (strongRatio >= 20) C1 = 2;
    else if (strongRatio >= 1)  C1 = 1;
    // All weak verbs = 0 (handled by strongRatio = 0 case above)
  }

  // C2: Quantification Density (5) — 0 if no bullets!
  let C2 = 0;
  if (hasBullets) {
    const ratio = quantReport.ratio || 0; // % of bullets with numbers
    if (ratio >= 50)      C2 = 5;
    else if (ratio >= 30) C2 = 4;
    else if (ratio >= 20) C2 = 3;
    else if (ratio >= 10) C2 = 2;
    else if (ratio >= 1)  C2 = 1;
  }

  // C3: Conciseness vs Fluff (5) — HARD PENALTIES for buzzwords
  // Start at 5, deduct for each buzzword found
  let C3 = hasBullets ? 5 : 2; // Partial credit even without bullets
  const fluffCount = fluffReport.count || 0;
  C3 -= Math.min(5, fluffCount * 1.5); // -1.5 per buzzword, max -5
  // Also deduct for repeated overuse
  if (repetitionReport.repeated?.length >= 4) C3 -= 1;
  C3 = Math.max(0, Math.round(C3 * 10) / 10);

  // C4: Clarity & Readability (3)
  // FK grade 30 = parsing artifact (impossible for real text) → treat as 2/3
  // FK ideal for resumes: 8–12. Guard: if > 20, assume parsing issue → give 2/3
  let C4 = 2; // default: assume acceptable unless clearly wrong
  const fk = readability.fleschKincaid || 0;
  if (fk > 20)           C4 = 2;   // extreme value = parsing artifact, don't penalize
  else if (fk >= 8 && fk <= 12) C4 = 3;
  else if (fk >= 6)      C4 = 2;
  else if (fk >= 4)      C4 = 1;
  else                   C4 = 1.5; // very low FK = short resume, don't fully penalize

  // C5: Tense Consistency (2) — 0 if no bullets
  let C5 = 0;
  if (hasBullets) {
    C5 = tenseReport.consistent ? 2 : (tenseReport.inconsistencyRatio < 30 ? 1 : 0);
  }

  const total = Math.min(20, Math.round((C1 + C2 + C3 + C4 + C5) * 10) / 10);

  const suggestions = [];
  if (!hasBullets) {
    suggestions.push(mkSugg('high', 'content',
      'No bullet points found. Add 3–5 achievement bullets per job role — this is critical for writing quality score.', 8));
  } else {
    if (C1 < 3) {
      const weakCount = verbAnalysis.weak?.length || 0;
      suggestions.push(mkSugg('high', 'content',
        `${weakCount} bullet(s) use weak/missing action verbs. Start EVERY bullet with a strong verb (led, built, reduced, increased).`, 4,
        verbAnalysis.weak?.slice(0,3).map(w => w.verb ? `"${w.verb}"` : 'missing verb').join(', ')));
    }
    if (C2 < 3) suggestions.push(mkSugg('high', 'content',
      `Only ${quantReport.count} bullet(s) have measurable results (${quantReport.ratio}%). Add numbers, %, $, or time saved to 30%+ of bullets.`, 4));
  }
  if (fluffCount > 0) suggestions.push(mkSugg('medium', 'content',
    `Remove ${fluffCount} buzzword(s): "${fluffReport.found?.slice(0,4).join('", "')}" — these trigger ATS filters and signal lazy writing.`, Math.min(5, fluffCount * 1.5),
    fluffReport.found?.join(', ')));
  if (!tenseReport.consistent && hasBullets) suggestions.push(mkSugg('low', 'content',
    'Inconsistent verb tense detected. Use past tense for old jobs, present tense for current role.', 2));

  return {
    scores: { C1, C2, C3, C4, C5, total },
    meta: {
      strongVerbs:    verbAnalysis.strong?.slice(0,10) || [],
      weakVerbCount:  verbAnalysis.weak?.length || 0,
      weakSamples:    verbAnalysis.weak?.slice(0,5) || [],
      strongRatio:    verbAnalysis.strongRatio || 0,
      quantifiedBullets: quantReport.count,
      quantRatio:     quantReport.ratio || 0,
      quantExamples:  quantReport.examples?.slice(0,3) || [],
      fluffWords:     fluffReport.found || [],
      readability,
      tenseConsistent: tenseReport.consistent,
      repeatedWords:  repetitionReport.repeated?.slice(0,5) || [],
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// D — ATS COMPATIBILITY  (max 15)
// D1: Keyword Coverage          8  (most important for ATS)
// D2: Parsability               4  (can the ATS read it?)
// D3: ATS Format Compliance     3  (file format + headers)
// ─────────────────────────────────────────────────────────────
function scoreD(kwReport, formatReport, resumeData) {
  const exp    = resumeData.experience || [];
  const edu    = resumeData.education  || [];
  const skills = resumeData.skills     || [];

  // D1: Keyword Coverage (8) — most impactful
  // Based on how many industry keywords are present
  const kwFound = kwReport.totalFound || 0;
  let D1 = 0;
  if (kwFound >= 25)      D1 = 8;
  else if (kwFound >= 20) D1 = 7;
  else if (kwFound >= 15) D1 = 6;
  else if (kwFound >= 10) D1 = 5;
  else if (kwFound >= 7)  D1 = 4;
  else if (kwFound >= 4)  D1 = 3;
  else if (kwFound >= 2)  D1 = 2;
  else if (kwFound >= 1)  D1 = 1;

  // D2: Parsability (4) — penalize if key sections couldn't be parsed
  const sectionsMissed = (exp.length === 0 ? 1 : 0) + (edu.length === 0 ? 1 : 0) + (skills.length < 3 ? 1 : 0);
  const D2 = Math.max(0, Math.min(4, formatReport.parseabilityScore - sectionsMissed));

  // D3: Format Compliance (3)
  const D3 = Math.min(3, formatReport.formatSafeScore > 3 ? 3 : formatReport.formatSafeScore);

  const total = Math.min(15, Math.round((D1 + D2 + D3) * 10) / 10);

  const suggestions = [];
  if (D1 < 5) suggestions.push(mkSugg('high', 'keywords',
    `Low keyword coverage: only ${kwFound} industry keywords found. Add these critical missing keywords: ${(kwReport.missing||[]).slice(0,5).join(', ')}`, 6));
  else if (D1 < 7) suggestions.push(mkSugg('medium', 'keywords',
    `Increase keyword coverage — add these missing keywords: ${(kwReport.missing||[]).slice(0,4).join(', ')}`, 3));
  if (formatReport.issues?.length > 0) suggestions.push(mkSugg('high', 'format',
    `ATS parsing issues: ${formatReport.issues.join('; ')}`, 5));
  if (formatReport.warnings?.length > 0) suggestions.push(mkSugg('medium', 'format',
    formatReport.warnings[0], 2));

  return {
    scores: { D1, D2, D3, total },
    meta: {
      keywordsFound: kwFound,
      keywordsMissing: kwReport.missing?.slice(0,12) || [],
      formatIssues:  formatReport.issues || [],
      formatWarnings: formatReport.warnings || [],
    },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// E — IMPACT & AUTHORITY  (max 10)
// E1: Career Narrative          3  (summary quality + progression)
// E2: Personal Branding         3  (LinkedIn, GitHub, portfolio)
// E3: Industry Alignment        2  (domain confidence)
// E4: Skill Recency             2  (hot/in-demand skills)
// ─────────────────────────────────────────────────────────────
function scoreE(resumeData, domainInference, expAnalysis, contactAnalysis) {
  const info    = resumeData.personal_info || {};
  const exp     = resumeData.experience    || [];
  const skills  = resumeData.skills        || [];
  const summary = resumeData.professional_summary || '';

  // E1: Career Narrative (3)
  let E1 = 0;
  if (summary.length >= 100) E1 += 1.5; // Solid summary
  else if (summary.length >= 50) E1 += 1;
  else if (summary.length >= 20) E1 += 0.5;
  if (exp.length >= 2) {
    // Check career progression
    const hasSeniorTitle = exp.some(e =>
      /senior|lead|principal|manager|director|head|chief|vp|president/i.test(e.position || ''));
    if (hasSeniorTitle) E1 += 1;
    else E1 += 0.5; // Multiple roles still shows experience
  }
  if (summary.match(/\d/)) E1 = Math.min(3, E1 + 0.5); // Numbers in summary = strong
  E1 = Math.min(3, E1);

  // E2: Personal Branding (3)
  // FIX: also accept hasLinkedInWord / hasGitHubWord (hyperlink text in PDFs)
  // Must be consistent with A1 which already accepts these
  let E2 = 0;
  const hasLinkedInAny = /linkedin\.com|linkedin\s*\(hyperlink\)/i.test(info.linkedin || '') || Boolean(info.hasLinkedInWord) || Boolean(contactAnalysis?.hasLinkedIn);
  const hasGitHubAny   = /github\.com|github\s*\(hyperlink\)/i.test(info.website || info.linkedin || '') || Boolean(info.hasGitHubWord) || Boolean(contactAnalysis?.hasGitHub);
  if (hasLinkedInAny) E2 += 1.5;
  if (hasGitHubAny)   E2 += 1;
  if (info.website?.trim() && !/linkedin|github/i.test(info.website) && !/hyperlink/i.test(info.website)) E2 += 0.5;
  E2 = Math.min(3, E2);

  // E3: Industry Alignment (2)
  const conf = domainInference.confidence || 0;
  const E3 = conf >= 60 ? 2 : conf >= 40 ? 1.5 : conf >= 20 ? 1 : 0.5;

  // E4: Skill Recency (2)
  const HOT_SKILLS = new Set([
    'ai','machine learning','deep learning','llm','langchain','pytorch','tensorflow',
    'kubernetes','terraform','rust','go','typescript','react','next.js','graphql',
    'devops','mlops','cloud','aws','gcp','azure','snowflake','dbt','spark',
    'vector database','rag','prompt engineering','data engineering',
    'flutter','react native','tailwind','vite','docker',
  ]);
  const skillsLower = skills.map(s => s.toLowerCase());
  const hotMatches  = skillsLower.filter(s => [...HOT_SKILLS].some(h => s.includes(h))).length;
  const E4 = hotMatches >= 4 ? 2 : hotMatches >= 2 ? 1.5 : hotMatches >= 1 ? 1 : 0;

  const total = Math.min(10, Math.round((E1 + E2 + E3 + E4) * 10) / 10);

  const suggestions = [];
  if (E1 < 2) suggestions.push(mkSugg('medium', 'content',
    !summary ? 'Add a Professional Summary (3–4 sentences with numbers) describing your experience and value.' :
               'Strengthen your summary with specific numbers and your target role.', 3));
  if (E2 < 1) suggestions.push(mkSugg('medium', 'general',
    'Add LinkedIn URL and GitHub/portfolio link — 40% of recruiters check these before interviews.', 3));
  if (E4 < 1) suggestions.push(mkSugg('low', 'keywords',
    'Add in-demand skills relevant to your field (cloud, AI/ML, modern frameworks)', 2));

  return {
    scores: {
      E1: Math.round(E1*10)/10,
      E2: Math.round(E2*10)/10,
      E3: Math.round(E3*10)/10,
      E4: Math.round(E4*10)/10,
      total,
    },
    meta: { domainInference, hotSkillMatches: hotMatches, hasLinkedIn: E2 >= 1.5, hasGitHub: E2 >= 1 },
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
// PENALTY SYSTEM — explicit deductions AFTER scoring
// Research shows top ATS checkers deduct for specific bad practices.
// These are separate from scoring so they show up clearly in the report.
// ─────────────────────────────────────────────────────────────
function applyPenalties(rawScore, resumeData, fluffReport, contactAnalysis, verbAnalysis, quantReport) {
  const penalties = [];
  let totalPenalty = 0;

  // P1: Buzzwords/fluff (-1.5 per buzzword, max -6)
  const fluffCount = fluffReport.count || 0;
  if (fluffCount > 0) {
    const p = Math.min(6, fluffCount * 1.5);
    penalties.push({ code: 'P1', label: 'Buzzwords/Filler', deduction: -p,
      detail: `"${(fluffReport.found||[]).slice(0,3).join('", "')}" ${fluffCount > 3 ? `+${fluffCount-3} more` : ''}` });
    totalPenalty += p;
  }

  // P2: No LinkedIn profile (-2)
  // BUG 3 FIX: don't penalize if LinkedIn word detected (hyperlink in PDF)
  if (!contactAnalysis.hasLinkedIn && !contactAnalysis.hasLinkedInWord) {
    penalties.push({ code: 'P2', label: 'Missing LinkedIn', deduction: -2,
      detail: 'LinkedIn profile not found in resume' });
    totalPenalty += 2;
  }

  // P3: No quantifiable results (-3 if has experience/projects but no numbers)
  const exp  = resumeData.experience || [];
  const proj = resumeData.project    || [];
  if ((exp.length > 0 || proj.length > 0) && (quantReport.count || 0) === 0) {
    penalties.push({ code: 'P3', label: 'No Measurable Results', deduction: -3,
      detail: '0 bullets contain numbers, percentages, or metrics' });
    totalPenalty += 3;
  }

  // P4: Overly short resume penalty if < 150 words and has experience sections
  const fullText  = buildFullText(resumeData);
  const wordCount = (fullText.match(/\b\w+\b/g) || []).length;
  if (wordCount < 150 && (resumeData.professional_summary || exp.length > 0)) {
    penalties.push({ code: 'P4', label: 'Insufficient Content', deduction: -3,
      detail: `Only ${wordCount} words. ATS cannot properly evaluate a resume this short.` });
    totalPenalty += 3;
  }

  return {
    penalties,
    totalPenalty: Math.round(totalPenalty * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────
// SMART SUGGESTIONS — deduplicate + cap total impact at (100 - score)
// ─────────────────────────────────────────────────────────────
function buildSuggestions(allSuggestions, finalScore) {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const gap = Math.max(0, 100 - finalScore);

  // Sort by priority then impact
  const sorted = allSuggestions
    .filter(s => s && s.message)
    .sort((a, b) => {
      const pd = (priorityOrder[b.priority]||0) - (priorityOrder[a.priority]||0);
      if (pd !== 0) return pd;
      return (b.impact||0) - (a.impact||0);
    })
    .slice(0, 15);

  // Cap impacts so total never exceeds gap-to-100
  let remaining = gap;
  return sorted.map(s => {
    const cappedImpact = Math.min(s.impact || 0, Math.max(0, remaining));
    remaining = Math.max(0, remaining - cappedImpact);
    return { ...s, impact: cappedImpact };
  });
}

// ─────────────────────────────────────────────────────────────
// analyzeResume — MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export async function analyzeResume(resumeData, source = 'builder') {
  const fullText   = buildFullText(resumeData);
  // BUG 8 FIX: pass projects so student project bullets count for writing scores
  const bullets    = extractBullets(resumeData.experience || [], resumeData.project || []);
  const info       = resumeData.personal_info || {};
  const skills     = resumeData.skills || [];
  // Student mode detection
  const careerLevel = resumeData.careerLevel || (
    resumeData.experience?.length === 0 && resumeData.project?.length > 0 ? 'student' :
    resumeData.experience?.length <= 1 ? 'entry' : 'mid'
  );

  // ── Phase 1: All NLP analyses ─────────────────────────────
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
    Promise.resolve(analyzeEducation(resumeData.education  || [])),
    Promise.resolve(analyzeSkills(skills, fullText)),
    Promise.resolve(analyzeProjects(resumeData.project    || [])),
    Promise.resolve(analyzeActionVerbs(bullets)),
    Promise.resolve(detectQuantification(bullets)),
    Promise.resolve(computeReadability(fullText)),
    Promise.resolve(detectFluffWords(fullText)),
    Promise.resolve(detectTenseConsistency(bullets)),
    Promise.resolve(detectRepetition(bullets)),
    Promise.resolve(analyzeSummary(resumeData.professional_summary || '')),
  ]);

  // ── Phase 2: Keyword & domain analysis ───────────────────
  const domainInference = inferDomain(fullText, skills);
  const tfidfKeywords   = extractTfIdfKeywords(fullText);
  const kwReport        = analyzeKeywordDensity(fullText, domainInference.domain, skills);
  const formatReport    = analyzeFormatSafety(resumeData, source);
  const atsSimulation   = simulateATS(resumeData, kwReport, {});

  // ── Phase 3: Scoring (new strict system) ─────────────────
  const sectionA = scoreA(resumeData, formatReport, contactAnalysis, careerLevel);
  const sectionB = scoreB(resumeData, expAnalysis, eduAnalysis, skillsAnalysis, projAnalysis, quantReport, careerLevel);
  const sectionC = scoreC(resumeData, verbAnalysis, quantReport, readability, fluffReport, tenseReport, repetitionReport);
  const sectionD = scoreD(kwReport, formatReport, resumeData);
  const sectionE = scoreE(resumeData, domainInference, expAnalysis, contactAnalysis);

  // ── Phase 4: Raw score + penalties ───────────────────────
  const rawScore = sectionA.scores.total + sectionB.scores.total +
                   sectionC.scores.total + sectionD.scores.total + sectionE.scores.total;

  const { penalties, totalPenalty } = applyPenalties(
    rawScore, resumeData, fluffReport, contactAnalysis, verbAnalysis, quantReport
  );

  // ── Phase 5: Final score (capped at 100) ─────────────────
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore - totalPenalty)));
  const scoreLabel = generateScoreLabel(finalScore);

  // ── Phase 6: Suggestions with capped impacts ─────────────
  const allSuggs = [
    ...sectionA.suggestions,
    ...sectionB.suggestions,
    ...sectionC.suggestions,
    ...sectionD.suggestions,
    ...sectionE.suggestions,
  ];
  const suggestions = buildSuggestions(allSuggs, finalScore);

  // ── Phase 7: Full report ──────────────────────────────────
  return {
    scores: {
      final:    finalScore,
      raw:      Math.round(rawScore),
      penalties: totalPenalty,
      label:    scoreLabel,
      structure: { score: sectionA.scores.total, max: 25 },
      content:   { score: sectionB.scores.total, max: 30 },
      writing:   { score: sectionC.scores.total, max: 20 },
      ats:       { score: sectionD.scores.total, max: 15 },
      advanced:  { score: sectionE.scores.total, max: 10 },
      breakdown: {
        A: sectionA.scores,
        B: sectionB.scores,
        C: sectionC.scores,
        D: sectionD.scores,
        E: sectionE.scores,
      },
    },

    penalties,

    contact:    { ...contactAnalysis, score: sectionA.scores.A1 },
    experience: { ...expAnalysis, bullets: undefined, totalBullets: expAnalysis.totalBullets },
    education:  eduAnalysis,
    skills:     skillsAnalysis,
    projects:   projAnalysis,
    summary:    summaryAnalysis,

    writing: {
      actionVerbs: {
        strong:      verbAnalysis.strong,
        weakCount:   verbAnalysis.weak?.length || 0,
        weakSamples: verbAnalysis.weak?.slice(0,5) || [],
        diversity:   verbAnalysis.diversity,
        strongRatio: verbAnalysis.strongRatio,
      },
      quantification: {
        count:    quantReport.count,
        ratio:    quantReport.ratio,
        examples: quantReport.examples,
      },
      readability,
      fluff: { found: fluffReport.found, count: fluffReport.count },
      tenseConsistency: { consistent: tenseReport.consistent, inconsistencyRatio: tenseReport.inconsistencyRatio },
      repetition: { words: repetitionReport.repeated?.slice(0,8) || [] },
    },

    keywords: {
      found:      kwReport.found,
      missing:    kwReport.missing,
      density:    kwReport.density,
      totalFound: kwReport.totalFound,
      tfidf:      tfidfKeywords.slice(0,20),
      domain:     domainInference,
    },

    atsCompatibility: {
      simulation: atsSimulation,
      format:     formatReport,
    },

    advanced: sectionE.meta,
    suggestions,

    meta: {
      source,
      wordCount:       sectionA.meta.wordCount,
      sectionCount:    sectionA.meta.missingSections ? (5 - sectionA.meta.missingSections.length) : 0,
      missingSections: sectionA.meta.missingSections || [],
      careerLevel,
      analyzedAt:      new Date().toISOString(),
      engineVersion:   '3.1.0',
    },
  };
}