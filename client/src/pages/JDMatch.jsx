import React, { useState, useEffect, useRef, useCallback } from "react";
import pdfToText from "react-pdftotext";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// ─── Use pdfjs-dist DIRECTLY — no react-pdf wrapper ──────────
// This avoids the version mismatch issue entirely.
// pdfjs-dist is already installed as a dependency of react-pdf.
import * as pdfjsLib from "pdfjs-dist";

// Set worker — use the same pdfjs-dist package, no CDN needed
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

import {
  ArrowLeftIcon,
  UploadCloudIcon,
  FileTextIcon,
  SparklesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BriefcaseIcon,
  ActivityIcon,
  ListTodoIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TargetIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Animated Circular Progress
// ─────────────────────────────────────────────────────────────
const CircularProgress = ({ score }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setCurrent(n);
      if (n >= score) clearInterval(id);
    }, 1500 / score);
    return () => clearInterval(id);
  }, [score]);

  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const offset = 283 - (283 * current) / 100;

  return (
    <div className="relative flex items-center justify-center size-28 shrink-0">
      <svg className="transform -rotate-90 w-28 h-28">
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="#f1f5f9"
          strokeWidth="7"
          fill="transparent"
        />
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke={color}
          strokeWidth="7"
          fill="transparent"
          strokeDasharray="283"
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-75"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold" style={{ color }}>
          {current}%
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PDF Viewer — renders directly via pdfjs-dist onto a <canvas>
// No react-pdf, no version mismatch, always works.
// ─────────────────────────────────────────────────────────────
const PDFViewer = ({ file }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load PDF from File object whenever file changes
  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(false);
    setPageNumber(1);
    setPdfDoc(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error("PDF load error:", err);
        setError(true);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError(true);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  // Render current page onto canvas whenever pdfDoc or pageNumber changes
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Scale to fit container width
      const containerWidth = containerRef.current.clientWidth - 32; // 16px padding each side
      const viewport0 = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport0.width;
      const viewport = page.getViewport({ scale });

      // Apply device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Page render error:", err);
      }
    }
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Re-render on window resize
  useEffect(() => {
    const onResize = () => renderPage();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderPage]);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Resume Preview
          </span>
        </div>

        {numPages > 1 && (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1 py-1">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
            >
              <ChevronLeftIcon className="size-3.5 text-slate-600" />
            </button>
            <span className="text-xs font-semibold text-slate-600 w-12 text-center">
              {pageNumber} / {numPages}
            </span>
            <button
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
            >
              <ChevronRightIcon className="size-3.5 text-slate-600" />
            </button>
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex justify-center py-6 px-4 custom-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400 font-medium h-64">
            <div className="size-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading PDF...
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-rose-500 font-semibold h-64">
            <XCircleIcon className="size-8 text-rose-400" />
            Failed to load PDF. Please try another file.
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white shadow-xl ring-1 ring-slate-900/5">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// JDMatch — main page
// ─────────────────────────────────────────────────────────────
const JDMatch = () => {
  const { token } = useSelector((s) => s.auth);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJD] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mobileTab, setMobileTab] = useState("jd"); // "resume" | "jd"

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.includes("pdf"))
      return toast.error("Please upload a PDF file");
    setResumeFile(file);
    setResult(null);
    try {
      const text = await pdfToText(file);
      if (text.trim().length < 100) {
        toast.error("Could not extract enough text. Try another PDF.");
        setResumeText("");
      } else {
        setResumeText(text);
        toast.success("Resume attached!");
      }
    } catch {
      toast.error("Failed to read PDF text");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const runMatch = async () => {
    if (!resumeText) return toast.error("Please attach a valid PDF.");
    if (jd.trim().length < 100)
      return toast.error("Please paste a complete Job Description.");
    setLoading(true);
    setMobileTab("jd");
    try {
      const { data } = await api.post(
        "/api/jd-match/analyze",
        { resumeText, jd },
        { headers: { Authorization: token } },
      );
      setResult(data);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // ── VIEW 1: Upload screen ──────────────────────────────────
  if (!resumeFile) {
    return (
      <div className="min-h-screen mt-0 bg-red-50 flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
        <div className="absolute top-0 right-0 w-[45vw] h-[45vw] bg-emerald-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none -z-10" />
        <div className="absolute bottom-0  left-0 w-[35vw] h-[35vw] bg-teal-100/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none -z-10" />

        <div className="w-full max-w-lg z-10">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-10"
          >
            <ArrowLeftIcon className="size-4" /> Back to Dashboard
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-3">
            <SparklesIcon className="size-3 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">
              AI Match Maker
            </span>
          </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              JD Matcher
            </h1>
            <p className="text-slate-500 text-base">
              Upload your resume and see how well you match any job description.
            </p>
          </div>

          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 bg-white/80 ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]"
                : "border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5"
            }`}
          >
            <div className="size-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <UploadCloudIcon className="size-6 text-emerald-600" />
            </div>
            <p className="text-base font-bold text-slate-700 mb-1">
              Drop your PDF resume here
            </p>
            <p className="text-sm text-slate-400">or click to browse files</p>
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
    );
  }

  // ── VIEW 2: Split screen ───────────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/app"
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <TargetIcon className="size-4 text-emerald-600 hidden sm:block" />
              <h1 className="text-sm font-bold text-slate-800">JD Matcher</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop: file name + replace */}
            <label className="hidden md:flex items-center gap-2.5 bg-slate-50 border border-slate-200 hover:border-emerald-300 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all group shadow-sm">
              <FileTextIcon className="size-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-600 max-w-[200px] truncate">
                {resumeFile.name}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                Replace
              </span>
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>

            {/* Mobile tab switcher */}
            <div className="flex md:hidden bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMobileTab("resume")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mobileTab === "resume" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
              >
                Resume
              </button>
              <button
                onClick={() => setMobileTab("jd")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mobileTab === "jd" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
              >
                Results
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Split layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-[1800px] mx-auto">
        {/* LEFT — PDF preview */}
        <div
          className={`w-full md:w-[42%] lg:w-[40%] border-r border-slate-200 bg-white shrink-0 flex flex-col overflow-hidden ${
            mobileTab === "jd" ? "hidden md:flex" : "flex"
          }`}
        >
          <PDFViewer file={resumeFile} />

          {/* Mobile replace button */}
          <label className="md:hidden absolute bottom-5 left-5 right-5 bg-slate-900 text-white flex items-center justify-center gap-2 py-3 rounded-xl shadow-lg cursor-pointer font-semibold text-sm z-10">
            <FileTextIcon className="size-4" /> Replace Document
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* RIGHT — JD input / Results */}
        <div
          className={`w-full md:w-[58%] lg:w-[60%] bg-white flex flex-col overflow-hidden ${
            mobileTab === "resume" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Loading */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
              <div className="relative size-20 mb-6">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-7 text-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Analyzing compatibility...
              </h3>
              <p className="text-sm text-slate-500 mt-1.5">
                Checking keywords, experience & impact.
              </p>
            </div>
          ) : /* Results */
          result ? (
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-800">
                  Analysis Report
                </h2>
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"
                >
                  <RefreshCwIcon className="size-3.5" /> Edit JD
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <CircularProgress score={result.score} />
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                    Executive Summary
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
                    <CheckCircle2Icon className="size-4 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-800">
                      Matched Skills
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills?.length ? (
                      result.matchedSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">None found.</p>
                    )}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
                    <XCircleIcon className="size-4 text-rose-500" />
                    <h4 className="font-bold text-sm text-slate-800">
                      Missing Skills
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills?.length ? (
                      result.missingSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">
                        All required skills found!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex gap-3">
                  <BriefcaseIcon className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">
                      Experience Alignment
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.experienceMatch}
                    </p>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex gap-3">
                  <ActivityIcon className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">
                      Impact & Tone
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.impactAnalysis}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ListTodoIcon className="size-4 text-slate-700" />
                  <h3 className="font-extrabold text-base text-slate-800">
                    Action Plan
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {result.actionPlan?.map((plan, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors"
                    >
                      <span className="flex items-center justify-center size-5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shrink-0 shadow-sm">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {plan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* JD Input */
            <div className="flex-1 flex flex-col p-5 sm:p-7 bg-white overflow-hidden">
              <div className="mb-5">
                <h2 className="text-xl font-extrabold text-slate-800">
                  Job Description
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Paste the specific job posting you are targeting.
                </p>
              </div>
              <textarea
                value={jd}
                onChange={(e) => setJD(e.target.value)}
                placeholder="We are looking for a Senior Developer with 5+ years of experience in React..."
                className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none custom-scrollbar mb-5 min-h-[160px]"
              />
              <button
                onClick={runMatch}
                disabled={!jd || jd.trim().length < 50}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-slate-900/10"
              >
                <SparklesIcon className="size-4" /> Analyze Match
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default JDMatch;
