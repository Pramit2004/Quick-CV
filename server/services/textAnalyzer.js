/**
 * textAnalyzer.js
 * ─────────────────────────────────────────────────────────────
 * Core NLP analysis layer using:
 *   • natural       — tokenisation, stemming, TF-IDF, string distance
 *   • compromise    — POS tagging, verb tense, entity detection
 *   • wink-nlp      — readability scores (Flesch-Kincaid, Gunning Fog, SMOG)
 *
 * All functions are PURE — they take text/arrays and return plain objects.
 * No DB access, no external calls.
 * ─────────────────────────────────────────────────────────────
 */

import natural from 'natural';
import nlp     from 'compromise';

// ── natural utilities ─────────────────────────────────────────
const tokenizer  = new natural.WordTokenizer();
const stemmer    = natural.PorterStemmer;
const tfidf      = new natural.TfIdf();

// ─────────────────────────────────────────────────────────────
// STRONG ACTION VERBS — 200+ curated verbs that impress ATS
// Categorised by type for diversity scoring
// ─────────────────────────────────────────────────────────────
export const STRONG_VERBS = new Set([
  // Leadership
  'led','managed','directed','supervised','oversaw','spearheaded','championed',
  'orchestrated','headed','guided','mentored','coached','trained','motivated',
  'inspired','cultivated','empowered','mobilized','unified',
  // Achievement
  'achieved','accomplished','attained','exceeded','surpassed','outperformed',
  'delivered','completed','finished','executed','launched','established',
  'founded','created','built','developed','designed','engineered','architected',
  // Improvement
  'improved','increased','enhanced','optimized','streamlined','accelerated',
  'boosted','elevated','expanded','upgraded','transformed','revolutionized',
  'modernized','revamped','restructured','refined','strengthened',
  // Reduction
  'reduced','decreased','cut','eliminated','minimized','consolidated',
  'simplified','automated','standardized','digitized',
  // Analysis
  'analyzed','evaluated','assessed','researched','investigated','identified',
  'diagnosed','audited','reviewed','tested','validated','measured','tracked',
  'monitored','surveyed','benchmarked','forecasted','modeled',
  // Collaboration
  'collaborated','partnered','coordinated','facilitated','negotiated',
  'communicated','presented','demonstrated','advocated','liaised',
  'consulted','advised','supported','assisted','contributed',
  // Technical
  'implemented','deployed','integrated','configured','maintained','migrated',
  'programmed','coded','scripted','debugged','troubleshot','documented',
  'authored','published','compiled','generated','processed',
  // Business
  'generated','secured','acquired','captured','converted','grew','scaled',
  'strategized','planned','prioritized','allocated','budgeted','managed',
  'administered','operated','maintained',
]);

export const WEAK_VERBS = new Set([
  'worked','helped','did','made','got','went','used','put','came','came',
  'tried','wanted','needed','seemed','felt','thought','knew','said','told',
  'asked','gave','took','had','was','were','been','be','do','does',
  'responsible','involved','assisted','participated',
]);

export const FLUFF_WORDS = new Set([
  'results-driven','self-motivated','team-player','detail-oriented',
  'dynamic','passionate','hardworking','go-getter','synergy','leverage',
  'proactive','innovative','outside the box','think outside','value-add',
  'best of breed','cutting-edge','bleeding-edge','game-changer','disruptive',
  'thought leader','guru','ninja','rockstar','wizard','evangelist',
  'strategic','extensive experience','proven track record','strong background',
]);

// ─────────────────────────────────────────────────────────────
// tokenizeWords(text) → string[]
// Returns lowercase tokens, removing punctuation
// ─────────────────────────────────────────────────────────────
export function tokenizeWords(text) {
  if (!text) return [];
  return tokenizer.tokenize(text.toLowerCase()) || [];
}

