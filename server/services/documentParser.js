/**
 * documentParser.js
 * ─────────────────────────────────────────────────────────────
 * Parses uploaded resume files (PDF, DOCX, TXT) into a
 * normalised resumeData object that the ATS engine can score.
 *
 * Supported formats: PDF, DOCX, TXT
 * Max file size: 5MB (enforced in route middleware)
 * ─────────────────────────────────────────────────────────────
 */

import pdfParse  from 'pdf-parse/lib/pdf-parse.js';
import mammoth   from 'mammoth';
import nlp       from 'compromise';

// ─────────────────────────────────────────────────────────────
// extractTextFromBuffer(buffer, mimetype) → string
// ─────────────────────────────────────────────────────────────
export async function extractTextFromBuffer(buffer, mimetype) {
  if (!buffer || buffer.length === 0) throw new Error('Empty file buffer');

  // PDF
  if (mimetype === 'application/pdf' || mimetype === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  // DOCX
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // TXT / plain
  if (mimetype === 'text/plain' || mimetype === 'txt') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADER PATTERNS
// Detects common resume section headings
// ─────────────────────────────────────────────────────────────
const SECTION_PATTERNS = {
  summary: /^(summary|professional\s+summary|objective|profile|about\s+me|career\s+objective)\s*:?\s*$/im,
  experience: /^(experience|work\s+experience|employment|professional\s+experience|work\s+history|career\s+history)\s*:?\s*$/im,
  education: /^(education|academic|qualifications|degrees|academic\s+background)\s*:?\s*$/im,
  skills: /^(skills|technical\s+skills|core\s+competencies|technologies|expertise|skill\s+set|proficiencies)\s*:?\s*$/im,
  projects: /^(projects|personal\s+projects|key\s+projects|portfolio|selected\s+projects)\s*:?\s*$/im,
  certifications: /^(certifications|certificates|credentials|licenses|accreditations)\s*:?\s*$/im,
  contact: /^(contact|contact\s+information|personal\s+information|details)\s*:?\s*$/im,
};

// ─────────────────────────────────────────────────────────────
// splitIntoSections(text) → { section_name: content_string }
// ─────────────────────────────────────────────────────────────
function splitIntoSections(text) {
  const lines    = text.split('\n');
  const sections = {};
  let   current  = 'header';
  let   buffer   = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(trimmed)) {
        sections[current] = buffer.join('\n');
        current  = section;
        buffer   = [];
        matched  = true;
        break;
      }
    }
    if (!matched) buffer.push(line);
  }

  sections[current] = buffer.join('\n');
  return sections;
}

// ─────────────────────────────────────────────────────────────
// parseContactFromText(text) → personal_info object
// ─────────────────────────────────────────────────────────────
function parseContactFromText(text) {
  const lines     = text.split('\n').map(l => l.trim()).filter(Boolean);
  const info      = {
    full_name:  '',
    profession: '',
    email:      '',
    phone:      '',
    location:   '',
    linkedin:   '',
    website:    '',
  };

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) info.email = emailMatch[0];

  // Phone (various formats)
  const phoneMatch = text.match(/[\+]?[\d][\d\s\-\(\)\.]{8,14}[\d]/);
  if (phoneMatch) info.phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w\-]+/i);
  if (linkedinMatch) info.linkedin = 'https://' + linkedinMatch[0];

  // GitHub / website
  const githubMatch = text.match(/github\.com\/[\w\-]+/i);
  if (githubMatch) info.website = 'https://' + githubMatch[0];
  else {
    const websiteMatch = text.match(/https?:\/\/[\w\-\.]+\.[a-z]{2,}(\/[\w\-\.\/]*)?/i);
    if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
      info.website = websiteMatch[0];
    }
  }

  // Location (city, state pattern)
  const locationMatch = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2}|\b[A-Za-z]+\b)/);
  if (locationMatch) info.location = locationMatch[0];

  // Name: first non-empty line of the document (usually the name)
  const firstMeaningfulLine = lines.find(l =>
    l.length > 2 && l.length < 60 &&
    !/[@\d\(\)\-\+]/.test(l) &&
    !/linkedin|github|http/i.test(l) &&
    Object.values(SECTION_PATTERNS).every(p => !p.test(l))
  );
  if (firstMeaningfulLine) info.full_name = firstMeaningfulLine;

  // Profession: second meaningful line after name
  const nameIdx = lines.indexOf(firstMeaningfulLine);
  if (nameIdx >= 0) {
    for (let i = nameIdx + 1; i < Math.min(nameIdx + 5, lines.length); i++) {
      const l = lines[i].trim();
      if (l.length > 5 && l.length < 80 &&
          !/[@\d\(\)\-\+]/.test(l) &&
          !/linkedin|github|http/i.test(l) &&
          !/^[A-Z]{2,}$/.test(l) // skip ALL CAPS headers
      ) {
        info.profession = l;
        break;
      }
    }
  }

  return info;
}

