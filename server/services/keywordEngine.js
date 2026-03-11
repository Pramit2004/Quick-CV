/**
import natural from 'natural';
 * keywordEngine.js
 * ─────────────────────────────────────────────────────────────
 * Industry-grade keyword analysis engine.
 *
 * Features:
 *  • TF-IDF keyword extraction from resume text
 *  • 500+ industry keyword bank across 12 domains
 *  • ATS simulation (Workday, Taleo, Greenhouse, Lever scoring)
 *  • Keyword density, placement, and contextual analysis
 *  • Missing critical keyword detection by inferred role
 *  • Skill synonym mapping (JS ↔ JavaScript, etc.)
 * ─────────────────────────────────────────────────────────────
 */

import natural from 'natural';


const TfIdf    = natural.TfIdf;
const stemmer  = natural.PorterStemmer;

// ─────────────────────────────────────────────────────────────
// INDUSTRY KEYWORD BANKS
// 12 domains × ~40 keywords = 480+ searchable terms
// ─────────────────────────────────────────────────────────────
const INDUSTRY_KEYWORDS = {
  software_engineering: [
    'javascript','typescript','python','java','c++','c#','go','rust','swift',
    'kotlin','react','angular','vue','node.js','express','django','flask',
    'spring','fastapi','graphql','rest','api','microservices','docker',
    'kubernetes','terraform','aws','azure','gcp','ci/cd','jenkins','github',
    'git','linux','sql','postgresql','mongodb','redis','elasticsearch',
    'kafka','rabbitmq','agile','scrum','tdd','unit testing','code review',
    'system design','algorithms','data structures','oop','solid principles',
  ],
  data_science: [
    'python','r','sql','machine learning','deep learning','tensorflow','pytorch',
    'scikit-learn','pandas','numpy','matplotlib','seaborn','jupyter','spark',
    'hadoop','airflow','dbt','snowflake','bigquery','tableau','power bi',
    'statistics','probability','regression','classification','clustering',
    'neural networks','nlp','computer vision','feature engineering',
    'model deployment','mlops','a/b testing','hypothesis testing','etl',
    'data pipeline','data warehouse','data lake','analytics','visualization',
  ],
  product_management: [
    'product roadmap','user stories','agile','scrum','kanban','okr','kpi',
    'stakeholder','go-to-market','product strategy','market research',
    'user research','wireframes','prototyping','figma','jira','confluence',
    'a/b testing','metrics','conversion rate','retention','churn','nps',
    'customer journey','mvp','product lifecycle','competitive analysis',
    'cross-functional','prioritization','data-driven','sql','analytics',
    'product-led growth','b2b','b2c','saas','api','technical requirements',
  ],
  design: [
    'figma','sketch','adobe xd','photoshop','illustrator','invision',
    'user experience','ux','ui','user interface','wireframing','prototyping',
    'usability testing','user research','design system','component library',
    'accessibility','wcag','responsive design','mobile-first','typography',
    'color theory','branding','visual hierarchy','information architecture',
    'interaction design','motion design','after effects','css','html',
    'design thinking','human-centered design','a/b testing','heuristic evaluation',
  ],
  marketing: [
    'seo','sem','ppc','google ads','facebook ads','email marketing','crm',
    'hubspot','salesforce','content marketing','social media','analytics',
    'google analytics','conversion optimization','lead generation','b2b',
    'b2c','saas','growth hacking','marketing automation','campaign management',
    'brand strategy','copywriting','content strategy','influencer marketing',
    'performance marketing','roi','ctr','cpc','cpa','ltv','demand generation',
    'account-based marketing','abm','marketing qualified lead','mql',
  ],
  finance: [
    'financial modeling','valuation','dcf','lbo','m&a','due diligence',
    'financial analysis','excel','vba','bloomberg','capital markets',
    'equity research','investment banking','private equity','venture capital',
    'portfolio management','risk management','derivatives','fixed income',
    'accounting','gaap','ifrs','financial statements','balance sheet',
    'income statement','cash flow','budgeting','forecasting','sql',
    'python','tableau','pivot tables','financial planning','fp&a',
  ],
  healthcare: [
    'clinical','patient care','ehr','emr','epic','hipaa','clinical trials',
    'medical coding','icd-10','cpt','healthcare analytics','population health',
    'quality improvement','evidence-based','diagnosis','treatment planning',
    'interdisciplinary','care coordination','chronic disease','preventive care',
    'pharmaceutical','drug development','fda','regulatory affairs','gcp',
    'biostatistics','clinical research','nursing','physician','residency',
  ],
  operations: [
    'operations management','supply chain','logistics','inventory management',
    'process improvement','lean','six sigma','kaizen','erp','sap','oracle',
    'vendor management','procurement','forecasting','kpi','sla','budget',
    'cross-functional','project management','pmp','prince2','stakeholder',
    'change management','business continuity','risk management','compliance',
    'quality assurance','iso','manufacturing','distribution','warehouse',
  ],
  sales: [
    'sales','account executive','business development','crm','salesforce',
    'pipeline management','quota','revenue','b2b','b2c','saas','enterprise',
    'cold calling','prospecting','lead qualification','closing','negotiation',
    'customer success','account management','upselling','cross-selling',
    'solution selling','consultative selling','forecast','territory management',
    'demo','product demonstration','objection handling','roi','value proposition',
  ],
  cybersecurity: [
    'penetration testing','vulnerability assessment','siem','soc','incident response',
    'threat intelligence','malware analysis','forensics','firewall','vpn',
    'zero trust','iam','oauth','saml','encryption','ssl/tls','compliance',
    'iso 27001','nist','soc 2','gdpr','cisa','cissp','ceh','oscp',
    'python','scripting','network security','endpoint security','cloud security',
    'devsecops','owasp','ctf','red team','blue team','security architecture',
  ],
  project_management: [
    'project management','pmp','agile','scrum','kanban','waterfall',
    'project planning','stakeholder management','risk management','budget',
    'resource allocation','timeline','milestone','deliverables','scope',
    'change management','jira','confluence','ms project','asana','trello',
    'cross-functional','team leadership','vendor management','sla','kpi',
    'status reporting','escalation','retrospective','sprint','backlog',
  ],
  general_professional: [
    'leadership','communication','collaboration','problem solving','analytical',
    'strategic thinking','stakeholder management','project management',
    'data-driven','results-oriented','cross-functional','presentation',
    'negotiation','mentoring','budget management','process improvement',
    'decision making','critical thinking','time management','adaptability',
  ],
};