// ─────────────────────────────────────────────────────────────
// analyzeActionVerbs(bullets) → { strong[], weak[], diversity, score/4 }
// bullets = array of bullet-point strings
// ─────────────────────────────────────────────────────────────
export function analyzeActionVerbs(bullets) {
  if (!bullets?.length) return { strong: [], weak: [], diversity: 0, score: 0 };

  const strong = [];
  const weak   = [];
  const usedVerbs = new Set();

  for (const bullet of bullets) {
    if (!bullet?.trim()) continue;
    const doc  = nlp(bullet.trim());
    const verbs = doc.verbs().out('array');

    if (verbs.length > 0) {
      const firstVerb = verbs[0].toLowerCase().split(' ')[0];
      const stemmed   = stemmer.stem(firstVerb);

      // Check against strong/weak sets (also check stemmed form)
      let isStrong = STRONG_VERBS.has(firstVerb);
      let isWeak   = WEAK_VERBS.has(firstVerb);

      // Also check original text tokens
      if (!isStrong && !isWeak) {
        const words = tokenizeWords(bullet);
        if (words.length > 0) {
          isStrong = STRONG_VERBS.has(words[0]) || STRONG_VERBS.has(stemmer.stem(words[0]));
          isWeak   = WEAK_VERBS.has(words[0]);
        }
      }

      if (isStrong) {
        strong.push(firstVerb);
        usedVerbs.add(firstVerb);
      } else if (isWeak) {
        weak.push({ verb: firstVerb, bullet: bullet.substring(0, 80) });
      }
    } else {
      // No verb detected — likely starts with noun (bad)
      weak.push({ verb: null, bullet: bullet.substring(0, 80) });
    }
  }

  const totalBullets = bullets.filter(b => b?.trim()).length;
  const strongRatio  = totalBullets > 0 ? strong.length / totalBullets : 0;
  const uniqueVerbs  = new Set(strong).size;
  const diversity    = strong.length > 0 ? uniqueVerbs / strong.length : 0;

  // Score: 0–4
  // 2pts for strong ratio (>70% = 2, >50% = 1.5, >30% = 1)
  // 2pts for diversity (>80% = 2, >60% = 1.5, >40% = 1)
  let score = 0;
  if (strongRatio >= 0.7)      score += 2;
  else if (strongRatio >= 0.5) score += 1.5;
  else if (strongRatio >= 0.3) score += 1;

  if (diversity >= 0.8)        score += 2;
  else if (diversity >= 0.6)   score += 1.5;
  else if (diversity >= 0.4)   score += 1;

  return {
    strong:    [...new Set(strong)],
    weak:      weak.slice(0, 10),
    diversity: Math.round(diversity * 100),
    strongRatio: Math.round(strongRatio * 100),
    score:     Math.min(4, score),
  };
}

// ─────────────────────────────────────────────────────────────
// detectQuantification(bullets) → { count, ratio, examples[], score/4 }
// Detects numbers, percentages, currency, multipliers
// ─────────────────────────────────────────────────────────────
export function detectQuantification(bullets) {
  if (!bullets?.length) return { count: 0, ratio: 0, examples: [], score: 0 };

  // Patterns: 25%, $5M, 3x, 500+ users, 2 years, 40% reduction, #1 ranked
  const QUANT_PATTERNS = [
    /\d+\s*%/gi,                          // percentages: 25%, 100%
    /\$[\d,]+\.?\d*[kmb]?\b/gi,           // currency: $5M, $50,000
    /\d+[kmb]\+?\s*(users|customers|clients|employees|downloads|revenue)/gi,
    /\d+x\s/gi,                           // multipliers: 3x, 10x
    /\d{2,}[\+]?\s/gi,                    // large numbers: 500+, 100
    /\d+\s*(hours|days|weeks|months|years)\b/gi,
    /#\s*1\b|first\s+place\b|ranked\s+first\b/gi,
    /\d+\s*(team|people|engineers|developers|members)\b/gi,
    /reduced\s+by\s+\d+|increased\s+by\s+\d+|improved\s+by\s+\d+/gi,
    /top\s+\d+%\b/gi,
  ];

  let count    = 0;
  const examples = [];

  for (const bullet of bullets) {
    if (!bullet?.trim()) continue;
    let hasQuant = false;
    for (const pattern of QUANT_PATTERNS) {
      if (pattern.test(bullet)) { hasQuant = true; pattern.lastIndex = 0; break; }
      pattern.lastIndex = 0;
    }
    if (hasQuant) {
      count++;
      if (examples.length < 5) examples.push(bullet.substring(0, 120));
    }
  }

  const total = bullets.filter(b => b?.trim()).length;
  const ratio = total > 0 ? count / total : 0;

  // Score 0–4: 30%+ bullets quantified = 4, 20% = 3, 10% = 2, any = 1
  let score = 0;
  if (ratio >= 0.3)      score = 4;
  else if (ratio >= 0.2) score = 3;
  else if (ratio >= 0.1) score = 2;
  else if (count > 0)    score = 1;

  return { count, ratio: Math.round(ratio * 100), examples, score };
}