// ─────────────────────────────────────────────────────────────
// parseExperienceFromText(text) → experience[]
// ─────────────────────────────────────────────────────────────
function parseExperienceFromText(text) {
  if (!text?.trim()) return [];

  const lines    = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries  = [];
  let   current  = null;
  let   bullets  = [];

  // Date patterns for detecting job entries
  const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[\s\w,\.]*?\d{4}\b/i;
  const YEAR_RE = /\b(20\d{2}|19\d{2})\b/;
  const BULLET_RE = /^[\-•\*▸►→\u2022\u25CF]\s+/;

  for (const line of lines) {
    const isBullet = BULLET_RE.test(line) || (line.length > 15 && line.startsWith(' '));
    const hasDate  = DATE_RE.test(line) || YEAR_RE.test(line);

    if (hasDate && !isBullet && line.length < 120) {
      // New job entry — save previous
      if (current) {
        current.description = bullets.join('\n');
        entries.push(current);
      }

      // Extract dates
      const dates = line.match(/\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20|19)\d{2}\b/gi) || [];
      const isCurrentRole = /present|current|now/i.test(line);

      current = {
        position:   '',
        company:    '',
        start_date: dates[0] || '',
        end_date:   isCurrentRole ? 'Present' : (dates[1] || ''),
        is_current: isCurrentRole,
        description: '',
      };
      bullets = [];

      // Try to extract position and company from surrounding lines
      const datePart = dates.join('');
      const rest = line.replace(DATE_RE, '').replace(/[-–—|•]/g, ' ').trim();
      const parts = rest.split(/\s{2,}|,\s*|at\s+|@\s*/i).map(p => p.trim()).filter(Boolean);

      if (parts.length >= 2) {
        current.position = parts[0];
        current.company  = parts[1];
      } else if (parts.length === 1) {
        current.position = parts[0];
      }
    } else if (isBullet || (current && line.length > 20)) {
      const clean = line.replace(BULLET_RE, '').trim();
      if (clean.length > 5) bullets.push(clean);
    } else if (current && !current.position && line.length < 80) {
      // Might be position or company name
      if (!current.position) current.position = line;
      else if (!current.company) current.company = line;
    }
  }

  // Save last entry
  if (current) {
    current.description = bullets.join('\n');
    entries.push(current);
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────
// parseSkillsFromText(text) → string[]
// ─────────────────────────────────────────────────────────────
function parseSkillsFromText(text) {
  if (!text?.trim()) return [];

  // Split by common delimiters
  const skills = text
    .split(/[,|•\n\t]+/)
    .map(s => s.replace(/^[\-\*\s•]+/, '').trim())
    .filter(s => s.length > 1 && s.length < 50)
    .filter(s => !/^\d+$/.test(s)) // no pure numbers
    .slice(0, 30);

  return [...new Set(skills)];
}

// ─────────────────────────────────────────────────────────────
// parseEducationFromText(text) → education[]
// ─────────────────────────────────────────────────────────────
function parseEducationFromText(text) {
  if (!text?.trim()) return [];

  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let   current = null;

  const DEGREE_RE = /\b(bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?b\.?a\.?|b\.?e\.?|m\.?e\.?|associate|diploma|certificate|high\s+school)\b/i;
  const YEAR_RE   = /\b(20\d{2}|19\d{2})\b/;

  for (const line of lines) {
    if (DEGREE_RE.test(line)) {
      if (current) entries.push(current);
      const yearMatch = line.match(YEAR_RE);
      current = {
        degree:          line.replace(YEAR_RE, '').trim(),
        institution:     '',
        field:           '',
        graduation_date: yearMatch ? yearMatch[0] : '',
        gpa:             '',
      };

      // Extract GPA
      const gpaMatch = line.match(/\bgpa[:\s]+(\d+\.?\d*)\b/i);
      if (gpaMatch) current.gpa = gpaMatch[1];
    } else if (current && !current.institution && line.length > 3 && line.length < 100) {
      // Assume institution name follows degree
      if (!/\bgpa\b|\bgrade\b|\b\d{4}\b/i.test(line)) {
        current.institution = line;
      }
    }
  }
  if (current) entries.push(current);

  return entries;
}

// ─────────────────────────────────────────────────────────────
// textToResumeData(text) → resumeData (same shape as MongoDB Resume)
// Maps parsed text sections to the resume data structure
// ─────────────────────────────────────────────────────────────
export function textToResumeData(text) {
  if (!text || text.length < 50) {
    throw new Error('Insufficient text extracted from document');
  }

  const sections = splitIntoSections(text);

  // Contact comes from the header section (before any section heading)
  const headerText = sections.header || text.substring(0, 800);
  const personal_info = parseContactFromText(headerText + '\n' + (sections.contact || ''));

  const professional_summary = (sections.summary || '').trim();

  const experience = parseExperienceFromText(sections.experience || '');
  const education  = parseEducationFromText(sections.education   || '');
  const skills     = parseSkillsFromText(sections.skills         || '');

  // Projects
  const project = [];
  if (sections.projects) {
    const projLines = sections.projects.split('\n').filter(l => l.trim().length > 3);
    let cur = null;
    for (const line of projLines) {
      const trimmed = line.trim();
      if (!/^[\-•\*]/.test(trimmed) && trimmed.length < 80 && trimmed.length > 3) {
        if (cur) project.push(cur);
        cur = { name: trimmed, description: '', type: '', liveUrl: '', githubUrl: '' };
      } else if (cur) {
        cur.description += (cur.description ? '\n' : '') + trimmed.replace(/^[\-•\*]\s*/, '');
      }
    }
    if (cur) project.push(cur);
  }

  // Extract missing name/profession from experience titles if not found
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
    _parsedFromText: true,
    _textLength: text.length,
    _sectionsFound: Object.keys(sections).filter(k => sections[k]?.trim()),
  };
}

// ─────────────────────────────────────────────────────────────
// validateFile(file) → { valid, error }
// ─────────────────────────────────────────────────────────────
export function validateFile(file) {
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > MAX_SIZE) return { valid: false, error: 'File size exceeds 5MB limit' };
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Only PDF, DOCX, and TXT files are supported' };
  }
  return { valid: true };
}