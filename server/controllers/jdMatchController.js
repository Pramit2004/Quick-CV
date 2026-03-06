import JDMatch from "../models/JDMatch.js";
import ai from "../configs/ai.js";

export const analyzeJDMatch = async (req, res) => {
  try {
    const { resumeText, jd } = req.body;
    const userId = req.userId;

    const resumeLen = resumeText?.trim().length || 0;
    const jdLen = jd?.trim().length || 0;

    // Reject bad inputs
    if (jdLen < 100 || resumeLen < 100) {
      await JDMatch.create({
        userId, resumeText: resumeText || "", jdText: jd || "",
        resumeLength: resumeLen, jdLength: jdLen,
        status: "Invalid Input", score: 0,
        summary: "Input too short to analyze accurately."
      });
      return res.status(400).json({ message: "Both Resume and Job Description must contain sufficient text." });
    }

    // Extremely strict and detailed system prompt
    const systemPrompt = `
You are a ruthless, highly accurate Fortune 500 ATS (Applicant Tracking System) and Senior Technical Recruiter.
Compare the RESUME against the JOB DESCRIPTION. Be highly critical.

Return ONLY valid JSON. No markdown.
Schema:
{
  "score": number (0 to 100. Be strict. Deduct heavily for missing core skills),
  "summary": string (1-2 sentences summarizing candidate fit),
  "matchedSkills": string[] (List of up to 12 exact matching skills/tools),
  "missingSkills": string[] (List of up to 10 critical skills/tools required but missing),
  "experienceMatch": string (Analyze if candidate's years of experience align with the JD requirements),
  "impactAnalysis": string (Evaluate tone, use of action verbs, and quantifiable metrics in the resume),
  "actionPlan": string[] (3 to 5 highly specific, actionable steps to improve the resume for this exact JD)
}
`;

    const userPrompt = `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`;

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2 // Low temp for more analytical, consistent results
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    // Save for Admin Analytics
    await JDMatch.create({
      userId, resumeText, jdText: jd,
      resumeLength: resumeLen, jdLength: jdLen,
      status: "Success",
      score: parsed.score || 0,
      summary: parsed.summary || "",
      matchedSkills: parsed.matchedSkills || [],
      missingSkills: parsed.missingSkills || [],
      experienceMatch: parsed.experienceMatch || "",
      impactAnalysis: parsed.impactAnalysis || "",
      actionPlan: parsed.actionPlan || []
    });

    res.json(parsed);

  } catch (err) {
    console.error("JD MATCH ERROR:", err);
    res.status(500).json({ message: "JD Match analysis failed due to an unexpected error." });
  }
};