// ─────────────────────────────────────────────────────────────
// computeReadability(text) → { fleschKincaid, gunningFog, smog, grade }
// Implemented natively without external dependency
// ─────────────────────────────────────────────────────────────
export function computeReadability(text) {
  if (!text || text.length < 100) {
    return { fleschKincaid: 0, gunningFog: 0, smog: 0, grade: 'Insufficient text' };
  }

  // Sentence splitting
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const sentenceCount = Math.max(1, sentences.length);

  // Word tokenization
  const words = tokenizeWords(text);
  const wordCount = Math.max(1, words.length);

  // Syllable counting (English approximation)
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return Math.max(1, matches ? matches.length : 1);
  }

  // Count polysyllabic words (3+ syllables) for Gunning Fog and SMOG
  let totalSyllables  = 0;
  let complexWords    = 0; // 3+ syllables
  let veryComplexWords = 0;

  for (const word of words) {
    const s = countSyllables(word);
    totalSyllables += s;
    if (s >= 3) complexWords++;
    if (s >= 4) veryComplexWords++;
  }

  // Flesch-Kincaid Grade Level
  const avgWordsPerSentence  = wordCount / sentenceCount;
  const avgSyllablesPerWord  = totalSyllables / wordCount;
  const fleschKincaid = Math.max(0, Math.round(
    (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59
  ));

  // Gunning Fog Index
  const gunningFog = Math.max(0, Math.round(
    0.4 * (avgWordsPerSentence + 100 * (complexWords / wordCount))
  ));

  // SMOG Index (requires 30+ sentences for accuracy)
  const smog = sentenceCount >= 3
    ? Math.max(0, Math.round(3 + Math.sqrt(complexWords * (30 / sentenceCount))))
    : gunningFog; // fallback

  // Human-readable grade
  const grade =
    fleschKincaid <= 6  ? 'Middle School' :
    fleschKincaid <= 9  ? 'High School' :
    fleschKincaid <= 12 ? 'College Level' :
    fleschKincaid <= 16 ? 'Graduate Level' : 'Academic';

  return { fleschKincaid, gunningFog, smog, grade, avgWordsPerSentence: Math.round(avgWordsPerSentence) };
}

// ─────────────────────────────────────────────────────────────
// detectFluffWords(text) → { found[], count, score/4 }
// Penalises buzzwords / filler content
// ─────────────────────────────────────────────────────────────
export function detectFluffWords(text) {
  if (!text) return { found: [], count: 0, score: 4 };
  const lower  = text.toLowerCase();
  const found  = [];

  for (const fluff of FLUFF_WORDS) {
    if (lower.includes(fluff)) found.push(fluff);
  }

  // Score: 4 = no fluff, 3 = 1-2, 2 = 3-4, 1 = 5+
  const count = found.length;
  const score = count === 0 ? 4 : count <= 2 ? 3 : count <= 4 ? 2 : 1;

  return { found, count, score };
}

