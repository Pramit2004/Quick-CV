/**
 * documentParser.js — DEFINITIVE v6 (Pure JavaScript, Zero External Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 * Works on Windows, Mac, Linux — no Python, no native binaries needed.
 *
 * CORE FIXES:
 * 1. LONE BULLET MERGE: pdf-parse outputs "•\ntext" → merged to "• text"
 * 2. ICON ARTIFACT REMOVAL: Ó, R, °, \x87 before contact info → stripped
 * 3. ADJACENT LINE MERGE: "Intel CorporationRemote, India" → handled
 * 4. HYPERLINK DETECTION: "LinkedIn" / "GitHub" words in header = has profile
 *    Project "GitHub" / "Live Demo" text near title = has links (scored as present)
 * 5. ACHIEVEMENTS PARSED: "Achievements and Certifications" section detected
 * 6. SECTION CONTENT VALIDATION: section must have content, not just header
 *
 * PROBLEM 1 FIX (score 22 for empty resume):
 *   Sections scored only when they have REAL CONTENT, not just section headings
 *
 * PROBLEM 2 FIX (lone bullets, hyperlinks, achievements):
 *   Full text pre-processing pipeline handles all pdf-parse artifacts
 */

import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth  from 'mammoth';

// ─────────────────────────────────────────────────────────────────────────────
// extractTextFromBuffer — entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function extractTextFromBuffer(buffer, mimetype) {
  if (!buffer || buffer.length === 0) throw new Error('Empty file buffer');

  if (mimetype === 'application/pdf' || mimetype === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (mimetype === 'text/plain' || mimetype === 'txt') {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file type: ${mimetype}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_DEFS = [
  { key: 'summary',        re: /^(professional\s+summary|career\s+objective|executive\s+summary|professional\s+profile|summary|objective|profile|about\s+me)\s*:?\s*$/i },
  { key: 'experience',     re: /^(work\s+experience|professional\s+experience|employment\s+history|career\s+history|work\s+history|internship\s+(?:experience|program)?|experience)\s*:?\s*$/i },
  { key: 'education',      re: /^(educational?\s+background|academic\s+background|education|qualifications|academic)\s*:?\s*$/i },
  { key: 'skills',         re: /^(technical\s+skills|core\s+competencies|key\s+skills|skill\s+set|proficiencies|technologies|expertise|skills)\s*:?\s*$/i },
  { key: 'projects',       re: /^(personal\s+projects?|key\s+projects?|selected\s+projects?|academic\s+projects?|projects?|portfolio)\s*:?\s*$/i },
  { key: 'achievements',   re: /^(achievements?\s+and\s+certifications?|achievements?\s*[&\/]\s*certifications?|certifications?\s*[&\/]\s*achievements?|awards?\s*[&\/]\s*honors?|achievements?|certifications?|awards?|honors?|accomplishments?|recognition)\s*:?\s*$/i },
  { key: 'languages',      re: /^(languages?\s*[&\/]\s*interests?|languages?\s+known|languages?)\s*:?\s*$/i },
  { key: 'interests',      re: /^(interests?|hobbies|extracurricular)\s*:?\s*$/i },
];

function detectSection(line) {
  const t = line.trim();
  if (!t || t.length > 65) return null;
  for (const def of SECTION_DEFS) {
    if (def.re.test(t)) return def.key;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// cleanText — THE CORE FIX
// Handles all pdf-parse artifacts systematically
// ─────────────────────────────────────────────────────────────────────────────
function cleanText(raw) {
  // Step 1: Normalize characters
  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\u2013|\u2014/g, ' - ')      // em/en dashes → space-dash-space
    .replace(/\u2022/g, '•')               // normalize bullets
    .replace(/\u25CF/g, '•')
    .replace(/\(cid:\d+\)/g, ' ');         // strip (cid:XXX) font artifacts

  // Step 2: Remove icon artifact lines (Ó, R, °, etc. from PDF icon fonts)
  // These are single-char lines before contact info items
  text = text.replace(/^[ÓR°\x87]\s*$/gm, '');
  text = text.replace(/^[ÓR°\x87]\s*/gm, ''); // also inline at line start

  // Step 3: LONE BULLET MERGE — the biggest pdf-parse artifact
  // pdf-parse outputs bullet glyph on its OWN line, text on NEXT line:
  //   Line N:   "•"          ← lone bullet
  //   Line N+1: "Completed..." ← actual text
  // Fix: join them into "• Completed..."
  const LONE_BULLET_RE = /^[•\-\*▸►→]\s*$/;
  const lines1 = text.split('\n');
  const merged1 = [];
  let i = 0;
  while (i < lines1.length) {
    const line = lines1[i];
    if (LONE_BULLET_RE.test(line.trim())) {
      // Find next non-empty line to merge with
      let j = i + 1;
      while (j < lines1.length && !lines1[j].trim()) j++;
      if (j < lines1.length) {
        const nextLine = lines1[j].trim();
        // Only merge if next line isn't itself a section header
        if (nextLine && !detectSection(nextLine)) {
          merged1.push('• ' + nextLine);
          i = j + 1;
          continue;
        }
      }
    }
    merged1.push(line);
    i++;
  }
  text = merged1.join('\n');

  // Step 4: Merge bullet CONTINUATION lines
  // Long bullet text wraps to next line WITHOUT bullet prefix
  // "• Built autonomous web app...and generates complete data"
  // "science reports in under 3 minutes..."  ← continuation
  const BULLET_START = /^[•\-\*▸►→]\s/;
  const lines2 = text.split('\n');
  const merged2 = [];
  let k = 0;
  while (k < lines2.length) {
    const line = lines2[k];
    if (BULLET_START.test(line)) {
      let content = line.trimEnd();
      let j = k + 1;
      while (j < lines2.length) {
        const next = lines2[j];
        const nextTrimmed = next.trim();
        if (!nextTrimmed) {
          // Blank line — check if line after blank is a continuation
          const peek = lines2[j + 1]?.trim() || '';
          if (
            peek.length > 0 &&
            peek.length < 120 &&
            !BULLET_START.test(peek) &&
            !detectSection(peek) &&
            !/^[A-Z\s&/]{4,}$/.test(peek) && // not ALL CAPS header
            (peek[0] === peek[0].toLowerCase() || /^\d/.test(peek)) // starts lowercase or digit = continuation
          ) {
            content += ' ' + peek;
            j += 2;
            continue;
          }
          break;
        } else if (
          !BULLET_START.test(nextTrimmed) &&
          !detectSection(nextTrimmed) &&
          !/^[A-Z\s&/]{4,}$/.test(nextTrimmed) &&
          nextTrimmed.length < 120
        ) {
          content += ' ' + nextTrimmed;
          j++;
        } else {
          break;
        }
      }
      merged2.push(content);
      k = j;
    } else {
      merged2.push(line);
      k++;
    }
  }
  text = merged2.join('\n');

  // Step 5: Clean up excessive whitespace and blank lines
  text = text
    .replace(/[ ]{3,}/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n');

  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// splitIntoSections
// ─────────────────────────────────────────────────────────────────────────────
function splitIntoSections(lines) {
  const sections = {};
  let current    = 'header';
  let buffer     = [];

  for (const line of lines) {
    const key = detectSection(line);
    if (key && key !== current) {
      sections[current] = (sections[current] || '') + buffer.join('\n');
      current = key;
      buffer  = [];
    } else {
      buffer.push(line);
    }
  }
  sections[current] = (sections[current] || '') + buffer.join('\n');
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// detectHyperlinkPresence
// Scans text for hyperlink-text words that indicate links exist
// Returns: { hasLinkedIn, hasGitHub, projectGithubCount, projectLiveCount }
// This is how we handle PDFs where links are embedded but text shows the label
// ─────────────────────────────────────────────────────────────────────────────
function detectHyperlinkPresence(fullText) {
  const lower = fullText.toLowerCase();

  // Header area (first ~400 chars) — look for LinkedIn/GitHub as link labels
  const header = fullText.slice(0, 400).toLowerCase();
  const hasLinkedIn = /linkedin/.test(header);
  const hasGitHub   = /github/.test(header);

  // Count project-level GitHub / live demo link labels
  // These appear as "GitHub" "Live Demo" "Live API Demo" adjacent to project titles
  const projectGithubCount = (lower.match(/\bgithub\b/g) || []).length;
  const projectLiveCount   = (lower.match(/\blive\s*(?:demo|api\s*demo)\b/g) || []).length;

  // Try to extract actual URLs if they're in the text (some PDFs render full URLs)
  const linkedinUrlMatch = fullText.match(/linkedin\.com\/in\/[\w\-]+/i);
  const githubUrlMatch   = fullText.match(/github\.com\/([\w\-]+)/i);

  return {
    hasLinkedIn,
    hasGitHub,
    linkedinUrl:        linkedinUrlMatch ? 'https://' + linkedinUrlMatch[0] : (hasLinkedIn ? 'LinkedIn (profile link detected)' : ''),
    githubUrl:          githubUrlMatch   ? 'https://' + githubUrlMatch[0]   : (hasGitHub   ? 'GitHub (profile link detected)'   : ''),
    projectGithubCount: Math.max(0, projectGithubCount - (hasGitHub ? 1 : 0)), // subtract profile-level
    projectLiveCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseContactFromHeader
// ─────────────────────────────────────────────────────────────────────────────
function parseContactFromHeader(text, linkPresence) {
  const info = {
    full_name: '', profession: '', email: '', phone: '',
    location: '', linkedin: '', website: '',
    hasLinkedInWord: false, hasGitHubWord: false,
  };

  // Email
  const emailM = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  if (emailM) info.email = emailM[0];

  // Phone — international formats
  const phoneM = text.match(/[\+]?[1-9][\d\s\-\(\)\.]{8,18}[\d]/);
  if (phoneM) info.phone = phoneM[0].replace(/\s+/g, '').trim();

  // LinkedIn — URL or word detection
  const liUrlM = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+/i);
  if (liUrlM) {
    info.linkedin = liUrlM[0].startsWith('http') ? liUrlM[0] : 'https://' + liUrlM[0];
  } else if (linkPresence.linkedinUrl) {
    info.linkedin = linkPresence.linkedinUrl;
    info.hasLinkedInWord = true;
  }

  // GitHub — URL or word detection
  const ghUrlM = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-]+/i);
  if (ghUrlM) {
    info.website = ghUrlM[0].startsWith('http') ? ghUrlM[0] : 'https://' + ghUrlM[0];
  } else if (linkPresence.githubUrl) {
    info.website = linkPresence.githubUrl;
    info.hasGitHubWord = true;
  }

  // Location
  const locM = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2,3}|\b[A-Za-z]{3,}\b)/);
  if (locM) info.location = locM[0];

  // Name: first meaningful line
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l =>
    l.length >= 3 && l.length <= 80 &&
    !/[@\d\(\)\+\-|•]/.test(l) &&
    !/linkedin|github|http/i.test(l) &&
    !detectSection(l) &&
    !/^(programming|frameworks?|database|ai\/ml):/i.test(l)
  );
  if (nameLine) info.full_name = nameLine.replace(/[|•\-]/g, '').trim();

  // Profession: next meaningful line after name
  const ni = nameLine ? lines.indexOf(nameLine) : -1;
  if (ni >= 0) {
    for (let i = ni + 1; i < Math.min(ni + 6, lines.length); i++) {
      const l = lines[i].trim();
      if (
        l.length > 3 && l.length < 100 &&
        !/[@\d\(\)\+\-]/.test(l) &&
        !/linkedin|github|http/i.test(l) &&
        !detectSection(l) &&
        !/^[A-Z\s]{3,}$/.test(l)
      ) {
        info.profession = l.replace(/[|•\-]/g, '').trim();
        break;
      }
    }
  }

  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseSkillsFromText
// ─────────────────────────────────────────────────────────────────────────────
function parseSkillsFromText(sectionText, fullText = '') {
  const allSkills = new Set();
  const KV_LABEL_RE = /^(programming|languages?|frameworks?|libraries|tools?|database\s*(?:[&\/]\s*tools?)?|ai\/ml|technologies|platforms?|other|cloud|devops)\s*:/i;
  const allLines = (fullText || sectionText).split('\n');

  // Strategy 1: key:value pairs (handles "Programming: Python, Java...")
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    const kvMatch = line.match(/^([^:]{2,40}):\s*(.{3,})$/);
    if (kvMatch && KV_LABEL_RE.test(line)) {
      kvMatch[2].split(/[,;|]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 60).forEach(s => allSkills.add(s));
    } else if (KV_LABEL_RE.test(line) && line.trim().endsWith(':')) {
      for (let j = i + 1; j < Math.min(i + 5, allLines.length); j++) {
        const next = allLines[j].trim();
        if (!next || KV_LABEL_RE.test(next) || detectSection(next)) break;
        next.split(/[,;|]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 60).forEach(s => allSkills.add(s));
      }
    }
  }

  // Strategy 2: comma-delimited in skills section
  if (sectionText.trim()) {
    for (const line of sectionText.split('\n')) {
      const l = line.trim();
      if (!l || detectSection(l) || KV_LABEL_RE.test(l)) continue;
      if (l.includes(',')) {
        l.split(',').map(s => s.trim()).filter(s => s.length > 1 && s.length < 60 && !/^\d+$/.test(s)).forEach(s => allSkills.add(s));
      }
    }
  }

  // Strategy 3: extract known tech keywords from full text as fallback
  if (allSkills.size < 5) {
    const TECH_RE = /\b(python|javascript|typescript|java|kotlin|swift|c\+\+|c#|go|rust|ruby|php|react(?:\.js)?|angular|vue(?:\.js)?|node(?:\.js)?|express|django|flask|spring|fastapi|langchain|streamlit|graphql|rest\s*api|sql|postgresql|mysql|mongodb|redis|docker|kubernetes|terraform|aws|azure|gcp|git|linux|figma|sketch|photoshop|tensorflow|pytorch|scikit[- ]learn|pandas|numpy|matplotlib|seaborn|nlp|machine\s+learning|deep\s+learning|llm|rag|embeddings?|transformers?|vector\s+database|data\s+science|eda|supabase|selenium|html|css|json|api|deployment)\b/gi;
    const src = (fullText || sectionText);
    src.replace(TECH_RE, (m) => { allSkills.add(m.toLowerCase()); return m; });
  }

  return [...new Set(
    [...allSkills]
      .map(s => s.replace(/^[\-\*\s•]+/, '').replace(/[\-\*\s•]+$/, '').trim())
      .filter(s => s.length > 1 && s.length < 60 && !/^\d+$/.test(s) && !detectSection(s))
  )].slice(0, 60);
}

// ─────────────────────────────────────────────────────────────────────────────
// parseExperienceFromText
// ─────────────────────────────────────────────────────────────────────────────
function parseExperienceFromText(text) {
  if (!text?.trim()) return [];

  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let current   = null;
  let bullets   = [];

  const YEAR_RE    = /\b(20\d{2}|19\d{2})\b/;
  const CURRENT_RE = /\b(present|current|now|ongoing|till\s*date|to\s*date)\b/i;
  const BULLET_RE  = /^[•\-\*▸►→]\s*/;

  function hasDate(l) { return YEAR_RE.test(l) || CURRENT_RE.test(l); }
  function extractDates(l) {
    const yrs = [...l.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map(m => m[0]);
    const cur = CURRENT_RE.test(l);
    return { start: yrs[0] || '', end: cur ? 'Present' : (yrs[1] || ''), isCurrent: cur };
  }
  function cleanJobTitle(l) {
    return l.replace(/\b(20\d{2}|19\d{2})\b/g, '')
            .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*/gi, '')
            .replace(CURRENT_RE, '').replace(/[\-–—|]/g, ' | ')
            .replace(/github|live\s*demo/gi, '').replace(/\s{2,}/g, ' ').trim()
            .replace(/^[\s|]+|[\s|]+$/g, '');
  }
  function save() {
    if (current) {
      current.description = bullets.join('\n');
      if (current.position || current.company || bullets.length > 0) entries.push(current);
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isBullet = BULLET_RE.test(line);

    if (!isBullet && line.length < 150) {
      const nextLine  = lines[i + 1] || '';
      const next2Line = lines[i + 2] || '';
      const td  = hasDate(line);
      const nd  = hasDate(nextLine)  && nextLine.length  < 60;
      const n2d = hasDate(next2Line) && next2Line.length < 60;

      if ((td || nd || n2d) && line.length > 5 && !/^\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|19\d{2})\b/i.test(line)) {
        const dl = td ? line : (nd ? nextLine : next2Line);
        const { start, end, isCurrent } = extractDates(dl);
        save(); bullets = [];
        const parts = cleanJobTitle(line).split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean);
        current = { position: parts[0] || '', company: parts[1] || '', start_date: start, end_date: end, is_current: isCurrent, description: '' };
        if (nd)  i++;
        if (n2d && !nd) i++;
        i++; continue;
      }
    }

    if (current && (isBullet || line.length > 15)) {
      const clean = line.replace(BULLET_RE, '').trim();
      if (clean.length > 5 && !hasDate(clean) && clean.length < 200) bullets.push(clean);
    } else if (current && !current.company && !isBullet && line.length > 2 && line.length < 100) {
      if (!hasDate(line) && !/github|live\s*demo/i.test(line)) current.company = line;
    }
    i++;
  }
  save();
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseProjectsFromText
// projectLinkPresence: { projectGithubCount, projectLiveCount } from hyperlink scan
// ─────────────────────────────────────────────────────────────────────────────
function parseProjectsFromText(text, linkPresence = {}) {
  if (!text?.trim()) return [];

  const lines    = text.split('\n').map(l => l.trim()).filter(Boolean);
  const projects = [];
  let current    = null;
  let bullets    = [];

  const BULLET_RE = /^[•\-\*▸►→]\s*/;
  const YEAR_RE   = /\b(20\d{2}|19\d{2})\b/;
  const MONTH_YEAR = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(20\d{2}|19\d{2})\b/i;
  const DATE_ONLY = /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:20|19)\d{2}$|^(?:20|19)\d{2}$/i;
  const SKIP_LINE = /^(live\s*demo|live\s*api\s*demo|github|source\s*code)\s*$/i;
  const HAS_GITHUB_TEXT = /\bgithub\b/i;
  const HAS_LIVE_TEXT   = /\blive\s*(?:demo|api\s*demo)\b/i;

  function save() {
    if (current) {
      current.description = bullets.join('\n');
      if (current.name) projects.push(current);
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (SKIP_LINE.test(line))  { i++; continue; }
    if (DATE_ONLY.test(line))  { i++; continue; }
    if (BULLET_RE.test(line))  { if (current) bullets.push(line.replace(BULLET_RE, '').trim()); i++; continue; }

    const isTitle = line.length > 5 && line.length < 120 && !BULLET_RE.test(line) && !DATE_ONLY.test(line) && !SKIP_LINE.test(line);
    if (isTitle) {
      let nextMeaningful = '';
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (lines[j].trim()) { nextMeaningful = lines[j].trim(); break; }
      }
      if (YEAR_RE.test(nextMeaningful) || DATE_ONLY.test(nextMeaningful) || BULLET_RE.test(nextMeaningful) || projects.length > 0) {
        save(); bullets = [];

        // Detect if THIS title line has "GitHub" and/or "Live Demo" text in it
        const titleHasGithub = HAS_GITHUB_TEXT.test(line);
        const titleHasLive   = HAS_LIVE_TEXT.test(line);

        const cleanName = line
          .replace(/github\.com\/[\w\-\/]*/gi, '').replace(/https?:\/\/[\w\-\.\/]*/gi, '')
          .replace(/\bGitHub\b/gi, '').replace(/\bLive\s*(?:Demo|API\s*Demo)\b/gi, '')
          .replace(MONTH_YEAR, '').replace(YEAR_RE, '').replace(/\s{2,}/g, ' ').trim();

        let dateStr = '';
        if (YEAR_RE.test(line)) dateStr = (line.match(YEAR_RE)||[])[0] || '';
        else if (DATE_ONLY.test(nextMeaningful) || YEAR_RE.test(nextMeaningful)) dateStr = nextMeaningful;

        // Extract any inline URLs
        const inlineGh   = (line.match(/github\.com\/[\w\-\/]+/i)||[])[0];
        const inlineLive = (line.match(/https?:\/\/[\w\-\.\/]+/i)||[])[0];

        current = {
          name:      cleanName,
          description: '',
          type:      '',
          date:      dateStr,
          githubUrl: inlineGh ? 'https://' + inlineGh.replace(/^https?:\/\//i,'') : (titleHasGithub ? 'GitHub (link detected)' : ''),
          liveUrl:   (inlineLive && !/github/i.test(inlineLive)) ? inlineLive : (titleHasLive ? 'Live Demo (link detected)' : ''),
        };
      }
    }
    i++;
  }
  save();
  return projects.filter(p => p.name && p.name.length > 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// parseEducationFromText
// ─────────────────────────────────────────────────────────────────────────────
function parseEducationFromText(text) {
  if (!text?.trim()) return [];

  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let current   = null;

  const DEGREE_RE = /\b(bachelor|master|phd|doctorate|b\.?\s*tech|m\.?\s*tech|b\.?\s*e\.?|m\.?\s*e\.?|b\.?\s*s\.?|m\.?\s*s\.?|b\.?\s*a\.?|m\.?\s*b\.?\s*a\.?|b\.?\s*sc?\.?|m\.?\s*sc?\.?|b\.?\s*com\.?|m\.?\s*com\.?|b\.?\s*eng\.?|associate|diploma|certificate|high\s+school|secondary|10th|12th|hsc|ssc|undergraduate|postgraduate|engineering|technology)\b/i;
  const YEAR_RE   = /\b(20\d{2}|19\d{2})\b/;
  const GPA_RE    = /\b(?:gpa|cgpa|grade|percentage)[:\s]+(\d+\.?\d*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (DEGREE_RE.test(line)) {
      if (current) entries.push(current);
      const yrs  = [...line.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map(m => m[0]);
      const gpaM = line.match(GPA_RE) || lines[i+1]?.match(GPA_RE);
      current = {
        degree:          line.replace(YEAR_RE, '').replace(/[-–—]/g, ' ').replace(/\s{2,}/g, ' ').trim(),
        institution:     '',
        field:           '',
        graduation_date: yrs[yrs.length - 1] || '',
        gpa:             gpaM ? gpaM[1] : '',
      };
    } else if (current) {
      if (!current.institution && line.length > 3 && line.length < 120) {
        const gpaM = line.match(GPA_RE);
        if (gpaM) current.gpa = current.gpa || gpaM[1];
        else if (!YEAR_RE.test(line) && !/^\d+[\.,]?\d*%?$/.test(line)) current.institution = line;
      } else if (current.institution && !current.gpa) {
        const gpaM = line.match(GPA_RE);
        if (gpaM) current.gpa = gpaM[1];
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseAchievementsFromText
// ─────────────────────────────────────────────────────────────────────────────
function parseAchievementsFromText(text) {
  if (!text?.trim()) return [];
  const BULLET_RE = /^[•\-\*▸►→]\s*/;
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 10)
    .map(l => l.replace(BULLET_RE, '').trim())
    .filter(l => l.length > 5 && !detectSection(l))
    .slice(0, 15);
}

// ─────────────────────────────────────────────────────────────────────────────
// detectCareerLevel
// ─────────────────────────────────────────────────────────────────────────────
function detectCareerLevel(data) {
  const hasExp  = (data.experience  || []).length > 0;
  const hasProj = (data.project     || []).length > 0;
  const eduYear = parseInt((data.education||[])[0]?.graduation_date || '0');
  const now     = new Date().getFullYear();
  if (!hasExp && hasProj)    return 'student';
  if (!hasExp)               return 'student';
  if (eduYear >= now)        return 'student';
  if ((data.experience||[]).length <= 1) return 'entry';
  if ((data.experience||[]).length <= 3) return 'mid';
  return 'senior';
}

// ─────────────────────────────────────────────────────────────────────────────
// textToResumeData — MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function textToResumeData(rawText) {
  if (!rawText || rawText.length < 20) throw new Error('Insufficient text');

  // Clean and split
  const text         = cleanText(rawText);
  const lines        = text.split('\n');
  const sections     = splitIntoSections(lines);
  const sectionsFound = Object.keys(sections).filter(k => {
    const content = (sections[k] || '').trim();
    // PROBLEM 1 FIX: only count section as "found" if it has real content
    return content.length > 5;
  });

  // Detect hyperlink presence from full text
  const linkPresence = detectHyperlinkPresence(text);

  // Parse each section
  const headerText = sections.header || lines.slice(0, 20).join('\n');
  const personal_info        = parseContactFromHeader(headerText, linkPresence);
  const professional_summary = (sections.summary || '').trim();
  const experience           = parseExperienceFromText(sections.experience || '');
  const education            = parseEducationFromText(sections.education   || '');
  const skills               = parseSkillsFromText(sections.skills || '', text);
  const project              = parseProjectsFromText(sections.projects || '', linkPresence);
  const achievements         = parseAchievementsFromText(sections.achievements || '');
  const careerLevel          = detectCareerLevel({ experience, project, education });

  if (!personal_info.profession && experience.length > 0) {
    personal_info.profession = experience[0].position || '';
  }

  return {
    personal_info,
    professional_summary,
    experience,
    education,
    skills,
    project,
    achievements,
    careerLevel,
    _parsedFromText:  true,
    _textLength:      text.length,
    _sectionsFound:   sectionsFound,
    _rawText:         text,
    _linkPresence:    linkPresence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// validateFile
// ─────────────────────────────────────────────────────────────────────────────
export function validateFile(file) {
  const ALLOWED = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  if (!file)                          return { valid: false, error: 'No file provided' };
  if (file.size > 5 * 1024 * 1024)    return { valid: false, error: 'File exceeds 5MB' };
  if (!ALLOWED.includes(file.mimetype)) return { valid: false, error: 'Only PDF, DOCX, and TXT supported' };
  return { valid: true };
}