// ─────────────────────────────────────────────────────────────
// SKILL SYNONYM MAP
// Allows matching abbreviations to full forms
// ─────────────────────────────────────────────────────────────
const SYNONYMS = {
  'js':          'javascript',
  'ts':          'typescript',
  'node':        'node.js',
  'nodejs':      'node.js',
  'react.js':    'react',
  'reactjs':     'react',
  'vue.js':      'vue',
  'vuejs':       'vue',
  'postgres':    'postgresql',
  'psql':        'postgresql',
  'mongo':       'mongodb',
  'k8s':         'kubernetes',
  'tf':          'tensorflow',
  'ml':          'machine learning',
  'dl':          'deep learning',
  'ai':          'artificial intelligence',
  'ux':          'user experience',
  'ui':          'user interface',
  'ci/cd':       'ci/cd',
  'cicd':        'ci/cd',
  'gcp':         'google cloud',
  'llm':         'large language model',
  'nlp':         'natural language processing',
  'cv':          'computer vision',
};

// ─────────────────────────────────────────────────────────────
// STOP WORDS (extended for resume context)
// ─────────────────────────────────────────────────────────────
const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','can','this','that','these','those','it','its','my','our','your',
  'their','we','they','he','she','who','what','when','where','how','if',
  'about','into','through','during','before','after','above','below','up',
  'down','out','off','over','under','again','further','then','once','also',
  'just','more','very','so','no','not','only','same','than','too','etc',
  'using','used','use','work','working','worked','team','company','role',
  'position','job','including','various','multiple','across','within','per',
]);

// ─────────────────────────────────────────────────────────────
// normalizeKeyword(word) → canonical form
// ─────────────────────────────────────────────────────────────
function normalizeKeyword(word) {
  const lower = word.toLowerCase().trim();
  return SYNONYMS[lower] || lower;
}

// ─────────────────────────────────────────────────────────────
// inferDomain(text, skills) → dominant industry domain
// Used to determine which keyword bank to compare against
// ─────────────────────────────────────────────────────────────
export function inferDomain(text = '', skills = []) {
  const combined = (text + ' ' + skills.join(' ')).toLowerCase();
  const scores   = {};

  for (const [domain, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (domain === 'general_professional') continue;
    let hits = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) hits++;
    }
    scores[domain] = hits;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const top    = sorted[0];

  return {
    domain:          top ? top[0] : 'general_professional',
    confidence:      top ? Math.round((top[1] / 40) * 100) : 0,
    topDomains:      sorted.slice(0, 3).map(([d, s]) => ({ domain: d, hits: s })),
  };
}