// ─────────────────────────────────────────────────────────────
// detectTenseConsistency(bullets) → { issues[], consistent, score/4 }
// Checks past-tense for old jobs, present for current role
// ─────────────────────────────────────────────────────────────
export function detectTenseConsistency(bullets) {
  if (!bullets?.length) return { issues: [], consistent: true, score: 4 };

  let presentCount = 0;
  let pastCount    = 0;
  const issues     = [];

  for (const bullet of bullets) {
    if (!bullet?.trim()) continue;
    const doc   = nlp(bullet);
    const isPast    = doc.verbs().toPastTense().out('text') !== doc.verbs().out('text') ||
                      /\b(ed|ied)\b/.test(bullet);
    const isPresent = doc.verbs().toPresent().out('text') !== doc.verbs().out('text');

    if (isPresent) presentCount++;
    else pastCount++;
  }

  const total = bullets.filter(b => b?.trim()).length;
  const dominant   = pastCount >= presentCount ? 'past' : 'present';
  const minorities = dominant === 'past' ? presentCount : pastCount;
  const inconsistencyRatio = total > 0 ? minorities / total : 0;

  const consistent = inconsistencyRatio < 0.2;
  const score = consistent ? 4 : inconsistencyRatio < 0.4 ? 2 : 1;

  return { consistent, inconsistencyRatio: Math.round(inconsistencyRatio * 100), score };
}

// ─────────────────────────────────────────────────────────────
// detectRepetition(bullets) → { repeated[], score/4 }
// Finds overused words across bullet points
// ─────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','this','that','these','those','it','its',
]);

export function detectRepetition(bullets) {
  if (!bullets?.length) return { repeated: [], score: 4 };

  const wordFreq = {};
  for (const bullet of bullets) {
    const words = tokenizeWords(bullet || '');
    const uniqueInBullet = new Set(words);
    for (const w of uniqueInBullet) {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    }
  }

  // Words appearing in 3+ different bullets = repetitive
  const repeated = Object.entries(wordFreq)
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const score = repeated.length === 0 ? 4 : repeated.length <= 2 ? 3 : repeated.length <= 4 ? 2 : 1;
  return { repeated, score };
}

// ─────────────────────────────────────────────────────────────
// analyzeContactInfo(personalInfo) → detailed contact analysis
// ─────────────────────────────────────────────────────────────
export function analyzeContactInfo(info = {}) {
  const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE    = /^[\+]?[\d\s\-\(\)]{10,15}$/;
  const LINKEDIN_RE = /linkedin\.com\/in\//i;
  const GITHUB_RE   = /github\.com\//i;

  const hasEmail    = EMAIL_RE.test(info.email || '');
  const hasPhone    = PHONE_RE.test((info.phone || '').replace(/\s/g,''));
  const hasLocation = Boolean(info.location?.trim());
  const hasLinkedIn = LINKEDIN_RE.test(info.linkedin || '');
  const hasGitHub   = GITHUB_RE.test(info.website || '') || GITHUB_RE.test(info.linkedin || '');
  const hasName     = Boolean(info.full_name?.trim());
  const hasProfTitle = Boolean(info.profession?.trim());

  // Score: 3 pts max
  // Email(1) + Phone(0.5) + Location(0.5) + LinkedIn(0.5) + Name(0.5)
  let score = 0;
  if (hasName)     score += 0.5;
  if (hasEmail)    score += 1;
  if (hasPhone)    score += 0.5;
  if (hasLocation) score += 0.5;
  if (hasLinkedIn) score += 0.5;

  const missing = [];
  if (!hasEmail)    missing.push('Professional email address');
  if (!hasPhone)    missing.push('Phone number');
  if (!hasLocation) missing.push('City/Location');
  if (!hasLinkedIn) missing.push('LinkedIn profile URL');
  if (!hasName)     missing.push('Full name');

  return {
    hasEmail, hasPhone, hasLocation, hasLinkedIn, hasGitHub, hasName, hasProfTitle,
    missing,
    score: Math.min(3, score),
  };
}

// ─────────────────────────────────────────────────────────────
// analyzeSummary(text) → { hasSummary, wordCount, hasKeywords, score }
// ─────────────────────────────────────────────────────────────
export function analyzeSummary(text) {
  if (!text?.trim()) return { hasSummary: false, wordCount: 0, score: 0 };

  const words    = tokenizeWords(text);
  const wordCount = words.length;

  // Ideal summary: 40–80 words
  const goodLength = wordCount >= 40 && wordCount <= 100;
  const tooShort   = wordCount < 20;
  const tooLong    = wordCount > 120;

  // Does it mention value proposition?
  const doc = nlp(text);
  const hasNumbers  = /\d/.test(text);
  const hasRoleKeywords = text.match(
    /\b(engineer|developer|manager|analyst|designer|lead|senior|director)\b/i
  );

  let score = 0;
  if (!tooShort && !tooLong) score += 2;
  else if (wordCount >= 20)  score += 1;
  if (hasNumbers)            score += 1;
  if (hasRoleKeywords)       score += 1;

  return {
    hasSummary: true,
    wordCount,
    goodLength,
    tooShort,
    tooLong,
    hasNumbers,
    score: Math.min(4, score),
  };
}

