/**
 * ATSChecker.jsx — COMPLETE REDESIGN v4
 * Beautiful, world-class design + full score transparency + loading states
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api   from '../configs/api';
import toast from 'react-hot-toast';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  UploadCloudIcon, FileTextIcon, SparklesIcon, CheckCircle2Icon,
  XCircleIcon, AlertTriangleIcon, ZapIcon, TargetIcon, BookOpenIcon,
  ArrowLeftIcon, ClockIcon, AwardIcon, BarChart2Icon, ShieldCheckIcon,
  ChevronDownIcon, ChevronUpIcon, EyeIcon, BriefcaseIcon,
  GraduationCapIcon, CodeIcon, UserIcon, LoaderCircleIcon,
  TrendingUpIcon, InfoIcon, ChevronRightIcon,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeScore = (v) => typeof v === 'object' ? (v?.score ?? 0) : (v ?? 0);
const safeNum   = (v) => (typeof v === 'number' && !isNaN(v)) ? v : 0;
const pct       = (v, m) => m > 0 ? Math.min(100, Math.round((safeNum(v) / safeNum(m)) * 100)) : 0;

function scoreColor(s) {
  if (s >= 80) return '#10b981';
  if (s >= 65) return '#3b82f6';
  if (s >= 50) return '#f59e0b';
  if (s >= 35) return '#f97316';
  return '#ef4444';
}
function scoreMeta(s) {
  if (s >= 90) return { label: 'Excellent', emoji: '🏆', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
  if (s >= 75) return { label: 'Great',     emoji: '⭐', bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200' };
  if (s >= 60) return { label: 'Good',      emoji: '✅', bg: 'bg-amber-50',   text: 'text-amber-600',  border: 'border-amber-200' };
  if (s >= 45) return { label: 'Fair',      emoji: '⚠️', bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-200' };
  return             { label: 'Needs Work', emoji: '🔧', bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200' };
}

const authHeaders = (token) => ({ Authorization: token });

// ─── Score Gauge ──────────────────────────────────────────────────────────────
const ScoreGauge = ({ score }) => {
  const [cur, setCur] = useState(0);
  const s = safeNum(score);
  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.ceil(s / 50));
    const id = setInterval(() => { n = Math.min(n + step, s); setCur(n); if (n >= s) clearInterval(id); }, 20);
    return () => clearInterval(id);
  }, [s]);
  const c = scoreColor(s);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (cur / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={c} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.03s' }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-black leading-none" style={{ color: c }}>{cur}</span>
        <span className="text-xs text-slate-400 font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

// ─── Score Bar with transparency tooltip ─────────────────────────────────────
const ScoreBar = ({ label, score, max, color, reason }) => {
  const [open, setOpen] = useState(false);
  const s = safeNum(score);
  const m = safeNum(max) || 1;
  const p = Math.min(100, Math.round((s / m) * 100));
  return (
    <div className="group">
      <div className="flex items-center gap-2 py-1.5">
        <div className="w-32 text-xs text-slate-500 shrink-0 flex items-center gap-1">
          {label}
          {reason && (
            <button onClick={() => setOpen(!open)} className="text-slate-300 hover:text-slate-500 transition-colors ml-auto">
              <InfoIcon size={11} />
            </button>
          )}
        </div>
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${p}%`, background: color }} />
        </div>
        <div className="text-xs font-bold text-slate-700 w-16 text-right tabular-nums">
          {s % 1 === 0 ? s : s.toFixed(1)} / {m}
        </div>
      </div>
      {open && reason && (
        <div className="mx-0 mb-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 leading-relaxed">
          {reason}
        </div>
      )}
    </div>
  );
};

// ─── Radar Chart ─────────────────────────────────────────────────────────────
const CategoryRadar = ({ scores }) => {
  const data = [
    { subject: 'Structure', value: pct(safeScore(scores?.structure), 25) },
    { subject: 'Content',   value: pct(safeScore(scores?.content),   30) },
    { subject: 'Writing',   value: pct(safeScore(scores?.writing),   20) },
    { subject: 'ATS',       value: pct(safeScore(scores?.ats),       15) },
    { subject: 'Authority', value: pct(safeScore(scores?.advanced),  10) },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
        <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// ─── ATS Meter ────────────────────────────────────────────────────────────────
const ATSMeter = ({ sim }) => {
  const platforms = [
    { name: 'Workday',    score: safeNum(sim?.workday),    icon: '🏢', desc: 'Enterprise-focused, keyword-heavy' },
    { name: 'Taleo',      score: safeNum(sim?.taleo),      icon: '🔷', desc: 'Strict date & format requirements' },
    { name: 'Greenhouse', score: safeNum(sim?.greenhouse), icon: '🌱', desc: 'Balanced, rewards rich content' },
    { name: 'Lever',      score: safeNum(sim?.lever),      icon: '⚡', desc: 'Modern, rewards projects & links' },
  ];
  return (
    <div className="space-y-3">
      {platforms.map(p => {
        const c = scoreColor(p.score);
        return (
          <div key={p.name} className="flex items-center gap-3">
            <span className="w-5 text-base shrink-0">{p.icon}</span>
            <div className="w-20 shrink-0">
              <div className="text-xs font-bold text-slate-700">{p.name}</div>
              <div className="text-[9px] text-slate-400 leading-tight">{p.desc}</div>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${p.score}%`, background: c }} />
            </div>
            <span className="text-xs font-black w-9 text-right shrink-0" style={{ color: c }}>{p.score}%</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Keyword Cloud ────────────────────────────────────────────────────────────
const KeywordCloud = ({ found, missing }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
      <div className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3">
        ✅ Matched ({(found||[]).length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(found||[]).slice(0,20).map((k,i) => (
          <span key={i} className="text-xs bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-medium">
            {k.word || k}
          </span>
        ))}
      </div>
    </div>
    <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
      <div className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">
        ❌ Missing ({(missing||[]).length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(missing||[]).slice(0,20).map((k,i) => (
          <span key={i} className="text-xs bg-white text-red-500 border border-red-200 px-2 py-0.5 rounded-lg font-medium">
            {k}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ─── Suggestion Card ──────────────────────────────────────────────────────────
const SuggestionCard = ({ s, onEnhance, enhancing }) => {
  const [open, setOpen] = useState(false);
  const styles = {
    high:   { border: 'border-red-200',   bg: 'bg-red-50/60',    badge: 'bg-red-100 text-red-700',    icon: '🚨', label: 'Critical' },
    medium: { border: 'border-amber-200', bg: 'bg-amber-50/60',  badge: 'bg-amber-100 text-amber-700', icon: '📈', label: 'High Impact' },
    low:    { border: 'border-blue-200',  bg: 'bg-blue-50/60',   badge: 'bg-blue-100 text-blue-600',   icon: '⚡', label: 'Optimize' },
  };
  const st = styles[s.priority] || styles.low;
  return (
    <div className={`rounded-2xl border p-4 ${st.border} ${st.bg}`}>
      <div className="flex items-start gap-3">
        <span className="text-base shrink-0 mt-0.5">{st.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
            {s.impact > 0 && <span className="text-[10px] text-slate-400 font-semibold">+{s.impact} pts</span>}
          </div>
          <p className="text-sm text-slate-700 font-medium leading-snug">{s.message}</p>
          {s.original && (
            <button onClick={() => setOpen(!open)} className="text-[10px] text-slate-400 hover:text-slate-600 mt-1.5 flex items-center gap-1">
              {open ? <ChevronUpIcon size={10}/> : <ChevronDownIcon size={10}/>} {open ? 'Hide' : 'Show'} details
            </button>
          )}
          {open && s.original && (
            <div className="mt-2 text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-200 italic">
              {s.original}
            </div>
          )}
        </div>
        {onEnhance && (
          <button onClick={() => onEnhance(s)} disabled={enhancing}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-colors">
            {enhancing ? <LoaderCircleIcon size={11} className="animate-spin"/> : <SparklesIcon size={11}/>} AI Fix
          </button>
        )}
      </div>
    </div>
  );
};

// ─── SCORE REASONING DATA ─────────────────────────────────────────────────────
// Maps each sub-score to a plain-English explanation of what was checked
function buildScoreReasons(report) {
  const s    = report?.scores || {};
  const bd   = s.breakdown   || {};
  const A    = bd.A || {};
  const B    = bd.B || {};
  const C    = bd.C || {};
  const D    = bd.D || {};
  const E    = bd.E || {};
  const ct   = report?.contact   || {};
  const kw   = report?.keywords  || {};
  const wr   = report?.writing   || {};
  const adv  = report?.advanced  || {};
  const meta = report?.meta      || {};

  const wordCount   = safeNum(meta.wordCount || report?.wordCount);
  const kwFound     = safeNum(kw.totalFound);
  const fluff       = wr.fluff?.found || [];
  const strongRatio = safeNum(wr.actionVerbs?.strongRatio);
  const quantRatio  = safeNum(wr.quantification?.ratio);
  const skills      = report?.skills?.topSkills || report?.parsedContent?.skills || [];
  const fk          = safeNum(wr.readability?.fleschKincaid);

  return {
    A1: [
      { label: 'Full name',  found: Boolean(ct.hasName),     pts: 1,   note: ct.hasName     ? 'Detected' : 'Not found in header' },
      { label: 'Email',      found: Boolean(ct.hasEmail),    pts: 1.5, note: ct.hasEmail     ? 'Detected' : 'Missing or unreadable' },
      { label: 'Phone',      found: Boolean(ct.hasPhone),    pts: 1,   note: ct.hasPhone     ? 'Detected' : 'Not found' },
      { label: 'Location',   found: Boolean(ct.hasLocation), pts: 0.5, note: ct.hasLocation  ? 'Detected' : 'City/location not found' },
      { label: 'LinkedIn',   found: Boolean(ct.hasLinkedIn), pts: 1,   note: ct.hasLinkedIn  ? 'Profile found' : 'LinkedIn URL or word not detected — add as plain text URL' },
    ],
    A2: (() => {
      const missing = meta.missingSections || [];
      return [
        { label: 'Summary',     found: !missing.includes('Professional Summary'), pts: 1.5, note: missing.includes('Professional Summary') ? 'Missing — ATS deducted 1.5 pts' : 'Present' },
        { label: 'Experience',  found: !missing.includes('Work Experience'),      pts: 3,   note: missing.includes('Work Experience')      ? 'Missing or not parsed — ATS deducted 3 pts (biggest deduction)' : 'Present' },
        { label: 'Education',   found: !missing.includes('Education'),            pts: 1.5, note: missing.includes('Education')            ? 'Missing — ATS deducted 1.5 pts' : 'Present' },
        { label: 'Skills',      found: !missing.includes('Skills'),               pts: 1,   note: missing.includes('Skills')               ? 'Fewer than 3 skills detected — deducted 1 pt' : 'Present (3+ skills)' },
      ];
    })(),
    A3: [
      { label: `${wordCount} words detected`, found: wordCount >= 400 && wordCount <= 700, pts: 5,
        note: wordCount < 200 ? 'Extremely short — scores 0/5. ATS cannot evaluate properly.' :
              wordCount < 300 ? 'Too short (< 300 words) — scored 1/5. Aim for 400–700.' :
              wordCount < 400 ? 'Short (300–400 words) — scored 2/5. Add more detail.' :
              wordCount > 900 ? 'Too long (> 900 words) — scored 1/5. Trim to 1–2 pages.' :
              wordCount > 700 ? 'Slightly long (700–900 words) — scored 4/5.' :
              'Ideal length (400–700 words) — scored 5/5.' },
    ],
    A4: [
      { label: 'Bullet points per role', found: safeNum(A.A4) >= 3, pts: 5,
        note: `Scored ${safeNum(A.A4).toFixed(1)}/5. ${
          safeNum(A.A4) >= 4 ? 'Good bullet usage — 3+ bullets per role/project.' :
          safeNum(A.A4) >= 2 ? 'Partial — 1–2 bullets per role. Aim for 3–6.' :
          safeNum(A.A4) >= 1 ? 'Few bullets detected (avg < 1 per role).' :
          'No experience bullets found — student mode applied using project bullets.'
        }` },
    ],
    A5: [
      { label: 'No format issues', found: safeNum(A.A5) >= 2, pts: 3,
        note: safeNum(A.A5) >= 3 ? 'PDF parses cleanly — no format issues.' : 'Minor format warnings detected.' },
    ],
    B1: [
      { label: `${meta.careerLevel === 'student' ? 'Projects as proxy' : 'Work experience depth'}`, found: safeNum(B.B1) >= 5, pts: meta.careerLevel === 'student' ? 6 : 10,
        note: meta.careerLevel === 'student'
          ? `Student mode: max 6/10 (projects scored as experience proxy). Got ${safeNum(B.B1).toFixed(1)}/6.`
          : `Scored ${safeNum(B.B1).toFixed(1)}/10. Checks: has entries (+2), dates (+1.5), 2+ jobs (+1), bullets (+2.5 if avg≥3), company/title names (+1 each), recency (+1).` },
    ],
    B2: [
      { label: 'Degree', found: Boolean(report?.education?.hasDegree), pts: 1.5, note: report?.education?.hasDegree ? 'Degree detected' : 'No degree found' },
      { label: 'Institution', found: Boolean(report?.education?.hasInstitution), pts: 1, note: report?.education?.hasInstitution ? 'Institution detected' : 'No institution found' },
      { label: 'Graduation date', found: Boolean(report?.education?.hasDate), pts: 0.5, note: report?.education?.hasDate ? 'Year found' : 'No graduation year' },
      { label: 'Advanced degree', found: Boolean(report?.education?.hasAdvanced), pts: 0.5, note: report?.education?.hasAdvanced ? 'Master/PhD detected (+0.5 bonus)' : 'No advanced degree' },
    ],
    B3: [
      { label: `${skills.length} skills detected`, found: skills.length >= 10, pts: 7,
        note: skills.length >= 15 ? '15+ skills → 7/7. Excellent coverage.' :
              skills.length >= 10 ? '10–14 skills → 5.5 base + tech bonus. Good.' :
              skills.length >= 7  ? '7–9 skills → 4 base. Add more for higher score.' :
              skills.length >= 5  ? '5–6 skills → 3/7. ATS needs 10–15.' :
              'Fewer than 5 skills detected — check that your skills section parsed correctly.' },
    ],
    B4: [
      { label: 'Has projects', found: safeNum(B.B4) >= 1.5, pts: 2, note: safeNum(B.B4) >= 1.5 ? '1+ projects detected' : 'No projects found' },
      { label: 'Project descriptions', found: Boolean(report?.projects?.hasDesc), pts: 1, note: report?.projects?.hasDesc ? 'Descriptions found' : 'No project descriptions parsed' },
      { label: 'GitHub/live links', found: Boolean(report?.projects?.hasLinks), pts: 1, note: report?.projects?.hasLinks ? 'Links detected' : 'No project links found (hyperlinks in PDF not parsed as URLs)' },
    ],
    B5: [
      { label: `${safeNum(wr.quantification?.count)} quantified bullets`, found: quantRatio >= 30, pts: 4,
        note: quantRatio >= 50 ? `${quantRatio}% of bullets have numbers → 4/4. Excellent.` :
              quantRatio >= 30 ? `${quantRatio}% → 3/4. Good.` :
              quantRatio >= 15 ? `${quantRatio}% → 2/4. Add more numbers.` :
              quantRatio >= 5  ? `${quantRatio}% → 1/4. Very few quantified bullets.` :
              `${quantRatio}% → 0/4. No measurable results detected.` },
    ],
    C1: [
      { label: `${strongRatio}% strong action verbs`, found: strongRatio >= 60, pts: 5,
        note: strongRatio >= 80 ? `${strongRatio}% strong verbs → 5/5.` :
              strongRatio >= 60 ? `${strongRatio}% → 4/5.` :
              strongRatio >= 40 ? `${strongRatio}% → 3/5.` :
              strongRatio >= 20 ? `${strongRatio}% → 2/5.` :
              strongRatio >= 1  ? `${strongRatio}% → 1/5.` :
              'No bullets detected → 0/5.' },
    ],
    C2: [
      { label: `${quantRatio}% bullets with metrics`, found: quantRatio >= 30, pts: 5,
        note: `Same as B5 but measured separately for writing. Scored ${safeNum(C.C2)}/5.` },
    ],
    C3: [
      { label: fluff.length > 0 ? `${fluff.length} buzzword(s) found` : 'No buzzwords', found: fluff.length === 0, pts: 5,
        note: fluff.length === 0 ? 'No buzzwords — scored 5/5.' :
          `Found: "${fluff.slice(0,4).join('", "')}" — each deducts 1.5 pts. Scored ${safeNum(C.C3)}/5.` },
    ],
    C4: [
      { label: `Flesch-Kincaid grade: ${fk}`, found: fk >= 8 && fk <= 12, pts: 3,
        note: `Grade ${fk}. Ideal for resumes: 8–12. ${
          fk >= 8 && fk <= 12 ? 'Excellent — 3/3.' :
          fk >= 6 ? '2/3 — slightly simple.' : '1/3 — text too simple or complex.' }` },
    ],
    C5: [
      { label: 'Consistent verb tense', found: Boolean(wr.tenseConsistency?.consistent), pts: 2,
        note: wr.tenseConsistency?.consistent ? 'Tense is consistent — 2/2.' : `Inconsistent tense detected (${safeNum(wr.tenseConsistency?.inconsistencyRatio)}% inconsistency) — 0/2.` },
    ],
    D1: [
      { label: `${kwFound} industry keywords found`, found: kwFound >= 15, pts: 8,
        note: `Domain: ${(kw.domain?.domain||'general').replace(/_/g,' ')} (${safeNum(kw.domain?.confidence)}% confidence). ${
          kwFound >= 25 ? '25+ keywords → 8/8.' :
          kwFound >= 20 ? '20–24 → 7/8.' :
          kwFound >= 15 ? '15–19 → 6/8.' :
          kwFound >= 10 ? '10–14 → 5/8.' :
          kwFound >= 7  ? '7–9 → 4/8.' :
          kwFound >= 4  ? '4–6 → 3/8.' : 'Fewer than 4 → 1–2/8.' }` },
    ],
    D2: [
      { label: 'ATS parsability', found: safeNum(D.D2) >= 3, pts: 4,
        note: `Scored ${safeNum(D.D2)}/4. Starts at format parseability score, then deducted 1pt per missing critical section (experience, education, skills).` },
    ],
    D3: [
      { label: 'Format compliance', found: safeNum(D.D3) >= 2, pts: 3,
        note: `Scored ${safeNum(D.D3)}/3. Checks for invalid date formats, special characters, and known ATS-breaking patterns.` },
    ],
    E1: [
      { label: 'Professional summary', found: Boolean(report?.summary?.hasSummary), pts: 1.5, note: report?.summary?.hasSummary ? `Summary present (${safeNum(report.summary?.wordCount)} words). Numbers in summary add +0.5.` : 'No summary found — 0 pts.' },
      { label: 'Career progression', found: safeNum(E.E1) >= 2, pts: 1.5, note: safeNum(E.E1) >= 2 ? 'Senior titles or 2+ roles detected.' : 'No clear career progression (expected for students).' },
    ],
    E2: [
      { label: 'LinkedIn URL', found: Boolean(adv.hasLinkedIn || ct.hasLinkedIn), pts: 1.5, note: (adv.hasLinkedIn || ct.hasLinkedIn) ? 'Detected.' : 'Not found as plain text URL — add linkedin.com/in/yourname directly.' },
      { label: 'GitHub/Portfolio', found: Boolean(adv.hasGitHub), pts: 1, note: adv.hasGitHub ? 'GitHub link detected.' : 'No GitHub/portfolio URL found as plain text.' },
      { label: 'Custom domain', found: safeNum(E.E2) >= 2.5, pts: 0.5, note: 'Personal portfolio site (not LinkedIn/GitHub) adds bonus.' },
    ],
    E3: [
      { label: `Domain confidence: ${safeNum(kw.domain?.confidence)}%`, found: safeNum(kw.domain?.confidence) >= 40, pts: 2,
        note: `Detected as "${(kw.domain?.domain||'general').replace(/_/g,' ')}". ${safeNum(kw.domain?.confidence) >= 60 ? '2/2.' : safeNum(kw.domain?.confidence) >= 40 ? '1.5/2.' : safeNum(kw.domain?.confidence) >= 20 ? '1/2.' : '0.5/2 — low confidence.'}` },
    ],
    E4: [
      { label: `${safeNum(adv.hotSkillMatches)} in-demand skills`, found: safeNum(adv.hotSkillMatches) >= 2, pts: 2,
        note: `Hot skills (AI, cloud, TypeScript, etc.) detected: ${safeNum(adv.hotSkillMatches)}. ${safeNum(adv.hotSkillMatches) >= 4 ? '2/2.' : safeNum(adv.hotSkillMatches) >= 2 ? '1.5/2.' : safeNum(adv.hotSkillMatches) >= 1 ? '1/2.' : '0/2.'}` },
    ],
  };
}

// ─── Sub-score with transparency ─────────────────────────────────────────────
const SubScoreGroup = ({ title, colorClass, items, breakdown, reasons, color }) => {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(items);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${colorClass}`} />
          <div className="text-left">
            <div className="text-sm font-bold text-slate-800">{title}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {safeNum(breakdown?.total).toFixed(1)} / {items[keys[0]]?.[1]} pts total
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 bg-slate-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{
              width: `${pct(breakdown?.total, parseInt(title.match(/\d+/)?.[0] || 25))}%`,
              background: color
            }} />
          </div>
          {open ? <ChevronUpIcon size={14} className="text-slate-400"/> : <ChevronDownIcon size={14} className="text-slate-400"/>}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3 space-y-1">
          {keys.map(key => {
            const [label, max] = items[key];
            const score = safeNum(breakdown?.[key]);
            const reasonItems = reasons?.[key] || [];
            return (
              <SubScoreDetail key={key} label={label} score={score} max={max} color={color} reasonItems={reasonItems} />
            );
          })}
        </div>
      )}
    </div>
  );
};

const SubScoreDetail = ({ label, score, max, color, reasonItems }) => {
  const [open, setOpen] = useState(false);
  const s = safeNum(score);
  const p = pct(s, max);
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 group cursor-pointer" onClick={() => reasonItems.length && setOpen(!open)}>
        <div className="w-36 text-xs text-slate-500 shrink-0">{label}</div>
        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${p}%`, background: color }} />
        </div>
        <div className="text-xs font-bold text-slate-700 w-14 text-right tabular-nums">
          {s % 1 === 0 ? s : s.toFixed(1)} / {max}
        </div>
        {reasonItems.length > 0 && (
          <InfoIcon size={11} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
        )}
      </div>
      {open && reasonItems.length > 0 && (
        <div className="ml-0 mb-2 bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {reasonItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2">
              <span className={`shrink-0 mt-0.5 ${item.found ? 'text-emerald-500' : 'text-red-400'}`}>
                {item.found ? <CheckCircle2Icon size={12}/> : <XCircleIcon size={12}/>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">+{item.pts} pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Resume List Item ──────────────────────────────────────────────────────────
const ResumeListItem = ({ r, onSelect, loading }) => {
  const c = r.atsScore > 0 ? scoreColor(r.atsScore) : '#94a3b8';
  return (
    <button onClick={() => onSelect(r._id)} disabled={loading}
      className="w-full bg-white rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50/50 transition-all p-4 text-left group disabled:opacity-60">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-200">
            <FileTextIcon size={20} className="text-emerald-600" />
          </div>
          {loading && (
            <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
              <LoaderCircleIcon size={16} className="text-emerald-500 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 truncate text-sm">{r.title || 'Untitled Resume'}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
              {r.template || 'Custom'}
            </span>
            <span className="text-[10px] text-slate-400">
              Updated {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {r.atsScore > 0 && (
          <div className="text-right shrink-0">
            <div className="text-xl font-black tabular-nums" style={{ color: c }}>{r.atsScore}</div>
            <div className="text-[9px] text-slate-400 font-medium">ATS SCORE</div>
          </div>
        )}
        <ChevronRightIcon size={16} className="text-slate-300 group-hover:text-emerald-400 transition-colors shrink-0" />
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ATSChecker = () => {
  const { token } = useSelector(s => s.auth);

  const [mode,       setMode]      = useState('choose');
  const [resumes,    setResumes]   = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [report,     setReport]    = useState(null);
  const [history,    setHistory]   = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [file,       setFile]      = useState(null);
  const [fileName,   setFileName]  = useState('');
  const [activeTab,  setActiveTab] = useState('overview');
  const [enhancing,  setEnhancing] = useState(false);
  const [aiResult,   setAiResult]  = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef(null);

  const hdrs = useCallback(() => ({ Authorization: token }), [token]);

  // ── Load resumes with inline loader ──────────────────────────
  const loadResumes = useCallback(async () => {
    setResumesLoading(true);
    try {
      const { data } = await api.get('/api/users/resumes', { headers: hdrs() });
      setResumes(data.resumes || []);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setResumesLoading(false);
    }
  }, [hdrs]);

  useEffect(() => {
    if (mode === 'builder') loadResumes();
  }, [mode, loadResumes]);

  // ── Analyze stored resume ─────────────────────────────────────
  const analyzeStored = async (resumeId) => {
    setAnalyzingId(resumeId);
    setMode('loading');
    setActiveTab('overview');
    setAiResult(null);
    try {
      const { data } = await api.post(`/api/ats/analyze/${resumeId}`, {}, { headers: hdrs() });
      setReport(data.report);
      setMode('result');
      toast.success(data.cached ? 'Loaded cached result' : '✅ Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
      setMode('builder');
    } finally {
      setAnalyzingId(null);
    }
  };

  // ── Analyze uploaded file ─────────────────────────────────────
  const analyzeFile = async () => {
    if (!file) return toast.error('Select a file first');
    setMode('loading');
    setActiveTab('overview');
    setAiResult(null);
    const form = new FormData();
    form.append('resume', file);
    try {
      const { data } = await api.post('/api/ats/analyze/upload', form, {
        headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' },
      });
      setReport(data.report);
      setMode('result');
      toast.success('✅ Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setMode('upload');
    }
  };

  // ── Load history ──────────────────────────────────────────────
  const loadHistory = async () => {
    setHistoryLoading(true);
    setMode('history');
    try {
      const { data } = await api.get('/api/ats/history', { headers: hdrs() });
      setHistory(data.reports || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEnhance = async (suggestion) => {
    setEnhancing(true);
    setAiResult(null);
    try {
      const { data } = await api.post('/api/ats/enhance', {
        reportId: report?._id,
        section:  suggestion.category,
        content:  suggestion.original || suggestion.message,
      }, { headers: hdrs() });
      setAiResult({ suggestion: suggestion.message, enhanced: data.enhanced });
      toast.success('AI enhancement ready!');
    } catch {
      toast.error('AI enhancement failed');
    } finally {
      setEnhancing(false);
    }
  };

  const handleFile = (f) => {
    if (!f) return;
    const ok = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!ok.includes(f.type)) return toast.error('Only PDF, DOCX, or TXT supported');
    if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB');
    setFile(f); setFileName(f.name);
  };

  // ─────────────────────────────────────────────────────────────
  // CHOOSE
  // ─────────────────────────────────────────────────────────────
  if (mode === 'choose') return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 md:p-8'style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-12 pt-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-5 py-2 rounded-full text-sm font-bold mb-6 border border-emerald-100 shadow-sm">
            <ShieldCheckIcon size={15} className="text-emerald-500" />
            ATS Resume Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
            Know Exactly How ATS
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Reads Your Resume
            </span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
            100-point score across 18 criteria. Every point explained. Know exactly what's holding you back.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <button onClick={() => setMode('builder')}
            className="group relative bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100/60 transition-all duration-300 text-left overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
                <FileTextIcon size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Quick-CV Resume</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Analyze any resume you've built in Quick-CV. Instant deep analysis — no upload needed.</p>
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold group-hover:gap-3 transition-all">
                Choose a resume <ChevronRightIcon size={16} />
              </div>
            </div>
          </button>

          <button onClick={() => setMode('upload')}
            className="group relative bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-violet-400 hover:shadow-2xl hover:shadow-violet-100/60 transition-all duration-300 text-left overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-50 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-200 group-hover:scale-105 transition-transform">
                <UploadCloudIcon size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Upload a Resume</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Upload any PDF, DOCX, or TXT resume. Our world-class parser extracts and scores everything.</p>
              <div className="flex items-center gap-2 text-violet-600 text-sm font-bold group-hover:gap-3 transition-all">
                Upload file <ChevronRightIcon size={16} />
              </div>
            </div>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { val: '100', label: 'Point Score' },
            { val: '18',  label: 'Sub-Scores' },
            { val: '500+',label: 'Keywords' },
            { val: '4',   label: 'ATS Systems' },
            { val: 'AI',  label: 'Enhancement' },
            { val: '∞',   label: 'History' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
              <div className="text-lg font-black text-emerald-600">{s.val}</div>
              <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="text-center">
          <button onClick={loadHistory}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:shadow-md transition-all">
            <ClockIcon size={14} /> View Previous Analyses
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // BUILDER — resume list with loading state
  // ─────────────────────────────────────────────────────────────
  if (mode === 'builder') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 md:p-8" style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium mb-8 group">
          <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-1">Choose a Resume</h2>
          <p className="text-slate-400">Select which resume to analyze with our ATS engine</p>
        </div>

        {/* Loading skeleton */}
        {resumesLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-48" />
                    <div className="h-3 bg-slate-100 rounded-lg w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!resumesLoading && resumes.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileTextIcon size={28} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 text-lg mb-1">No resumes found</p>
            <p className="text-slate-400 text-sm mb-6">Build a resume in Quick-CV first, then come back to analyze it.</p>
            <Link to="/app" className="inline-flex items-center gap-2 bg-emerald-500 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Resume list */}
        {!resumesLoading && resumes.length > 0 && (
          <div className="space-y-3">
            {resumes.map(r => (
              <ResumeListItem key={r._id} r={r}
                onSelect={analyzeStored}
                loading={analyzingId === r._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // UPLOAD
  // ─────────────────────────────────────────────────────────────
  if (mode === 'upload') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/20 p-4 md:p-8" style={{ backgroundColor: '#F4F6F3', backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      <div className="max-w-lg mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium mb-8 group">
          <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-1">Upload Resume</h2>
          <p className="text-slate-400">PDF, DOCX, or TXT · Max 5MB</p>
        </div>

        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('ats-file').click()}
          className={`relative rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-violet-400 bg-emerald-50/50 scale-[1.01]'
              : file
              ? 'border-emerald-600 bg-emerald-50/30'
              : 'border-slate-400 hover:border-emerald-800 hover:bg-violet-50/20'
          }`}>
          <input id="ats-file" type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <>
              <div className="w-16 h-16 bg-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileTextIcon size={28} className="text-emerald-600" />
              </div>
              <p className="font-bold text-emerald-700">{fileName}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UploadCloudIcon size={28} className="text-slate-600" />
              </div>
              <p className="font-bold text-slate-600">Drop your resume here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse files</p>
              <p className="text-xs text-slate-500 mt-3">PDF</p>
            </>
          )}
        </div>

        <button onClick={analyzeFile} disabled={!file}
          className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 text-base">
          <ShieldCheckIcon size={18} /> Analyze Resume
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────
  if (mode === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircleIcon size={40} className="text-emerald-500 animate-spin" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Analyzing Your Resume</h3>
        <p className="text-slate-400 mb-8">Running 18 checks across 5 categories…</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Structure', color: 'bg-violet-400' },
            { label: 'Content',   color: 'bg-blue-400' },
            { label: 'Writing',   color: 'bg-emerald-400' },
            { label: 'ATS',       color: 'bg-amber-400' },
            { label: 'Authority', color: 'bg-rose-400' },
          ].map((c, i) => (
            <div key={c.label} className="text-center">
              <div className={`h-1.5 rounded-full ${c.color} animate-pulse mb-1.5`} style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="text-[9px] text-slate-400 font-medium">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // HISTORY
  // ─────────────────────────────────────────────────────────────
  if (mode === 'history') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setMode('choose')} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium mb-8 group">
          <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform"/> Back
        </button>
        <h2 className="text-3xl font-black text-slate-900 mb-6">Analysis History</h2>

        {historyLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-48"/>
                    <div className="h-3 bg-slate-100 rounded-lg w-24"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <ClockIcon size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No analyses yet</p>
            <p className="text-slate-400 text-sm mt-1">Run your first analysis to see results here.</p>
          </div>
        )}

        {!historyLoading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((h, i) => {
              const s   = safeNum(h.scores?.final ?? h.scores?.overall);
              const c   = scoreColor(s);
              const sm  = scoreMeta(s);
              return (
                <button key={i} onClick={async () => {
                  setMode('loading');
                  try {
                    const { data } = await api.get(`/api/ats/report/${h._id}`, { headers: hdrs() });
                    setReport(data); setMode('result'); setActiveTab('overview');
                  } catch { toast.error('Failed to load report'); setMode('history'); }
                }}
                  className="w-full bg-white rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-lg transition-all p-4 text-left group">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${sm.border} ${sm.bg}`}>
                      <span className="text-lg font-black leading-none" style={{ color: c }}>{s}</span>
                      <span className="text-[8px] font-bold text-slate-400">/100</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate text-sm">{h.resumeTitle || 'Uploaded Resume'}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.source==='upload' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {h.source==='upload' ? 'Uploaded' : 'Quick-CV'}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${sm.text}`}>{sm.label}</span>
                    <ChevronRightIcon size={14} className="text-slate-300 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RESULT DASHBOARD
  // ─────────────────────────────────────────────────────────────
  if (!report) return null;

  const s         = report.scores || {};
  const finalScore = safeNum(s.final ?? s.overall);
  const sm        = scoreMeta(finalScore);
  const reasons   = buildScoreReasons(report);
  const bd        = s.breakdown || {};
  const careerLvl = report.meta?.careerLevel || report.parsing?.careerLevel || report.parsedContent?.careerLevel;

  const critFixes = (report.suggestions || []).filter(sg => sg.priority === 'high');
  const highImpact = (report.suggestions || []).filter(sg => sg.priority === 'medium');
  const opts      = (report.suggestions || []).filter(sg => sg.priority === 'low');

  const TABS = [
    { id: 'overview',  label: 'Overview',        icon: <BarChart2Icon size={12}/> },
    { id: 'writing',   label: 'Writing',          icon: <BookOpenIcon  size={12}/> },
    { id: 'keywords',  label: 'Keywords',         icon: <TargetIcon    size={12}/> },
    { id: 'ats',       label: 'ATS Systems',      icon: <ShieldCheckIcon size={12}/> },
    { id: 'parsed',    label: 'Parsed Content',   icon: <EyeIcon       size={12}/> },
    { id: 'fixes',     label: `Fixes`,            icon: <ZapIcon       size={12}/>, badge: critFixes.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <button onClick={() => { setMode('choose'); setReport(null); setAiResult(null); }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium group">
          <ArrowLeftIcon size={13} className="group-hover:-translate-x-0.5 transition-transform" /> New Analysis
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:block truncate max-w-[180px]">{report.resumeTitle || 'Uploaded Resume'}</span>
          {careerLvl && careerLvl !== 'unknown' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {careerLvl === 'student' ? '🎓 Student' : careerLvl === 'entry' ? '🌱 Entry' : careerLvl === 'mid' ? '⚡ Mid-Level' : '🏆 Senior'}
            </span>
          )}
          <button onClick={loadHistory}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors">
            <ClockIcon size={11}/> History
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

        {/* ── Hero Score Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Score card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center">
            <ScoreGauge score={finalScore} />
            <div className={`mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold ${sm.bg} ${sm.text} ${sm.border}`}>
              {sm.emoji} {sm.label}
            </div>
            {(safeNum(s.penalties) > 0 || (report.penalties?.length || 0) > 0) && (
              <div className="mt-3 text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangleIcon size={11}/>
                Raw: {safeNum(s.raw)}/100 · Penalties: –{safeNum(s.penalties || report.penalties?.reduce((a,p) => a + Math.abs(p.deduction||0), 0))}
              </div>
            )}
            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <div className="text-lg font-black text-slate-800">{safeNum(report.wordCount || report.meta?.wordCount)}</div>
                <div className="text-[10px] text-slate-400 font-medium">Words</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <div className="text-lg font-black text-slate-800">
                  {safeNum(report.experience?.entryCount || report.parsing?.experienceEntryCount) > 0
                    ? safeNum(report.experience?.entryCount || report.parsing?.experienceEntryCount)
                    : safeNum(report.projects?.count || report.parsedContent?.projectCount)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {(report.experience?.entryCount || 0) > 0 ? 'Jobs' : 'Projects'}
                </div>
              </div>
            </div>
          </div>

          {/* Radar */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Category Breakdown</div>
            <CategoryRadar scores={s} />
          </div>

          {/* Section bars */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Section Scores</div>
            <div className="space-y-0.5">
              <ScoreBar label="A — Structure" score={safeScore(s.structure)} max={25} color="#8b5cf6"
                reason="Contact info, section completeness, resume length, bullet usage, format safety." />
              <ScoreBar label="B — Content"   score={safeScore(s.content)}   max={30} color="#3b82f6"
                reason="Experience/project depth, education quality, skills count, projects, and quantified achievements." />
              <ScoreBar label="C — Writing"   score={safeScore(s.writing)}   max={20} color="#10b981"
                reason="Action verb strength, quantification density, buzzword-free writing, readability, tense consistency." />
              <ScoreBar label="D — ATS"       score={safeScore(s.ats)}       max={15} color="#f59e0b"
                reason="Keyword coverage (500+ keywords checked), parsability, format compliance." />
              <ScoreBar label="E — Authority" score={safeScore(s.advanced)}  max={10} color="#ef4444"
                reason="Career narrative, LinkedIn/GitHub presence, industry alignment, in-demand skills." />
            </div>
          </div>
        </div>

        {/* Critical alert */}
        {critFixes.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangleIcon size={16} className="text-red-500" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-red-700 text-sm">{critFixes.length} Critical Issue{critFixes.length > 1 ? 's' : ''} Found</div>
              <div className="text-red-500 text-xs mt-0.5">{critFixes[0]?.message}</div>
            </div>
            <button onClick={() => setActiveTab('fixes')}
              className="shrink-0 text-xs bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors">
              Fix Now →
            </button>
          </div>
        )}

        {/* AI result */}
        {aiResult && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                <SparklesIcon size={15} className="text-emerald-500" /> AI Enhancement Ready
              </div>
              <button onClick={() => setAiResult(null)} className="text-emerald-400 hover:text-emerald-600 text-sm">✕</button>
            </div>
            <div className="text-xs text-emerald-600 mb-2 font-medium italic">"{aiResult.suggestion}"</div>
            <div className="bg-white rounded-xl p-3 text-sm text-slate-700 border border-emerald-100 whitespace-pre-wrap leading-relaxed">
              {aiResult.enhanced}
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-4 text-xs font-bold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? 'text-emerald-600 bg-emerald-50/50'
                    : 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'
                }`}>
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                {tab.icon} {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[16px] text-center">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">

            {/* ── OVERVIEW ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black text-slate-800">Detailed Sub-Scores</h3>
                  <span className="text-[10px] text-slate-800 flex items-center gap-1"><InfoIcon size={10}/> Click any score for full explanation</span>
                </div>

                {/* Sub-score groups with transparency */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <SubScoreGroup title="A — Structure (max 25)" colorClass="bg-violet-400"
                    items={{ A1:['Contact Info',5], A2:['Section Completeness',7], A3:['Length',5], A4:['Bullet Usage',5], A5:['Format Safety',3] }}
                    breakdown={bd.A} reasons={reasons} color="#8b5cf6" />
                  <SubScoreGroup title="B — Content (max 30)" colorClass="bg-blue-400"
                    items={{ B1:['Experience',careerLvl==='student'?6:10], B2:['Education',5], B3:['Skills Depth',7], B4:['Projects',4], B5:['Achievements',4] }}
                    breakdown={bd.B} reasons={reasons} color="#3b82f6" />
                  <SubScoreGroup title="C — Writing Quality (max 20)" colorClass="bg-emerald-400"
                    items={{ C1:['Action Verbs',5], C2:['Quantification',5], C3:['No Buzzwords',5], C4:['Readability',3], C5:['Tense Consistent',2] }}
                    breakdown={bd.C} reasons={reasons} color="#10b981" />
                  <div className="space-y-3">
                    <SubScoreGroup title="D — ATS Compatibility (max 15)" colorClass="bg-amber-400"
                      items={{ D1:['Keyword Coverage',8], D2:['Parsability',4], D3:['Format Compliance',3] }}
                      breakdown={bd.D} reasons={reasons} color="#f59e0b" />
                    <SubScoreGroup title="E — Impact & Authority (max 10)" colorClass="bg-rose-400"
                      items={{ E1:['Career Narrative',3], E2:['Personal Brand',3], E3:['Industry Align',2], E4:['Skill Recency',2] }}
                      breakdown={bd.E} reasons={reasons} color="#f43f5e" />
                  </div>
                </div>

                {/* Penalties */}
                {(report.penalties?.length || 0) > 0 && (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-100 mt-2">
                    <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <AlertTriangleIcon size={12}/> Penalty Deductions
                    </h4>
                    <div className="space-y-2">
                      {report.penalties.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className="text-red-500 font-black shrink-0 w-6">{p.deduction}</span>
                          <div>
                            <span className="font-bold text-red-700">{p.label}</span>
                            {p.detail && <span className="text-red-400 ml-1 italic">— {p.detail}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { l: 'Email',    v: report.contact?.hasEmail    || report.parsing?.hasEmail },
                      { l: 'Phone',    v: report.contact?.hasPhone    || report.parsing?.hasPhone },
                      { l: 'Location', v: report.contact?.hasLocation || report.parsing?.hasLocation },
                      { l: 'LinkedIn', v: report.contact?.hasLinkedIn || report.parsing?.hasLinkedIn || report.parsing?.hasLinkedInWord },
                    ].map(c => (
                      <div key={c.l} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border ${
                        c.v ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                      }`}>
                        {c.v ? <CheckCircle2Icon size={12}/> : <XCircleIcon size={12}/>} {c.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── WRITING ─────────────────────────────────────────── */}
            {activeTab === 'writing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-sm">Action Verbs</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${safeNum(report.writing?.actionVerbs?.strongRatio) >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {safeNum(report.writing?.actionVerbs?.strongRatio)}% strong
                    </span>
                  </div>
                  {(report.writing?.actionVerbs?.strong?.length || 0) > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">✅ Strong verbs</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.actionVerbs.strong.slice(0,12).map((v,i) => (
                          <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg capitalize font-medium">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(report.writing?.actionVerbs?.weakSamples?.length || 0) > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">⚠️ Weak examples</div>
                      {report.writing.actionVerbs.weakSamples.slice(0,3).map((w,i) => (
                        <div key={i} className="text-xs text-slate-500 bg-red-50 rounded-xl px-3 py-2 mb-1.5 italic border border-red-100">
                          {w.verb ? `Starts with "${w.verb}"` : 'Missing verb'}: {w.bullet?.substring(0,80)}
                        </div>
                      ))}
                    </div>
                  )}
                  {!(report.writing?.actionVerbs?.strong?.length || 0) && !(report.writing?.actionVerbs?.weakSamples?.length || 0) && (
                    <p className="text-xs text-slate-400 italic">No bullets detected to analyze.</p>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-4">Quantifiable Achievements</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl font-black text-emerald-600 tabular-nums">{safeNum(report.writing?.quantification?.count)}</div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">Bullets with numbers</div>
                      <div className="text-xs text-slate-400">{safeNum(report.writing?.quantification?.ratio)}% of all bullets</div>
                    </div>
                  </div>
                  {(report.writing?.quantification?.examples?.length || 0) > 0 && (
                    <>
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">✅ Examples</div>
                      {report.writing.quantification.examples.slice(0,3).map((e,i) => (
                        <div key={i} className="text-xs text-slate-600 bg-emerald-50 rounded-xl px-3 py-2 mb-1.5 border border-emerald-100">{e.substring(0,100)}</div>
                      ))}
                    </>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-3">Readability</h3>
                  {report.writing?.readability ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Flesch-Kincaid Grade', val: report.writing.readability.fleschKincaid, ideal: '8–12', good: v => v >= 8 && v <= 12 },
                        { label: 'Gunning Fog Index',    val: report.writing.readability.gunningFog,    ideal: '8–14', good: v => v >= 8 && v <= 14 },
                      ].filter(r => r.val !== undefined).map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{r.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">ideal: {r.ideal}</span>
                            <span className={`text-sm font-black tabular-nums ${r.good(safeNum(r.val)) ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {safeNum(r.val).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-400 leading-relaxed">
                        Grade 8–12 is ideal for resumes. Below 8 = too simple. Above 14 = too academic.
                      </div>
                    </div>
                  ) : <p className="text-xs text-slate-400 italic">Insufficient text for analysis.</p>}
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-3">Content Clarity</h3>
                  {(report.writing?.fluff?.found?.length || 0) > 0 ? (
                    <div className="mb-4">
                      <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">🚫 Buzzwords (remove these)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.fluff.found.map((f,i) => (
                          <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg font-medium">{f}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-500 mt-2">Each buzzword deducts 1.5 pts from C3 score.</p>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 flex items-center gap-1.5 mb-3 font-semibold"><CheckCircle2Icon size={12}/> No buzzwords — C3 = 5/5</div>
                  )}
                  {(report.writing?.repetition?.words?.length || 0) > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">🔄 Overused words</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.writing.repetition.words.map((r,i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{r.word} ({r.count}×)</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── KEYWORDS ────────────────────────────────────────── */}
            {activeTab === 'keywords' && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">🎯</div>
                  <div className="flex-1">
                    <div className="font-black text-emerald-800 capitalize text-base">
                      {(report.keywords?.domain?.domain || 'General').replace(/_/g,' ')}
                    </div>
                    <div className="text-xs text-emerald-600">{safeNum(report.keywords?.domain?.confidence)}% domain confidence · D1 score based on {safeNum(report.keywords?.totalFound)} keywords found</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black text-emerald-600">{safeNum(report.keywords?.density)}%</div>
                    <div className="text-xs text-emerald-500 font-medium">coverage</div>
                  </div>
                </div>
                <KeywordCloud found={report.keywords?.found || []} missing={report.keywords?.missing || []} />
                {(report.keywords?.tfidf?.length || 0) > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Top Keywords by TF-IDF Importance</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.keywords.tfidf.slice(0,20).map((k,i) => {
                        const sz = Math.max(10, Math.min(15, Math.round(safeNum(k.tfidf) * 3 + 10)));
                        return (
                          <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-medium" style={{ fontSize: sz }}>
                            {k.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ATS SYSTEMS ─────────────────────────────────────── */}
            {activeTab === 'ats' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-4">ATS System Compatibility</h3>
                  <ATSMeter sim={report.atsCompatibility?.simulation} />
                  <p className="text-[10px] text-slate-400 mt-3 text-center">Simulated using each ATS platform's known keyword weighting and parsing behavior.</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-4">Format Safety Check</h3>
                  {(report.atsCompatibility?.issues?.length || 0) === 0 && (report.atsCompatibility?.warnings?.length || 0) === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-4 border border-emerald-100 font-semibold text-sm">
                      <CheckCircle2Icon size={16}/> No format issues — great ATS compatibility!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(report.atsCompatibility?.issues||[]).map((issue,i) => (
                        <div key={i} className="flex items-start gap-2 bg-red-50 rounded-xl p-3 text-sm text-red-700 border border-red-100">
                          <XCircleIcon size={14} className="shrink-0 mt-0.5"/> {issue}
                        </div>
                      ))}
                      {(report.atsCompatibility?.warnings||[]).map((w,i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 text-sm text-amber-700 border border-amber-100">
                          <AlertTriangleIcon size={14} className="shrink-0 mt-0.5"/> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-3">Professional Signals</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'LinkedIn Profile',  has: report.advanced?.hasLinkedIn || report.contact?.hasLinkedIn, critical: true,  note: 'Missing LinkedIn = −2 pt penalty on raw score' },
                      { label: 'GitHub / Portfolio', has: report.advanced?.hasGitHub,                                 critical: false, note: 'Boosts E2 score and Lever ATS simulation' },
                      { label: 'Consistent Tense',  has: report.writing?.tenseConsistency?.consistent,               critical: false, note: 'Inconsistency deducts C5 score (2 pts)' },
                      { label: 'In-Demand Skills',  has: safeNum(report.advanced?.hotSkillMatches) >= 2,              critical: false, note: `${safeNum(report.advanced?.hotSkillMatches)} hot skills (AI, cloud, etc.) detected` },
                    ].map(c => (
                      <div key={c.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${
                        c.has ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        c.critical ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <span className="shrink-0">
                          {c.has ? <CheckCircle2Icon size={15}/> : c.critical ? <AlertTriangleIcon size={15}/> : <XCircleIcon size={15}/>}
                        </span>
                        <span className="flex-1">{c.label}</span>
                        <span className={`text-[10px] font-normal ${c.has ? 'text-emerald-500' : c.critical ? 'text-red-400' : 'text-amber-500'}`}>
                          {c.has ? '✓ Present' : c.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PARSED CONTENT ──────────────────────────────────── */}
            {activeTab === 'parsed' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 flex items-start gap-2">
                  <InfoIcon size={14} className="shrink-0 mt-0.5 text-amber-500"/>
                  <div><strong>Parsing Verification</strong> — This confirms exactly what our engine extracted. Empty sections mean the parser couldn't find that content. If something is wrong, your PDF may use image rendering or unusual layout.</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Words',  val: report.meta?.wordCount || report.wordCount || 0, icon: FileTextIcon,     note: 'Full resume' },
                    { label: 'Jobs Parsed',  val: report.experience?.entryCount || report.parsing?.experienceEntryCount || 0, icon: BriefcaseIcon, note: 'Work entries' },
                    { label: 'Education',    val: report.education?.entryCount  || report.parsedContent?.educationCount || 0, icon: GraduationCapIcon, note: 'Degrees' },
                    { label: 'Projects',     val: report.projects?.count        || report.parsedContent?.projectCount   || 0, icon: CodeIcon, note: 'Projects' },
                  ].map(({ label, val, icon: Icon, note }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                      <Icon size={18} className="text-emerald-500 mx-auto mb-2" />
                      <div className="text-3xl font-black text-slate-800 tabular-nums">{safeNum(val)}</div>
                      <div className="text-xs font-bold text-slate-500">{label}</div>
                      <div className="text-[9px] text-slate-400">{note}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-700 mb-3">Sections Detected</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const found = [...(report.parsing?.sectionsFound||[]), ...(report.parsedContent?.sectionsFound||[])];
                      return [
                        { key: 'header',       label: 'Header/Contact' },
                        { key: 'summary',      label: 'Summary' },
                        { key: 'experience',   label: 'Experience' },
                        { key: 'education',    label: 'Education' },
                        { key: 'skills',       label: 'Skills' },
                        { key: 'projects',     label: 'Projects' },
                        { key: 'achievements', label: 'Achievements' },
                      ].map(({ key, label }) => {
                        const isFound = found.includes(key)
                          || (key==='experience'   && (report.experience?.entryCount||0)>0)
                          || (key==='education'    && (report.education?.entryCount||0)>0)
                          || (key==='skills'       && ((report.skills?.totalCount||0)>0 || (report.parsedContent?.skills?.length||0)>0))
                          || (key==='projects'     && ((report.projects?.count||0)>0||(report.parsedContent?.projectCount||0)>0))
                          || (key==='summary'      && report.summary?.hasSummary)
                          || (key==='header'       && (report.contact?.hasEmail||report.contact?.hasName));
                        return (
                          <span key={key} className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${
                            isFound ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-400 border-red-100'
                          }`}>
                            {isFound ? '✓' : '✗'} {label}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>

                {(report.parsedContent?.skills?.length || report.skills?.topSkills?.length || 0) > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                      <ZapIcon size={14} className="text-emerald-500"/>
                      Parsed Skills ({(report.parsedContent?.skills || report.skills?.topSkills || []).length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.parsedContent?.skills || report.skills?.topSkills || []).map((sk,i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {report.parsedContent?.rawText && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-slate-700">Full Extracted Text</h3>
                      <span className="text-[10px] text-slate-400">{(report.parsedContent.rawText.match(/\b\w+\b/g)||[]).length} words</span>
                    </div>
                    <pre className="text-xs text-slate-500 bg-slate-50 rounded-xl p-4 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono border border-slate-200 leading-relaxed">
                      {report.parsedContent.rawText.substring(0,2500)}{report.parsedContent.rawText.length>2500?'\n\n[… truncated]':''}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ── AI FIXES ────────────────────────────────────────── */}
            {activeTab === 'fixes' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: critFixes.length,  label: 'Critical',     bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100' },
                    { count: highImpact.length, label: 'High Impact',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100' },
                    { count: opts.length,       label: 'Optimizations',bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
                  ].map(c => (
                    <div key={c.label} className={`rounded-2xl p-4 text-center border ${c.bg} ${c.border}`}>
                      <div className={`text-3xl font-black ${c.text}`}>{c.count}</div>
                      <div className={`text-[10px] font-bold ${c.text} mt-0.5`}>{c.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-700">
                  <SparklesIcon size={14} className="shrink-0 mt-0.5 text-emerald-500"/>
                  <div><strong>AI Fix button</strong> rewrites weak content using only information already in your resume — it never fabricates experience or skills.</div>
                </div>

                {critFixes.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangleIcon size={11}/> Critical — Fix Immediately</div>
                    <div className="space-y-2">{critFixes.map((sg,i) => <SuggestionCard key={i} s={sg} onEnhance={sg.original ? handleEnhance : null} enhancing={enhancing}/>)}</div>
                  </div>
                )}
                {highImpact.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUpIcon size={11}/> High Impact — Do This Next</div>
                    <div className="space-y-2">{highImpact.map((sg,i) => <SuggestionCard key={i} s={sg} onEnhance={sg.original ? handleEnhance : null} enhancing={enhancing}/>)}</div>
                  </div>
                )}
                {opts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><ZapIcon size={11}/> Optimizations</div>
                    <div className="space-y-2">{opts.map((sg,i) => <SuggestionCard key={i} s={sg} onEnhance={sg.original ? handleEnhance : null} enhancing={enhancing}/>)}</div>
                  </div>
                )}
                {(report.suggestions||[]).length === 0 && (
                  <div className="text-center py-12">
                    <AwardIcon size={48} className="text-emerald-400 mx-auto mb-3"/>
                    <p className="font-black text-emerald-600 text-lg">Excellent resume!</p>
                    <p className="text-slate-400 text-sm mt-1">No critical issues found.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;