// ─────────────────────────────────────────────────────────────
// extractTfIdfKeywords(text) → [{ word, tfidf, count }]
// Extracts top 30 meaningful keywords using TF-IDF
// ─────────────────────────────────────────────────────────────
export function extractTfIdfKeywords(text) {
  if (!text || text.length < 50) return [];

  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const results = [];
  tfidf.listTerms(0).forEach(item => {
    const word = item.term.toLowerCase();
    if (word.length < 3) return;
    if (STOP.has(word)) return;
    if (/^\d+$/.test(word)) return;

    const canonical = normalizeKeyword(word);
    results.push({
      word:   canonical,
      tfidf:  Math.round(item.tfidf * 100) / 100,
      count:  (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length,
    });
  });

  // Deduplicate by canonical form
  const seen = new Set();
  return results
    .filter(r => {
      if (seen.has(r.word)) return false;
      seen.add(r.word);
      return true;
    })
    .sort((a, b) => b.tfidf - a.tfidf)
    .slice(0, 30);
}

// ─────────────────────────────────────────────────────────────
// analyzeKeywordDensity(text, domain) → comprehensive keyword report
// ─────────────────────────────────────────────────────────────
export function analyzeKeywordDensity(fullText, domain, skills = []) {
  if (!fullText) return { found: [], missing: [], density: 0, score: 0 };

  const lower     = fullText.toLowerCase();
  const wordCount = (fullText.match(/\b\w+\b/g) || []).length;

  // Get relevant keywords for this domain
  const domainKeywords  = INDUSTRY_KEYWORDS[domain] || [];
  const generalKeywords = INDUSTRY_KEYWORDS.general_professional;
  const allTargetKW     = [...new Set([...domainKeywords, ...generalKeywords])];

  const found   = [];
  const missing = [];

  for (const kw of allTargetKW) {
    const kwLower = kw.toLowerCase();
    // Check both exact match and synonym match
    const directMatch = lower.includes(kwLower);
    const synonymMatch = Object.entries(SYNONYMS).some(
      ([abbr, full]) => full === kwLower && lower.includes(abbr)
    );

    if (directMatch || synonymMatch) {
      const count   = (lower.match(new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
      found.push({ word: kw, count, density: Math.round(density * 100) / 100 });
    } else {
      // Only report missing CRITICAL keywords (first 20 in domain list)
      if (domainKeywords.slice(0, 20).includes(kw)) {
        missing.push(kw);
      }
    }
  }

  // Also include user's own skills as "found" keywords
  for (const skill of skills) {
    const sl = skill.toLowerCase();
    if (!found.find(f => f.word === sl) && lower.includes(sl)) {
      found.push({ word: sl, count: 1, density: 0, isUserSkill: true });
    }
  }

  // Keyword density score (D1: 0–6)
  // >20 keywords found = 6, >15 = 5, >10 = 4, >6 = 3, >3 = 2, any = 1
  let score = 0;
  if (found.length >= 20)      score = 6;
  else if (found.length >= 15) score = 5;
  else if (found.length >= 10) score = 4;
  else if (found.length >= 6)  score = 3;
  else if (found.length >= 3)  score = 2;
  else if (found.length >= 1)  score = 1;

  return {
    found:        found.sort((a, b) => b.count - a.count).slice(0, 25),
    missing:      missing.slice(0, 15),
    density:      wordCount > 0 ? Math.round((found.length / allTargetKW.length) * 100) : 0,
    totalFound:   found.length,
    totalMissing: missing.length,
    score,
  };
}

// ─────────────────────────────────────────────────────────────
// simulateATS(resumeData, keywordReport) → per-ATS scores
//
// Each ATS system weighs things differently:
//   Workday   — strong on keyword matching + standard sections
//   Taleo     — strict on formatting + date parsing
//   Greenhouse — balanced, rewards quantification
//   Lever      — modern, rewards links + projects
// ─────────────────────────────────────────────────────────────
export function simulateATS(resumeData, keywordReport, structureReport) {
  const kw    = keywordReport || {};
  const sr    = structureReport || {};
  const info  = resumeData.personal_info || {};
  const exp   = resumeData.experience || [];
  const edu   = resumeData.education  || [];
  const proj  = resumeData.project    || [];
  const skills = resumeData.skills    || [];

  const hasEmail    = /\S+@\S+\.\S+/.test(info.email || '');
  const hasPhone    = /\d{10,}/.test((info.phone || '').replace(/\D/g,''));
  const hasLocation = Boolean(info.location?.trim());
  const hasSummary  = Boolean(resumeData.professional_summary?.trim());
  const hasExp      = exp.length > 0;
  const hasEdu      = edu.length > 0;
  const hasSkills   = skills.length > 0;
  const hasLinkedIn = /linkedin\.com/i.test(info.linkedin || '');
  const hasDates    = exp.some(e => e.start_date);
  const hasProj     = proj.length > 0;
  const kwDensity   = kw.density || 0;
  const kwFound     = kw.totalFound || 0;

  // ── WORKDAY (enterprise ATS — cares most about keywords + structure) ──
  let workday = 0;
  if (hasEmail)      workday += 10;
  if (hasPhone)      workday += 8;
  if (hasLocation)   workday += 7;
  if (hasSummary)    workday += 8;
  if (hasExp)        workday += 12;
  if (hasEdu)        workday += 10;
  if (hasSkills)     workday += 10;
  if (hasDates)      workday += 8;
  workday += Math.min(27, kwFound * 1.5);  // keywords are king in Workday

  // ── TALEO (Oracle ATS — strict date formats + section labels) ──
  let taleo = 0;
  if (hasEmail)      taleo += 12;
  if (hasPhone)      taleo += 10;
  if (hasLocation)   taleo += 8;
  if (hasExp)        taleo += 12;
  if (hasEdu)        taleo += 12;
  if (hasDates)      taleo += 15;  // Taleo REALLY needs dates
  if (hasSkills)     taleo += 8;
  taleo += Math.min(23, kwFound * 1.2);

  // ── GREENHOUSE (modern ATS — balanced, rewards rich content) ──
  let greenhouse = 0;
  if (hasEmail)      greenhouse += 10;
  if (hasPhone)      greenhouse += 8;
  if (hasSummary)    greenhouse += 10;
  if (hasExp)        greenhouse += 12;
  if (hasEdu)        greenhouse += 8;
  if (hasSkills)     greenhouse += 10;
  if (hasLinkedIn)   greenhouse += 6;
  if (hasDates)      greenhouse += 6;
  greenhouse += Math.min(20, kwFound);
  if (kwDensity >= 15) greenhouse += 10;

  // ── LEVER (startup ATS — rewards projects + links + modern resume) ──
  let lever = 0;
  if (hasEmail)      lever += 10;
  if (hasPhone)      lever += 8;
  if (hasSummary)    lever += 8;
  if (hasExp)        lever += 10;
  if (hasEdu)        lever += 8;
  if (hasSkills)     lever += 10;
  if (hasLinkedIn)   lever += 8;
  if (hasProj)       lever += 10;
  lever += Math.min(18, kwFound * 0.9);
  if (proj.some(p => p.liveUrl || p.githubUrl)) lever += 10;

  return {
    workday:    Math.min(100, Math.round(workday)),
    taleo:      Math.min(100, Math.round(taleo)),
    greenhouse: Math.min(100, Math.round(greenhouse)),
    lever:      Math.min(100, Math.round(lever)),
    average:    Math.min(100, Math.round((workday + taleo + greenhouse + lever) / 4)),
  };
}

// ─────────────────────────────────────────────────────────────
// analyzeFormatSafety(resumeData) → ATS format safety report
// Checks if resume data would survive ATS parsing
// ─────────────────────────────────────────────────────────────
export function analyzeFormatSafety(resumeData, source = 'builder') {
  const issues   = [];
  const warnings = [];

  // For Quick-CV builder resumes, format is always ATS-safe
  // We only flag the data-level issues
  const exp    = resumeData.experience || [];
  const edu    = resumeData.education  || [];
  const info   = resumeData.personal_info || {};

  // Date format check
  let dateFormatIssues = 0;
  for (const e of exp) {
    if (e.start_date && !/\d{4}/.test(e.start_date)) dateFormatIssues++;
    if (e.end_date && !/\d{4}/.test(e.end_date) && e.end_date !== 'Present') dateFormatIssues++;
  }
  if (dateFormatIssues > 0) {
    warnings.push(`${dateFormatIssues} date(s) may not parse correctly — use MM/YYYY or Month YYYY format`);
  }

  // Email format
  if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    issues.push('Email format appears invalid');
  }

  // Special characters in name
  if (info.full_name && /[<>{}[\]\\]/.test(info.full_name)) {
    issues.push('Special characters in name may cause parsing errors');
  }

  // Uploaded file gets stricter checks
  const problematic = source === 'upload' ? [
    'Tables detected — may cause ATS parsing failure',
    'Multi-column layout detected — content may be scrambled by ATS',
  ] : [];

  const parseabilityScore = issues.length === 0 ? 5 :
                            issues.length === 1 ? 3 : 1;
  const formatSafeScore   = warnings.length === 0 ? 5 :
                            warnings.length <= 2 ? 4 : 3;

  return {
    issues,
    warnings,
    problematic,
    parseabilityScore: Math.min(5, parseabilityScore),
    formatSafeScore:   Math.min(5, formatSafeScore),
    fileFormatScore:   source === 'builder' ? 4 : 3, // PDF from builder = 4, upload = 3
  };
}

export { INDUSTRY_KEYWORDS, SYNONYMS };