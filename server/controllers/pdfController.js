import puppeteer from "puppeteer";
import Resume from "../models/Resume.js";

export const exportResumePDF = async (req, res) => {
  try {
    const { html, resumeId } = req.body;

    if (!html) {
      return res.status(400).json({ message: "HTML is required" });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // ── Increment download count if resumeId provided ──────
    if (resumeId) {
      await Resume.findByIdAndUpdate(resumeId, {
        $inc: { downloadCount: 1 },
        lastDownloadedAt: new Date(),
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf"
    });

    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF generation failed" });
  }
};
