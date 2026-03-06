import imagekit from "../configs/imageKit.js";
import Resume from "../models/Resume.js";
import fs from 'fs';

// POST: /api/resumes/create
export const createResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, globalStyle, sections, previewData } = req.body;

        const resumePayload = { userId, title };

        // If created from a template, store its design
        if (globalStyle && typeof globalStyle === 'object') {
            resumePayload.globalStyle = globalStyle;
        }
        if (Array.isArray(sections) && sections.length > 0) {
            resumePayload.sections = sections;
        }

        // If template has previewData (dummy content), use it as starting point
        // so builder shows the template's placeholder data, not blank fields
        if (previewData && typeof previewData === 'object') {
            if (previewData.personal_info)        resumePayload.personal_info        = previewData.personal_info;
            if (previewData.professional_summary) resumePayload.professional_summary = previewData.professional_summary;
            if (Array.isArray(previewData.skills))      resumePayload.skills      = previewData.skills;
            if (Array.isArray(previewData.experience))  resumePayload.experience  = previewData.experience;
            if (Array.isArray(previewData.education))   resumePayload.education   = previewData.education;
            if (Array.isArray(previewData.project))     resumePayload.project     = previewData.project;
        }

        const newResume = await Resume.create(resumePayload);
        return res.status(201).json({ message: 'Resume created successfully', resume: newResume });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// DELETE: /api/resumes/delete/:resumeId
export const deleteResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId } = req.params;

        await Resume.findOneAndDelete({ userId, _id: resumeId });
        return res.status(200).json({ message: 'Resume deleted successfully' });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET: /api/resumes/get/:resumeId
export const getResumeById = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId } = req.params;

        const resume = await Resume.findOne({ userId, _id: resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        resume.__v = undefined;
        resume.createdAt = undefined;
        resume.updatedAt = undefined;

        return res.status(200).json({ resume });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET: /api/resumes/public/:resumeId
export const getPublicResumeById = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const resume = await Resume.findOne({ public: true, _id: resumeId });

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        return res.status(200).json({ resume });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// PUT: /api/resumes/update
export const updateResume = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeId, resumeData, removeBackground } = req.body;
        const image = req.file;

        let resumeDataCopy;
        if (typeof resumeData === 'string') {
            resumeDataCopy = await JSON.parse(resumeData);
        } else {
            resumeDataCopy = structuredClone(resumeData);
        }

        if (image) {
            const imageBufferData = fs.createReadStream(image.path);

            const response = await imagekit.files.upload({
                file: imageBufferData,
                fileName: 'resume.png',
                folder: 'user-resumes',
                transformation: {
                    pre: 'w-300,h-300,fo-face,z-0.75' + (removeBackground ? ',e-bgremove' : '')
                }
            });

            resumeDataCopy.personal_info.image = response.url;
        }

        const resume = await Resume.findByIdAndUpdate(
            { userId, _id: resumeId },
            resumeDataCopy,
            { new: true }
        );

        return res.status(200).json({ message: 'Saved successfully', resume });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// POST /api/resumes/create-from-template
export const createResumeFromTemplate = async (req, res) => {
    try {
        const { title, globalStyle, sections, previewData } = req.body;
        const userId = req.userId;

        const resume = await Resume.create({
            userId,
            title:                title || "My Resume",
            template:             "dynamic",
            globalStyle:          globalStyle || null,
            sections:             sections    || null,
            personal_info:        previewData?.personal_info        || {},
            professional_summary: previewData?.professional_summary || "",
            skills:               previewData?.skills               || [],
            experience:           previewData?.experience           || [],
            education:            previewData?.education            || [],
            project:              previewData?.project              || [],
        });

        return res.status(201).json({ resume });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}