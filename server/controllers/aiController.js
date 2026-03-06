import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;
    if (!userContent) return res.status(400).json({ message: 'Missing required fields' });

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. and only return text no options or anything else." },
        { role: "user", content: userContent },
      ],
    });

    return res.status(200).json({ enhancedContent: response.choices[0].message.content });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;
    if (!userContent) return res.status(400).json({ message: 'Missing required fields' });

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. and only return text no options or anything else." },
        { role: "user", content: userContent },
      ],
    });

    return res.status(200).json({ enhancedContent: response.choices[0].message.content });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST: /api/ai/upload-resume
// ─────────────────────────────────────────────────────────────
// PDF text is already extracted on the frontend using pdfjs-dist.
// AI job here is ONLY field mapping — extract name, email,
// experience, etc. from raw text. No layout inference at all.
// Extra sections (certifications, awards, etc.) are returned
// as structured arrays so the builder can render editable forms.
// ─────────────────────────────────────────────────────────────
export const uploadResume = async (req, res) => {
  try {
    const { title, resumeText } = req.body;
    const userId = req.userId;

    if (!resumeText?.trim()) {
      return res.status(400).json({ message: "Could not extract text from PDF. Make sure it is not a scanned image." });
    }

    const userPrompt = `You are a resume data extractor. Your ONLY job is to extract information from the resume text below and map it into a structured JSON format. Do NOT invent, rephrase, or improve anything — copy all text verbatim.

Return ONLY a raw JSON object. No markdown, no code fences, no explanation.

JSON structure to return:

{
  "personal_info": {
    "full_name": "full name exactly as written, or empty string",
    "profession": "job title / headline exactly as written, or empty string",
    "email": "email or empty string",
    "phone": "phone or empty string",
    "location": "city/country or empty string",
    "linkedin": "linkedin url or empty string",
    "website": "personal website url or empty string",
    "image": ""
  },
  "professional_summary": "summary paragraph copied verbatim, or empty string",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "company name",
      "position": "job title",
      "start_date": "start date as written",
      "end_date": "end date as written, or empty string if current",
      "is_current": true or false,
      "description": "full description copied verbatim"
    }
  ],
  "education": [
    {
      "institution": "school name",
      "degree": "degree type",
      "field": "field of study or empty string",
      "graduation_date": "graduation date as written or empty string",
      "gpa": "GPA if present or empty string"
    }
  ],
  "project": [
    {
      "name": "project name",
      "type": "project type or empty string",
      "description": "description copied verbatim"
    }
  ],
  "extraSections": [
    {
      "id": "lowercase_id like certifications, awards, languages, publications, volunteer, references",
      "label": "Section heading exactly as written in the resume",
      "items": [
        {
          "title": "item title or name (first line / heading of the item)",
          "subtitle": "role, issuer, or secondary info if present",
          "date": "date if present or empty string",
          "description": "full item description copied verbatim or empty string",
          "url": "url if present or empty string",
          "extra": "any remaining field that doesn't fit above, or empty string"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Copy all text EXACTLY as written. Never improve, rephrase, or summarize.
2. If a field is not present, use empty string "" or empty array [].
3. extraSections must contain ALL sections not covered by the standard fields above: certifications, awards, languages, volunteer work, publications, references, interests, etc.
4. For extraSections items, map fields as best you can — title is the primary identifier (cert name, award title, language name, etc.)
5. skills should be a flat array of strings only.

Resume text:
---
${resumeText}
---`;

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a resume data extractor. Extract fields exactly as written. Return only valid JSON." },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    let parsed;
    try {
      const raw = response.choices[0].message.content;
      parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
    } catch (e) {
      console.error("AI returned invalid JSON:", response.choices[0].message.content);
      return res.status(500).json({ message: "AI could not parse your resume. Please try again." });
    }

    // ── Build sections array ────────────────────────────────
    // Standard sections always present
    const finalSections = [
      { id: 'summary',    label: 'Professional Summary', visible: true, order: 0 },
      { id: 'experience', label: 'Work Experience',       visible: true, order: 1 },
      { id: 'education',  label: 'Education',             visible: true, order: 2 },
      { id: 'projects',   label: 'Projects',              visible: true, order: 3 },
      { id: 'skills',     label: 'Skills',                visible: true, order: 4 },
    ];

    // Extra sections from AI — add as custom editable sections
    const extraSections = Array.isArray(parsed.extraSections) ? parsed.extraSections : [];
    extraSections.forEach((es, i) => {
      if (!es?.id || !es?.label) return;
      finalSections.push({
        id:       es.id,
        label:    es.label,
        visible:  true,
        order:    finalSections.length,
        isCustom: true,
        // Store extracted items so builder can populate the form
        items:    Array.isArray(es.items) ? es.items : [],
      });
    });

    // ── Use clean default style — no layout guessing ────────
    const DEFAULT_GLOBAL_STYLE = {
      layout: 'single',
      showPhoto: false,
      photoShape: 'circle',
      photoPosition: 'top-left',
      sidebarWidth: 30,
      accentColor: '#10b981',
      backgroundColor: '#ffffff',
      sidebarBg: '#f1f5f9',
      headerBg: '#10b981',
      headerTextColor: '#ffffff',
      sectionTitleColor: '#10b981',
      bodyTextColor: '#334155',
      mutedTextColor: '#64748b',
      borderColor: '#e2e8f0',
      fontFamily: 'Inter',
      baseFontSize: 14,
      nameSize: 32,
      nameBold: true,
      sectionTitleSize: 13,
      sectionTitleBold: true,
      sectionTitleUppercase: true,
      sectionTitleLetterSpacing: 2,
      pagePadding: 32,
      sectionGap: 24,
      itemGap: 12,
      showDividers: true,
      dividerStyle: 'solid',
      headerStyle: 'none',
      skillStyle: 'plain',
      skillBg: '#d1fae5',
      skillColor: '#065f46',
      bulletStyle: 'disc',
    };

    // ── Save to DB ──────────────────────────────────────────
    const newResume = await Resume.create({
      userId,
      title:                title || 'Imported Resume',
      globalStyle:          DEFAULT_GLOBAL_STYLE,
      sections:             finalSections,
      professional_summary: parsed.professional_summary || '',
      skills:               Array.isArray(parsed.skills) ? parsed.skills : [],
      personal_info: {
        image:      '',
        full_name:  parsed.personal_info?.full_name  || '',
        profession: parsed.personal_info?.profession || '',
        email:      parsed.personal_info?.email      || '',
        phone:      parsed.personal_info?.phone      || '',
        location:   parsed.personal_info?.location   || '',
        linkedin:   parsed.personal_info?.linkedin   || '',
        website:    parsed.personal_info?.website    || '',
      },
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map(e => ({
            company:     e.company     || '',
            position:    e.position    || '',
            start_date:  e.start_date  || '',
            end_date:    e.end_date    || '',
            description: e.description || '',
            is_current:  e.is_current  || false,
          }))
        : [],
      project: Array.isArray(parsed.project)
        ? parsed.project.map(p => ({
            name:        p.name        || '',
            type:        p.type        || '',
            description: p.description || '',
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map(e => ({
            institution:     e.institution     || '',
            degree:          e.degree          || '',
            field:           e.field           || '',
            graduation_date: e.graduation_date || '',
            gpa:             e.gpa             || '',
          }))
        : [],
    });

    res.status(201).json({ resumeId: newResume._id });

  } catch (error) {
    console.error('uploadResume error:', error);
    res.status(500).json({ message: error.message });
  }
};