// ─────────────────────────────────────────────────────────────
// extractBullets(experience) → string[]
// Extracts all bullet lines from experience descriptions
// ─────────────────────────────────────────────────────────────
export function extractBullets(experience = []) {
  const bullets = [];
  for (const job of experience) {
    if (!job.description) continue;
    const lines = job.description
      .split('\n')
      .map(l => l.replace(/^[\-\•\*\→]\s*/, '').trim())
      .filter(l => l.length > 10);
    bullets.push(...lines);
  }
  return bullets;
}

// ─────────────────────────────────────────────────────────────
// analyzeExperience(experience[]) → rich experience metrics
// ─────────────────────────────────────────────────────────────
export function analyzeExperience(experience = []) {
  if (!experience?.length) {
    return {
      hasExperience: false, entryCount: 0, bullets: [], totalBullets: 0,
      avgBulletsPerJob: 0, hasDates: false, gapAnalysis: [],
      progressionScore: 0, score: 0,
    };
  }

  const bullets = extractBullets(experience);

  // Check if dates are present
  const hasDates  = experience.some(e => e.start_date || e.end_date);
  const hasTitles = experience.every(e => e.position?.trim());
  const hasCompany = experience.every(e => e.company?.trim());

  // Gap detection
  const gaps = [];
  const sorted = [...experience].sort((a, b) => {
    const dateA = a.end_date ? new Date(a.end_date) : new Date();
    const dateB = b.end_date ? new Date(b.end_date) : new Date();
    return dateA - dateB;
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.end_date && curr.start_date) {
      const prevEnd  = new Date(prev.end_date);
      const currStart = new Date(curr.start_date);
      const monthsGap = Math.round((currStart - prevEnd) / (1000 * 60 * 60 * 24 * 30));
      if (monthsGap > 3) {
        gaps.push({ months: monthsGap, from: prev.end_date, to: curr.start_date });
      }
    }
  }

  const avgBullets = experience.length > 0 ? bullets.length / experience.length : 0;

  // Score for experience section: 0–7
  let score = 0;
  if (experience.length >= 1) score += 1;
  if (experience.length >= 2) score += 0.5;
  if (hasTitles)              score += 1;
  if (hasCompany)             score += 0.5;
  if (hasDates)               score += 1;
  if (bullets.length >= 3)    score += 1;
  if (avgBullets >= 3)        score += 1;
  if (gaps.length === 0)      score += 1;

  return {
    hasExperience: true,
    entryCount:    experience.length,
    bullets,
    totalBullets:  bullets.length,
    avgBulletsPerJob: Math.round(avgBullets * 10) / 10,
    hasDates,
    gapAnalysis:   gaps,
    score:         Math.min(7, score),
  };
}

// ─────────────────────────────────────────────────────────────
// analyzeEducation(education[]) → education quality score
// ─────────────────────────────────────────────────────────────
export function analyzeEducation(education = []) {
  if (!education?.length) return { hasEducation: false, score: 0 };

  const hasDegree      = education.some(e => e.degree?.trim());
  const hasInstitution = education.some(e => e.institution?.trim());
  const hasDate        = education.some(e => e.graduation_date?.trim());
  const hasField       = education.some(e => e.field?.trim());
  const hasGPA         = education.some(e => e.gpa?.trim());

  // Degree level detection
  const ADVANCED = /master|mba|phd|doctorate|m\.s\.|m\.eng/i;
  const hasAdvanced = education.some(e => ADVANCED.test(e.degree || ''));

  let score = 0;
  if (hasDegree)      score += 2;
  if (hasInstitution) score += 1;
  if (hasDate)        score += 1;
  if (hasField)       score += 0.5;
  if (hasAdvanced)    score += 0.5;

  return {
    hasEducation: true,
    entryCount:   education.length,
    hasDegree, hasInstitution, hasDate, hasField, hasGPA, hasAdvanced,
    score: Math.min(5, score),
  };
}

