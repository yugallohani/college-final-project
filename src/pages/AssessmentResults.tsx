import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend,
} from "recharts";
import { Download, ArrowLeft, Brain, Activity, Mic, Eye } from "lucide-react";
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportEntry {
  sessionId: string;
  assessmentType: string;
  assessmentTitle: string;
  score: number;
  severity: string;
  totalQuestions: number;
  completedAt: string;
  answers: { questionId: number; score: number }[];
  emotionSnapshot?: { label: string; tone: string } | null;
  sentimentSnapshot?: { label: string; score: number } | null;
  voiceSnapshot?: { pitch: string; speed: string; energy: string } | null;
  behaviorSnapshot?: { posture: string; head: string; engagement: string; state: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  Minimal: "#4ade80",
  Mild: "#facc15",
  Moderate: "#fb923c",
  "Moderately Severe": "#f87171",
  Severe: "#ef4444",
};

const ordinalLabel = (val: string, low: string, mid: string, high: string): number =>
  val === low ? 1 : val === mid ? 2 : 3;

function buildVoiceChartData(v: ReportEntry["voiceSnapshot"]) {
  if (!v) return [];
  return [
    { name: "Energy", value: ordinalLabel(v.energy, "Low", "Medium", "High") },
    { name: "Pitch",  value: ordinalLabel(v.pitch,  "Low", "Normal", "High") },
    { name: "Speed",  value: ordinalLabel(v.speed,  "Slow", "Normal", "Fast") },
  ];
}

function buildBehaviorChartData(b: ReportEntry["behaviorSnapshot"]) {
  if (!b) return [];
  return [
    { subject: "Posture",    value: b.posture    === "Stable"   ? 3 : 1 },
    { subject: "Head",       value: b.head       === "Centered" ? 3 : 1 },
    { subject: "Engagement", value: b.engagement === "High" ? 3 : b.engagement === "Moderate" ? 2 : 1 },
    { subject: "State",      value: b.state === "Focused" || b.state === "Engaged" ? 3 : 2 },
  ];
}

function buildScoreTrend(answers: ReportEntry["answers"]) {
  return answers.map((a, i) => ({ name: `Q${i + 1}`, score: a.score }));
}

function buildEmotionPie(entry: ReportEntry) {
  // Derive emotion distribution from per-answer scores
  const counts = { Positive: 0, Neutral: 0, Thoughtful: 0, Low: 0 };
  entry.answers.forEach(a => {
    if (a.score === 0) counts.Positive++;
    else if (a.score === 1) counts.Neutral++;
    else if (a.score === 2) counts.Thoughtful++;
    else counts.Low++;
  });
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

const PIE_COLORS = ["#4ade80", "#a78bfa", "#facc15", "#f87171"];

// ─── Download helper ──────────────────────────────────────────────────────────
function downloadJSON(entry: ReportEntry) {
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuroscan-report-${entry.sessionId.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadTxt(entry: ReportEntry, summary: string) {
  const lines = [
    "NeuroScan AI — Assessment Report",
    "=================================",
    `Date:        ${new Date(entry.completedAt).toLocaleString()}`,
    `Assessment:  ${entry.assessmentTitle}`,
    `Score:       ${entry.score} / ${entry.totalQuestions * 3}`,
    `Severity:    ${entry.severity}`,
    "",
    "AI Summary",
    "----------",
    summary,
    "",
    "Voice Analysis",
    "--------------",
    entry.voiceSnapshot
      ? `Energy: ${entry.voiceSnapshot.energy} | Pitch: ${entry.voiceSnapshot.pitch} | Speed: ${entry.voiceSnapshot.speed}`
      : "Not available",
    "",
    "Behavioral Analysis",
    "-------------------",
    entry.behaviorSnapshot
      ? `Posture: ${entry.behaviorSnapshot.posture} | Head: ${entry.behaviorSnapshot.head} | Engagement: ${entry.behaviorSnapshot.engagement} | State: ${entry.behaviorSnapshot.state}`
      : "Not available",
    "",
    "Disclaimer: This is not a clinical diagnosis.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuroscan-report-${entry.sessionId.slice(0, 8)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AssessmentResults = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<ReportEntry | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage first (instant)
    try {
      const stored: ReportEntry[] = JSON.parse(localStorage.getItem("neuroscan_reports") || "[]");
      const found = stored.find(r => r.sessionId === sessionId);
      if (found) {
        setEntry(found);
        setIsLoading(false);
        generateAISummary(found);
        return;
      }
    } catch (_) {}

    // Fallback: try backend
    fetch(`${API}/api/assessment/results/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        // Shape backend data into ReportEntry
        const fallback: ReportEntry = {
          sessionId: sessionId!,
          assessmentType: data.assessmentType || "phq9",
          assessmentTitle: data.assessmentType || "Assessment",
          score: data.score || 0,
          severity: data.classification || "Unknown",
          totalQuestions: 9,
          completedAt: new Date().toISOString(),
          answers: [],
        };
        setEntry(fallback);
        generateAISummary(fallback);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const generateAISummary = async (r: ReportEntry) => {
    setSummaryLoading(true);
    try {
      const prompt = `You are a clinical psychologist writing a brief assessment summary.

Assessment: ${r.assessmentTitle}
Score: ${r.score} / ${r.totalQuestions * 3}
Severity: ${r.severity}
Emotion: ${r.emotionSnapshot?.label ?? "Not recorded"} (${r.emotionSnapshot?.tone ?? ""})
Sentiment: ${r.sentimentSnapshot?.label ?? "Not recorded"}
Voice: ${r.voiceSnapshot ? `Energy ${r.voiceSnapshot.energy}, Pitch ${r.voiceSnapshot.pitch}, Speed ${r.voiceSnapshot.speed}` : "Not recorded"}
Behavior: ${r.behaviorSnapshot ? `Posture ${r.behaviorSnapshot.posture}, Engagement ${r.behaviorSnapshot.engagement}, State ${r.behaviorSnapshot.state}` : "Not recorded"}

Write a 3-4 sentence professional, empathetic psychological summary. Do NOT diagnose. Be warm and constructive.`;

      const res = await fetch(`${API}/api/ai-interview/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || buildFallbackSummary(r));
      } else {
        setSummary(buildFallbackSummary(r));
      }
    } catch (_) {
      setSummary(buildFallbackSummary(r));
    }
    setSummaryLoading(false);
  };

  const buildFallbackSummary = (r: ReportEntry): string => {
    const sevMap: Record<string, string> = {
      Minimal: "Your responses suggest minimal distress, indicating a generally stable emotional state.",
      Mild: "Your responses indicate mild symptoms that are worth monitoring over time.",
      Moderate: "Your responses suggest moderate levels of distress. Speaking with a professional could be beneficial.",
      "Moderately Severe": "Your responses indicate moderately severe symptoms. Professional support is recommended.",
      Severe: "Your responses suggest significant distress. Please consider reaching out to a mental health professional.",
    };
    const base = sevMap[r.severity] || "Your assessment has been completed.";
    const voice = r.voiceSnapshot
      ? ` Your vocal patterns showed ${r.voiceSnapshot.energy.toLowerCase()} energy and ${r.voiceSnapshot.speed.toLowerCase()} speaking pace.`
      : "";
    const behavior = r.behaviorSnapshot
      ? ` Behavioral indicators suggest ${r.behaviorSnapshot.engagement.toLowerCase()} engagement throughout the session.`
      : "";
    return base + voice + behavior + " Remember, this screening is a starting point — not a diagnosis.";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Report not found.</p>
          <button onClick={() => navigate("/dashboard")} className="text-purple-400 hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const severityColor = SEVERITY_COLOR[entry.severity] || "#a78bfa";
  const maxScore = entry.totalQuestions * 3;
  const pct = Math.round((entry.score / maxScore) * 100);
  const voiceData = buildVoiceChartData(entry.voiceSnapshot);
  const behaviorData = buildBehaviorChartData(entry.behaviorSnapshot);
  const scoreTrend = buildScoreTrend(entry.answers);
  const emotionPie = buildEmotionPie(entry);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => downloadTxt(entry, summary)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" /> Download TXT
            </button>
            <button
              onClick={() => downloadJSON(entry)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm text-purple-300 hover:bg-purple-500/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download JSON
            </button>
          </div>
        </motion.div>

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center"
        >
          <p className="text-gray-400 text-sm mb-1">{entry.assessmentTitle}</p>
          <p className="text-gray-500 text-xs mb-6">{new Date(entry.completedAt).toLocaleString()}</p>
          <div className="flex items-center justify-center gap-12">
            <div>
              <p className="text-6xl font-bold text-white">{entry.score}</p>
              <p className="text-gray-400 text-sm mt-1">out of {maxScore}</p>
            </div>
            <div className="w-px h-16 bg-white/10" />
            <div>
              <p className="text-3xl font-bold" style={{ color: severityColor }}>{entry.severity}</p>
              <p className="text-gray-400 text-sm mt-1">Severity Level</p>
            </div>
            <div className="w-px h-16 bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-purple-300">{pct}%</p>
              <p className="text-gray-400 text-sm mt-1">Score Percentile</p>
            </div>
          </div>
        </motion.div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Emotion distribution pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-purple-400" />
              <p className="text-sm font-semibold text-gray-300">Response Distribution</p>
            </div>
            {emotionPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={emotionPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {emotionPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1b23", border: "1px solid #ffffff20", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-sm text-center py-16">No answer data</p>
            )}
          </motion.div>

          {/* Score trend line */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-gray-300">Score per Question</p>
            </div>
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1b23", border: "1px solid #ffffff20", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-sm text-center py-16">No trend data</p>
            )}
          </motion.div>

          {/* Voice analysis bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-4 h-4 text-green-400" />
              <p className="text-sm font-semibold text-gray-300">Voice Analysis</p>
            </div>
            {voiceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={voiceData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ["", "Low", "Mid", "High"][v]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1b23", border: "1px solid #ffffff20", borderRadius: 8 }}
                    formatter={(v: number) => [["", "Low", "Medium", "High"][v], ""]}
                  />
                  <Bar dataKey="value" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-sm text-center py-16">Voice data not recorded</p>
            )}
          </motion.div>

          {/* Behavioral radar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-semibold text-gray-300">Behavioral Analysis</p>
            </div>
            {behaviorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={behaviorData}>
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#fb923c" fill="#fb923c" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ background: "#1a1b23", border: "1px solid #ffffff20", borderRadius: 8 }} formatter={(v: number) => [["", "Low", "Moderate", "High"][v], ""]} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-sm text-center py-16">Behavioral data not recorded</p>
            )}
          </motion.div>
        </div>

        {/* AI Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-purple-300">AI Psychological Summary</p>
            <span className="ml-auto text-xs text-purple-400/60">Generated by Gemini</span>
          </div>
          {summaryLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Generating summary...</span>
            </div>
          ) : (
            <p className="text-gray-200 leading-relaxed">{summary}</p>
          )}
        </motion.div>

        {/* Multimodal snapshot */}
        {(entry.emotionSnapshot || entry.voiceSnapshot || entry.behaviorSnapshot) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {entry.emotionSnapshot && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs space-y-1">
                <p className="text-gray-400 font-semibold mb-2">Emotional State</p>
                <div className="flex justify-between"><span className="text-gray-500">Emotion:</span><span className="text-blue-300">{entry.emotionSnapshot.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tone:</span><span className="text-purple-300">{entry.emotionSnapshot.tone}</span></div>
                {entry.sentimentSnapshot && <div className="flex justify-between"><span className="text-gray-500">Sentiment:</span><span className="text-green-300">{entry.sentimentSnapshot.label}</span></div>}
              </div>
            )}
            {entry.voiceSnapshot && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs space-y-1">
                <p className="text-gray-400 font-semibold mb-2">Voice Signals</p>
                <div className="flex justify-between"><span className="text-gray-500">Energy:</span><span className="text-green-300">{entry.voiceSnapshot.energy}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pitch:</span><span className="text-yellow-300">{entry.voiceSnapshot.pitch}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Speed:</span><span className="text-orange-300">{entry.voiceSnapshot.speed}</span></div>
              </div>
            )}
            {entry.behaviorSnapshot && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs space-y-1">
                <p className="text-gray-400 font-semibold mb-2">Behavioral Signals</p>
                <div className="flex justify-between"><span className="text-gray-500">Posture:</span><span className="text-purple-300">{entry.behaviorSnapshot.posture}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Engagement:</span><span className="text-blue-300">{entry.behaviorSnapshot.engagement}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">State:</span><span className="text-pink-300">{entry.behaviorSnapshot.state}</span></div>
              </div>
            )}
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300">
          This screening is not a clinical diagnosis. If you're experiencing significant distress, please consult a mental health professional.
        </div>

      </div>
    </div>
  );
};

export default AssessmentResults;