// ─────────────────────────────────────────────────────────────
// analyzeSkills(skills[]) → skills quality metrics
// ─────────────────────────────────────────────────────────────
const TECH_SKILL_PATTERNS = /\b(python|javascript|typescript|java|kotlin|swift|c\+\+|c#|go|rust|ruby|php|sql|nosql|react|angular|vue|node|django|flask|spring|kubernetes|docker|aws|azure|gcp|terraform|ansible|jenkins|git|linux|tensorflow|pytorch|machine learning|deep learning|nlp|api|rest|graphql|microservices|agile|scrum)\b/gi;

export function analyzeSkills(skills = [], resumeText = '') {
  if (!skills?.length && !resumeText) return { hasSkills: false, score: 0 };

  const skillsList = skills.length > 0 ? skills : [];

  // Also detect tech skills from resume text
  const textSkills = (resumeText.match(TECH_SKILL_PATTERNS) || [])
    .map(s => s.toLowerCase());

  const allSkills    = [...new Set([...skillsList.map(s => s.toLowerCase()), ...textSkills])];
  const techSkills   = allSkills.filter(s => TECH_SKILL_PATTERNS.test(s));
  const softSkillsKW = ['communication','leadership','teamwork','problem-solving','analytical','creativity'];
  const softSkills   = allSkills.filter(s => softSkillsKW.some(k => s.includes(k)));

  TECH_SKILL_PATTERNS.lastIndex = 0;

  let score = 0;
  if (allSkills.length >= 5)  score += 2;
  else if (allSkills.length >= 3) score += 1;
  if (techSkills.length >= 3) score += 1.5;
  if (softSkills.length >= 1) score += 0.5;
  if (allSkills.length >= 10) score += 1;

  return {
    hasSkills: allSkills.length > 0,
    totalCount: allSkills.length,
    techSkillsCount: techSkills.length,
    softSkillsCount: softSkills.length,
    topSkills: allSkills.slice(0, 15),
    score: Math.min(5, score),
  };
}

// ─────────────────────────────────────────────────────────────
// analyzeProjects(projects[]) → project quality metrics
// ─────────────────────────────────────────────────────────────
export function analyzeProjects(projects = []) {
  if (!projects?.length) return { hasProjects: false, score: 0 };

  const hasLinks   = projects.some(p => p.liveUrl || p.githubUrl);
  const hasDesc    = projects.some(p => p.description?.trim());
  const hasStack   = projects.some(p => {
    const text = (p.description || '') + (p.name || '');
    return TECH_SKILL_PATTERNS.test(text);
  });
  TECH_SKILL_PATTERNS.lastIndex = 0;

  let score = 0;
  if (projects.length >= 1) score += 1;
  if (projects.length >= 2) score += 0.5;
  if (hasDesc)              score += 1;
  if (hasLinks)             score += 1;
  if (hasStack)             score += 0.5;

  return {
    hasProjects: true,
    count: projects.length,
    hasLinks, hasDesc, hasStack,
    score: Math.min(4, score),
  };
}

// ─────────────────────────────────────────────────────────────
// buildFullText(resumeData) → single string of all resume content
// Used for keyword extraction and full-text analysis
// ─────────────────────────────────────────────────────────────
export function buildFullText(data) {
  const parts = [];

  if (data.professional_summary)   parts.push(data.professional_summary);
  if (data.skills?.length)         parts.push(data.skills.join(' '));

  for (const e of data.experience || []) {
    if (e.position)    parts.push(e.position);
    if (e.company)     parts.push(e.company);
    if (e.description) parts.push(e.description);
  }
  for (const e of data.education || []) {
    if (e.degree)      parts.push(e.degree);
    if (e.institution) parts.push(e.institution);
    if (e.field)       parts.push(e.field);
  }
  for (const p of data.project || []) {
    if (p.name)        parts.push(p.name);
    if (p.description) parts.push(p.description);
  }

  const info = data.personal_info || {};
  if (info.profession) parts.push(info.profession);

  return parts.join(' ');
}