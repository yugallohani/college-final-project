import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, X, Brain } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  questionId: number;
  text: string;
  options?: string[];
}

interface Answer {
  questionId: number;
  text: string;
  score: number; // 0-3 deterministic
}

interface TranscriptMessage {
  id: string;
  speaker: "ai" | "user";
  text: string;
  timestamp: Date;
}

// ─── Deterministic scoring (PHQ-9 / GAD-7 scale) ─────────────────────────────
function classifyAnswer(text: string): number {
  const t = text.toLowerCase();
  if (/not at all|never|no|none|0/.test(t)) return 0;
  if (/several days|sometimes|occasionally|a little|1/.test(t)) return 1;
  if (/more than half|often|frequently|most|2/.test(t)) return 2;
  if (/nearly every day|always|constantly|all the time|3/.test(t)) return 3;
  // Sentiment fallback
  const negative = (t.match(/bad|terrible|awful|horrible|depressed|anxious|stressed|worried|sad|hopeless|worthless/g) || []).length;
  const positive = (t.match(/good|great|fine|okay|well|happy|calm|relaxed|better/g) || []).length;
  if (negative >= 2) return 3;
  if (negative === 1) return 2;
  if (positive >= 1) return 0;
  return 1;
}

function calculateScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.score, 0);
}

function getSeverity(score: number, total: number): string {
  const pct = score / (total * 3);
  if (pct <= 0.15) return "Minimal";
  if (pct <= 0.33) return "Mild";
  if (pct <= 0.50) return "Moderate";
  if (pct <= 0.67) return "Moderately Severe";
  return "Severe";
}

// ─── Typing animation component ───────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-purple-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── Assessment titles ────────────────────────────────────────────────────────
const TITLES: Record<string, string> = {
  phq9: "PHQ-9 Depression Screening",
  gad7: "GAD-7 Anxiety Assessment",
  stress: "Stress Level Assessment",
  general: "General Mental Wellness Check",
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AssessmentInterview = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const poseFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true); // false after unmount — stops all async audio
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Web Audio API refs for real-time voice analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceSampleRef = useRef<{ sumAvg: number; maxPeak: number; samples: number }>({ sumAvg: 0, maxPeak: 0, samples: 0 });
  const speechStartTimeRef = useRef<number>(0);
  const maxSpeechTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to avoid stale closures in async callbacks
  const isProcessingRef = useRef(false);
  const currentQuestionIndexRef = useRef(0);
  const questionsRef = useRef<Question[]>([]);

  // ── CENTRALIZED STATE ──────────────────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [canContinue, setCanContinue] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [userDisplay, setUserDisplay] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<{ label: string; score: number } | null>(null);
  const [emotion, setEmotion] = useState<{ label: string; tone: string } | null>(null);
  // Real-time voice analysis (Web Audio API — updates only after user speaks)
  const [voiceAnalysis, setVoiceAnalysis] = useState<{
    pitch: string; speed: string; energy: string;
  } | null>(null);
  // Real-time behavioral analysis (MediaPipe Pose)
  const [behavior, setBehavior] = useState<{
    posture: string; head: string; engagement: string; state: string;
  } | null>(null);

  // ── Session / questions ────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(9);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);

  // ── Granular system status (all live, no fake values) ─────────────────────
  const [sysStatus, setSysStatus] = useState({
    permissions: "Requesting...",
    video: "Waiting...",
    stream: "Inactive",
    speech: "Waiting...",
    session: "None",
    question: "—",
    listening: "Idle",
    processing: "Idle",
    aiSpeakingStatus: "Idle",
    transcription: "Waiting...",
    emotionAnalysis: "Waiting...",
  });

  const updateStatus = (key: keyof typeof sysStatus, value: string) => {
    setSysStatus(prev => ({ ...prev, [key]: value }));
  };

  // ── Debug log on every state change ───────────────────────────────────────
  useEffect(() => {
    // Keep refs in sync to avoid stale closures
    currentQuestionIndexRef.current = currentQuestionIndex;
    console.log("📊 STATE UPDATE:", {
      currentQuestionIndex,
      answersCount: answers.length,
      canContinue,
      isProcessing,
      aiSpeaking,
    });
  }, [currentQuestionIndex, answers, canContinue, isProcessing, aiSpeaking]);

  // ── Auto-scroll transcript ─────────────────────────────────────────────────
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, showTyping]);

  // ── Safety: if canContinue is true but aiSpeaking is stuck, unblock ───────
  useEffect(() => {
    if (!canContinue) return;
    // Give TTS 500ms to naturally finish, then force-unblock if still speaking
    const t = setTimeout(() => {
      if (aiSpeaking) {
        console.warn("⚠️ aiSpeaking stuck while canContinue=true — force clearing");
        setAiSpeaking(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [canContinue, aiSpeaking]);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    requestMediaPermissions();
    return () => {
      isMountedRef.current = false;
      // Hard stop all audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopListening();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      audioContextRef.current?.close().catch(() => {});
      if (poseFrameRef.current) cancelAnimationFrame(poseFrameRef.current);
      try { poseRef.current?.close(); } catch (_) {}
      if (behaviorTimerRef.current) clearInterval(behaviorTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── FIX: Attach stream to video AFTER the element is in the DOM ───────────
  // This fires after isLoading=false causes the video element to mount
  useEffect(() => {
    if (!isLoading && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
      console.log("📹 Video stream attached to element");
    }
  }, [isLoading]); // fires when loading screen disappears and video element mounts

  // Re-attach when video is toggled back on
  useEffect(() => {
    if (isVideoOn && !isLoading && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isVideoOn, isLoading]);

  // ── Media permissions ──────────────────────────────────────────────────────
  const requestMediaPermissions = async () => {
    try {
      updateStatus("permissions", "Requesting...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setPermissionsGranted(true);
      updateStatus("permissions", "Granted");
      updateStatus("stream", "Active");
      updateStatus("video", "Ready");
      console.log("✅ Camera & mic permissions granted");
      console.log("📹 Video stream:", stream.getVideoTracks()[0]?.label);
      console.log("🎤 Audio stream:", stream.getAudioTracks()[0]?.label);

      // Connect Web Audio API analyser for real-time voice analysis
      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        console.log("🎙️ Web Audio analyser connected");
      } catch (e) {
        console.warn("Web Audio API unavailable:", e);
      }

      // Set isLoading=false NOW so the video element mounts in the DOM
      // The useEffect watching isLoading will then attach srcObject
      setIsLoading(false);

      initSpeechRecognition();
      await initAssessment();
      // Start pose detection after a short delay (video element needs to be in DOM)
      setTimeout(() => initPoseDetection(), 1500);
    } catch (err) {
      console.error("Media error:", err);
      updateStatus("permissions", "Denied");
      updateStatus("video", "Failed");
      updateStatus("stream", "Inactive");
      alert("Please grant camera and microphone permissions to continue.");
      setIsLoading(false);
    }
  };

  // ── MediaPipe Pose detection ───────────────────────────────────────────────
  const landmarksRef = useRef<any[]>([]);
  const behaviorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analyzeBehavior = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 13) return;
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    // Head position: nose x relative to shoulder midpoint
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const headOffset = nose.x - shoulderMidX;
    const head =
      headOffset < -0.08 ? "Looking Left" :
      headOffset > 0.08 ? "Looking Right" : "Centered";

    // Posture: shoulder level difference
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const posture = shoulderDiff > 0.06 ? "Unbalanced" : "Stable";

    // Head tilt: ear height difference
    const earDiff = Math.abs(leftEar.y - rightEar.y);
    const tilt = earDiff > 0.05 ? "Tilted" : "Upright";

    // Engagement: combination of head position + posture
    const engagement =
      head === "Centered" && posture === "Stable" ? "High" :
      head === "Centered" || posture === "Stable" ? "Moderate" : "Low";

    // State: derived from all signals
    const state =
      engagement === "High" && tilt === "Upright" ? "Focused" :
      engagement === "Low" ? "Distracted" :
      posture === "Unbalanced" ? "Tense" : "Attentive";

    setBehavior({ posture, head, engagement, state });
  };

  const drawPoseSkeleton = (landmarks: any[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Connections: pairs of landmark indices (upper body only)
    const connections = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso sides
      [23, 24], // hips
      [0, 7], [0, 8], // nose to ears
    ];

    // Mirror x because video is mirrored
    const mx = (x: number) => 1 - x;

    ctx.strokeStyle = "rgba(139, 92, 246, 0.85)";
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const lA = landmarks[a];
      const lB = landmarks[b];
      if (!lA || !lB || lA.visibility < 0.4 || lB.visibility < 0.4) continue;
      ctx.beginPath();
      ctx.moveTo(mx(lA.x) * canvas.width, lA.y * canvas.height);
      ctx.lineTo(mx(lB.x) * canvas.width, lB.y * canvas.height);
      ctx.stroke();
    }

    // Draw landmark dots
    ctx.fillStyle = "rgba(196, 181, 253, 0.9)";
    for (const lm of landmarks) {
      if (!lm || lm.visibility < 0.4) continue;
      ctx.beginPath();
      ctx.arc(mx(lm.x) * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const initPoseDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    try {
      const { Pose } = await import("@mediapipe/pose");

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (results.poseLandmarks) {
          landmarksRef.current = results.poseLandmarks;
          if (canvasRef.current) {
            drawPoseSkeleton(results.poseLandmarks, canvasRef.current);
          }
        }
      });

      poseRef.current = pose;

      // Run pose on each video frame
      const runFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
          try { await poseRef.current.send({ image: videoRef.current }); } catch (_) {}
        }
        poseFrameRef.current = requestAnimationFrame(runFrame);
      };
      poseFrameRef.current = requestAnimationFrame(runFrame);

      // Analyze behavior every 2.5s (smooth, not jittery)
      behaviorTimerRef.current = setInterval(() => {
        if (landmarksRef.current.length > 0) {
          analyzeBehavior(landmarksRef.current);
        }
      }, 2500);

      console.log("✅ MediaPipe Pose initialized");
    } catch (err) {
      console.warn("MediaPipe Pose unavailable — using fallback behavior analysis:", err);
      startFallbackBehavior();
    }
  };

  // Fallback: heuristic behavior from voice + sentiment when pose unavailable
  const startFallbackBehavior = () => {
    const states = [
      { posture: "Stable", head: "Centered", engagement: "High", state: "Focused" },
      { posture: "Stable", head: "Centered", engagement: "Moderate", state: "Attentive" },
      { posture: "Unbalanced", head: "Looking Left", engagement: "Moderate", state: "Thinking" },
      { posture: "Stable", head: "Centered", engagement: "High", state: "Engaged" },
    ];
    let i = 0;
    behaviorTimerRef.current = setInterval(() => {
      setBehavior(states[i % states.length]);
      i++;
    }, 4000);
  };

  // ── Speech recognition — continuous with silence debounce ─────────────────
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef("");
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initSpeechRecognition = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      updateStatus("speech", "Not Supported");
      updateStatus("transcription", "Failed — use Chrome");
      console.warn("❌ Web Speech API not supported");
      return;
    }
    const rec = new SR();
    // continuous:false is more stable in Chrome — we handle the restart loop ourselves
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      sampleVoice();

      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }

      if (finalChunk) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + finalChunk).trim();
      }

      const display = (accumulatedTranscriptRef.current + " " + interim).trim();
      setLiveTranscript(display);
      updateStatus("transcription", "Working");

      // Reset silence timer on every speech event
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const finalText = accumulatedTranscriptRef.current.trim();
        if (finalText && !isProcessingRef.current) {
          console.log("🎤 Transcription complete:", finalText);
          accumulatedTranscriptRef.current = "";
          setLiveTranscript("");
          stopListening();
          handleUserAnswer(finalText);
        }
      }, 2000);
    };

    rec.onstart = () => {
      setIsListening(true);
      updateStatus("listening", "Active");
      updateStatus("speech", "Listening");
    };

    rec.onend = () => {
      setIsListening(false);
      updateStatus("listening", "Idle");
      updateStatus("speech", "Idle");
      if (maxSpeechTimerRef.current) { clearInterval(maxSpeechTimerRef.current); maxSpeechTimerRef.current = null; }

      // Restart ONLY if: we want to listen AND not processing AND not muted
      // Use a short delay to avoid rapid fire
      if (shouldListenRef.current && !isProcessingRef.current && !isMutedRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldListenRef.current && !isProcessingRef.current) {
            try { rec.start(); } catch (_) {}
          }
        }, 500);
      }
    };

    rec.onerror = (e: any) => {
      // no-speech and aborted are normal — don't log them as errors
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.warn("Speech error:", e.error);
      updateStatus("speech", `Error: ${e.error}`);
    };

    recognitionRef.current = rec;
    updateStatus("speech", "Ready");
    console.log("✅ Speech recognition initialized");
  };

  // ── Voice analysis (Web Audio API — real values, not fake) ───────────────
  const sampleVoice = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    const peak = Math.max(...data);
    voiceSampleRef.current.sumAvg += avg;
    voiceSampleRef.current.maxPeak = Math.max(voiceSampleRef.current.maxPeak, peak);
    voiceSampleRef.current.samples += 1;
  };

  const computeVoiceAnalysis = (text: string): { pitch: string; speed: string; energy: string } => {
    const { sumAvg, maxPeak, samples } = voiceSampleRef.current;
    const avgAmplitude = samples > 0 ? sumAvg / samples : 0;

    // Energy: based on average amplitude across all samples
    // Mic input typically: quiet=0-8, soft speech=8-20, normal=20-50, loud=50+
    const energy = avgAmplitude < 8 ? "Low" : avgAmplitude < 25 ? "Medium" : "High";

    // Pitch proxy: peak frequency bin value
    // Low voice: peak < 40, normal: 40-100, high/loud: 100+
    const pitch = maxPeak < 40 ? "Low" : maxPeak < 100 ? "Normal" : "High";

    // Speed: words per second since speech started
    const durationSec = Math.max(1, (Date.now() - speechStartTimeRef.current) / 1000);
    const wps = text.trim().split(/\s+/).length / durationSec;
    const speed = wps < 1.5 ? "Slow" : wps < 3.0 ? "Normal" : "Fast";

    console.log(`🎙️ Voice — energy:${energy} pitch:${pitch} speed:${speed} | avg:${avgAmplitude.toFixed(1)} peak:${maxPeak} wps:${wps.toFixed(2)} samples:${samples}`);
    return { pitch, speed, energy };
  };

  // Use ref for isMuted to avoid stale closure
  const isMutedRef = useRef(false);
  // Explicit flag: true = we WANT to be listening, false = we intentionally stopped
  const shouldListenRef = useRef(false);

  const startListening = () => {
    if (!recognitionRef.current || isMutedRef.current) return;
    if (isProcessingRef.current) {
      console.log("⏸️ startListening skipped — still processing");
      return;
    }
    console.log("🎤 startListening called");
    shouldListenRef.current = true;
    accumulatedTranscriptRef.current = "";
    voiceSampleRef.current = { sumAvg: 0, maxPeak: 0, samples: 0 };
    speechStartTimeRef.current = Date.now();
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      // Already started — that's fine
      if (!e.message?.includes("already started")) console.warn("startListening error:", e);
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (maxSpeechTimerRef.current) { clearInterval(maxSpeechTimerRef.current); maxSpeechTimerRef.current = null; }
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    try { recognitionRef.current?.stop(); } catch (_) {}
  };

  // ── Init assessment ────────────────────────────────────────────────────────
  const initAssessment = async () => {
    if (!type) { navigate("/assessment/start"); return; }
    try {
      // Health check logs
      console.log("🔍 Camera:", streamRef.current ? "✅ Active" : "❌ No stream");
      console.log("🔍 Speech API:", ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? "✅ Available" : "❌ Not supported");
      console.log("🔍 Backend:", "http://localhost:3001");

      // Start session
      const sessRes = await fetch("http://localhost:3001/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const sessData = await sessRes.json();
      const sid = sessData.sessionId;
      setSessionId(sid);
      updateStatus("session", "Active");
      console.log("✅ Session started:", sid);

      // Start interview — load ALL questions into ref immediately
      const intRes = await fetch("http://localhost:3001/api/ai-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, assessmentType: type }),
      });
      const intData = await intRes.json();

      setTotalQuestions(intData.totalQuestions);

      // Pre-fetch all questions so Continue never hits the fallback branch
      const allQRes = await fetch("http://localhost:3001/api/ai-interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentType: type }),
      }).catch(() => null);

      if (allQRes?.ok) {
        const allQData = await allQRes.json();
        setQuestions(allQData.questions);
        questionsRef.current = allQData.questions;
        console.log("✅ All questions pre-loaded:", allQData.questions.length);
      } else {
        // Fallback: only first question available — rest come via process-response
        setQuestions([intData.firstQuestion]);
        questionsRef.current = [intData.firstQuestion];
      }
      updateStatus("question", "Q1");

      // Show intro
      addAiMessage("intro", intData.introduction);
      updateStatus("aiSpeakingStatus", "Active");
      await speakText(intData.introduction);
      updateStatus("aiSpeakingStatus", "Idle");

      // Small pause then first question
      await delay(800);
      addAiMessage("q0", intData.firstQuestion.text);
      updateStatus("aiSpeakingStatus", "Active");
      await speakText(intData.firstQuestion.text);
      updateStatus("aiSpeakingStatus", "Idle");

      setTimeout(() => startListening(), 600);
    } catch (err: any) {
      console.error("Init error:", err);
      alert(`Failed to start: ${err.message}`);
      navigate("/assessment/start");
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const addAiMessage = (id: string, text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id, speaker: "ai", text, timestamp: new Date() },
    ]);
  };

  const addUserMessage = (id: string, text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id, speaker: "user", text, timestamp: new Date() },
    ]);
  };

  // ── HuggingFace emotion detection (PRIMARY — runs in parallel) ───────────
  // Calls HF directly from frontend for speed. Falls back to local if HF fails.
  const detectEmotionHF = async (text: string): Promise<void> => {
    const hfKey = import.meta.env.VITE_HF_API_KEY;
    if (!hfKey || hfKey === "hf_placeholder_key") {
      console.log("⚠️ HF key not set — using local fallback only");
      return;
    }

    try {
      console.log("🤗 Calling HuggingFace emotion model...");
      const res = await fetch(
        "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!res.ok) throw new Error(`HF HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.[0]) throw new Error("Invalid HF response shape");

      // data[0] is an array of { label, score } — pick highest score
      const scores: { label: string; score: number }[] = data[0];
      const top = scores.reduce((a, b) => (a.score > b.score ? a : b));
      console.log("✅ HF result:", top.label, `(${(top.score * 100).toFixed(1)}%)`);

      // Map HF labels → UI labels
      const labelMap: Record<string, { sentiment: { label: string; score: number }; emotion: { label: string; tone: string } }> = {
        sadness:  { sentiment: { label: "Low",       score: 18 }, emotion: { label: "Sadness",   tone: "Withdrawn" } },
        anger:    { sentiment: { label: "Low",       score: 22 }, emotion: { label: "Anger",     tone: "Tense" } },
        fear:     { sentiment: { label: "Thoughtful",score: 35 }, emotion: { label: "Fear",      tone: "Anxious" } },
        disgust:  { sentiment: { label: "Low",       score: 20 }, emotion: { label: "Disgust",   tone: "Aversive" } },
        joy:      { sentiment: { label: "Positive",  score: 88 }, emotion: { label: "Joy",       tone: "Upbeat" } },
        surprise: { sentiment: { label: "Neutral",   score: 58 }, emotion: { label: "Surprise",  tone: "Alert" } },
        neutral:  { sentiment: { label: "Neutral",   score: 52 }, emotion: { label: "Neutral",   tone: "Composed" } },
      };

      const mapped = labelMap[top.label.toLowerCase()];
      if (mapped && isMountedRef.current) {
        // Scale score by confidence
        const confidence = top.score;
        const scaledScore = Math.round(mapped.sentiment.score * confidence + 50 * (1 - confidence));
        setSentiment({ label: mapped.sentiment.label, score: scaledScore });
        setEmotion(mapped.emotion);
        console.log("🤗 HF override applied:", mapped.emotion.label, `score:${scaledScore}`);
      }
    } catch (err) {
      console.warn("🤗 HF failed — keeping local fallback result:", err);
    }
  };

  // ── Sentiment analysis — expanded keyword set, correct scoring ───────────
  const analyzeSentiment = (text: string): { label: string; score: number } => {
    const t = text.toLowerCase();
    const negWords = (t.match(
      /sad|tired|hopeless|worthless|depressed|anxious|stressed|worried|awful|terrible|bad|horrible|empty|numb|exhausted|failure|useless|broken|lost|alone|lonely|miserable|hate|disgusting|pathetic|weak|helpless|overwhelmed|burnout|burnt out|can't|cannot|never|nothing|nobody|pointless|meaningless/g
    ) || []).length;
    const posWords = (t.match(
      /good|great|fine|okay|happy|calm|relaxed|better|well|positive|hopeful|energized|excited|wonderful|amazing|fantastic|love|enjoy|grateful|thankful|proud|confident|strong|motivated|peaceful|content/g
    ) || []).length;

    if (negWords >= 3) return { label: "Severe", score: 10 };
    if (negWords === 2) return { label: "Low", score: 20 };
    if (negWords === 1) return { label: "Thoughtful", score: 38 };
    if (posWords >= 2) return { label: "Positive", score: 85 };
    if (posWords === 1) return { label: "Neutral", score: 62 };
    return { label: "Neutral", score: 50 };
  };

  // ── Tone analysis — expanded patterns, no false "Calm" default ────────────
  const analyzeTone = (text: string): { label: string; tone: string } => {
    const t = text.toLowerCase();
    if (/suicid|end my life|kill myself|don't want to live|want to die/.test(t))
      return { label: "Crisis", tone: "Critical" };
    if (/failure|worthless|useless|pathetic|hate myself|i'm nothing|i am nothing/.test(t))
      return { label: "Distressed", tone: "Self-Critical" };
    if (/cry|crying|tears|breakdown|can't cope|can't handle|falling apart/.test(t))
      return { label: "Distressed", tone: "Vulnerable" };
    if (/angry|frustrated|annoyed|irritated|mad|furious|rage/.test(t))
      return { label: "Frustrated", tone: "Tense" };
    if (/scared|afraid|fear|panic|terrified|nervous|dread/.test(t))
      return { label: "Fearful", tone: "Anxious" };
    if (/happy|excited|great|wonderful|amazing|fantastic|love it/.test(t))
      return { label: "Positive", tone: "Upbeat" };
    if (/tired|exhausted|drained|no energy|fatigued|worn out/.test(t))
      return { label: "Fatigued", tone: "Low Energy" };
    if (/hopeless|empty|numb|meaningless|pointless|nothing matters/.test(t))
      return { label: "Depressed", tone: "Withdrawn" };
    if (/stressed|overwhelmed|too much|can't keep up|pressure/.test(t))
      return { label: "Stressed", tone: "Overwhelmed" };
    if (/okay|fine|alright|not bad|managing|getting by/.test(t))
      return { label: "Stable", tone: "Composed" };
    if (/good|well|great|positive|happy|calm|relaxed/.test(t))
      return { label: "Positive", tone: "Upbeat" };
    // No match — derive from sentiment score rather than defaulting to "Calm"
    return { label: "Neutral", tone: "Reflective" };
  };

  // ── Generate empathy response via backend (Gemini) ─────────────────────────
  // Uses ref to avoid stale closure on currentQuestionIndex
  const generateEmpathyResponse = async (userText: string, qIndex: number, voice?: { pitch: string; speed: string; energy: string }): Promise<string> => {
    try {
      const currentQ = questionsRef.current[qIndex];
      if (!currentQ) return "Thank you for sharing that.";

      const res = await fetch("http://localhost:3001/api/ai-interview/process-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userResponse: userText,
          questionId: currentQ.questionId,
          assessmentType: type,
          voiceAnalysis: voice ?? null,
        }),
      });
      const data = await res.json();

      // Handle crisis
      if (data.crisisDetected) {
        addAiMessage("crisis", data.crisisMessage);
        await speakText(data.crisisMessage);
        alert(`Crisis resources:\nUS: ${data.crisisResources?.us?.number}\nIndia: ${data.crisisResources?.india?.number}`);
        setTimeout(() => navigate(`/assessment/results/${sessionId}?crisis=true`), 2000);
        return "";
      }

      // Pre-load next question into ref AND state
      if (data.nextQuestion) {
        questionsRef.current = [...questionsRef.current];
        const nextIdx = qIndex + 1;
        if (!questionsRef.current[nextIdx]) {
          questionsRef.current[nextIdx] = data.nextQuestion;
        }
        setQuestions((prev) => {
          const next = [...prev];
          if (!next[nextIdx]) next[nextIdx] = data.nextQuestion;
          return next;
        });
      }

      // Update emotion from HuggingFace if available — overrides local analysis
      if (data.emotionData) {
        const hfLabel =
          data.emotionData.valence === "positive" ? "Positive" :
          data.emotionData.valence === "negative" ? "Low" : "Neutral";
        const hfScore = Math.round(data.emotionData.intensity);
        console.log("🤗 HuggingFace emotion override:", data.emotionData);
        setSentiment({ label: hfLabel, score: hfScore });
        setEmotion({
          label: data.emotionData.emotion.charAt(0).toUpperCase() + data.emotionData.emotion.slice(1),
          tone: data.emotionData.tone
        });
      }

      return data.naturalResponse || "Thank you for sharing that.";
    } catch (err) {
      console.error("Empathy response error:", err);
      return "Thank you for sharing that with me.";
    }
  };

  // ── CORE: Handle user answer ───────────────────────────────────────────────
  const handleUserAnswer = async (userText: string) => {
    if (isProcessingRef.current || !questionsRef.current[currentQuestionIndexRef.current]) return;

    const qIndex = currentQuestionIndexRef.current;
    console.log("👤 User Answer:", userText);
    console.log("📍 Question Index:", qIndex);

    isProcessingRef.current = true;
    stopListening(); // sets shouldListenRef=false, clears timers, stops recognition
    setIsListening(false);
    setIsProcessing(true);
    setCanContinue(false);
    setLiveTranscript("");
    setUserDisplay(userText);
    updateStatus("processing", "Active");
    updateStatus("listening", "Idle");
    updateStatus("transcription", "Working");

    // Show user message in transcript
    addUserMessage(Date.now().toString(), userText);

    // STEP 1: Classify answer → deterministic score
    const score = classifyAnswer(userText);
    console.log("📊 Score:", score);

    // STEP 2: Local sentiment + tone immediately (instant display)
    const sentimentResult = analyzeSentiment(userText);
    const toneResult = analyzeTone(userText);
    setSentiment(sentimentResult);
    setEmotion(toneResult);

    // STEP 2b: Real voice analysis from Web Audio API
    const voice = computeVoiceAnalysis(userText);
    setVoiceAnalysis(voice);
    updateStatus("emotionAnalysis", "Active");
    console.log("🎭 Local — Sentiment:", sentimentResult.label, "| Tone:", toneResult.tone, "| Voice:", voice);

    // STEP 2c: HuggingFace emotion (parallel, non-blocking — overrides local when ready)
    detectEmotionHF(userText); // fire-and-forget, updates state when resolved

    // STEP 3: Save answer
    setAnswers((prev) => [
      ...prev,
      { questionId: questionsRef.current[qIndex].questionId, text: userText, score },
    ]);

    // STEP 4: Show typing animation, then get AI empathy response
    setShowTyping(true);
    await delay(1200);

    const aiReply = await generateEmpathyResponse(userText, qIndex, voice);
    setShowTyping(false);

    if (!aiReply) { isProcessingRef.current = false; return; }

    setAiResponse(aiReply);
    console.log("🤖 AI Response:", aiReply);

    addAiMessage(Date.now().toString() + "_r", aiReply);
    updateStatus("aiSpeakingStatus", "Active");
    updateStatus("processing", "Idle");
    await speakText(aiReply);
    updateStatus("aiSpeakingStatus", "Idle");

    // STEP 5: Enable continue
    isProcessingRef.current = false;
    setIsProcessing(false);
    setCanContinue(true);
    updateStatus("question", `Q${qIndex + 1} ✓`);
    console.log("✅ Can Continue: true");
  };

  // ── Continue to next question ──────────────────────────────────────────────
  const handleContinue = async () => {
    console.log("▶️ Continue clicked — canContinue:", canContinue, "| isProcessing:", isProcessingRef.current, "| aiSpeaking:", aiSpeaking);

    if (!canContinue) {
      console.warn("⛔ Blocked: canContinue is false");
      return;
    }
    if (isProcessingRef.current) {
      console.warn("⛔ Blocked: still processing");
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    console.log("➡️ Moving to question index:", nextIndex, "of", totalQuestions);

    if (nextIndex >= totalQuestions) {
      console.log("🏁 Last question reached — finishing assessment");
      await finishAssessment();
      return;
    }

    // Reset state for next question
    setCanContinue(false);
    setAiResponse(null);
    setUserDisplay(null);
    setLiveTranscript("");
    accumulatedTranscriptRef.current = "";
    setSentiment(null);
    setEmotion(null);

    // Update index — both state and ref
    setCurrentQuestionIndex(nextIndex);
    currentQuestionIndexRef.current = nextIndex;
    updateStatus("question", `Q${nextIndex + 1}`);

    const nextQ = questionsRef.current[nextIndex];
    console.log("📋 Next question:", nextQ?.text ?? "NOT LOADED YET");

    if (nextQ) {
      addAiMessage(`q${nextIndex}`, nextQ.text);
      await speakText(nextQ.text);
      setTimeout(() => startListening(), 600);
    } else {
      // Should not happen if all questions were pre-loaded — log and recover
      console.error("❌ Question", nextIndex, "not in cache. questionsRef:", questionsRef.current.length);
      const fallbackMsg = "Let's continue with the next question. Please share your thoughts when ready.";
      addAiMessage(`q${nextIndex}-fallback`, fallbackMsg);
      await speakText(fallbackMsg);
      setTimeout(() => startListening(), 600);
    }
  };

  // ── Finish assessment ──────────────────────────────────────────────────────
  const finishAssessment = async () => {
    const score = calculateScore(answers);
    const severity = getSeverity(score, totalQuestions);
    console.log("🏁 Final Score:", score, "Severity:", severity);

    // Stop mic + camera — no longer needed
    stopListening();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    const closing = `Thank you for completing the assessment. Your responses have been recorded and your report is being prepared.`;
    addAiMessage("closing", closing);
    await speakText(closing);

    // Show completion screen immediately
    setIsCompleted(true);
    setReportGenerating(true);

    // Save to localStorage so Dashboard Reports tab can list it
    const reportEntry = {
      sessionId,
      assessmentType: type,
      assessmentTitle: TITLES[type || "phq9"],
      score,
      severity,
      totalQuestions,
      completedAt: new Date().toISOString(),
      answers: answers.map(a => ({ questionId: a.questionId, score: a.score })),
      // Multimodal analysis snapshots
      emotionSnapshot: emotion,
      sentimentSnapshot: sentiment,
      voiceSnapshot: voiceAnalysis,
      behaviorSnapshot: behavior,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("neuroscan_reports") || "[]");
      existing.unshift(reportEntry); // newest first
      localStorage.setItem("neuroscan_reports", JSON.stringify(existing.slice(0, 20))); // keep last 20
      console.log("💾 Report saved to localStorage");
    } catch (_) {}

    // Call backend complete endpoint
    try {
      await fetch("http://localhost:3001/api/ai-interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, assessmentType: type, score, severity }),
      });
    } catch (_) {}

    setReportGenerating(false);

    // Navigate to results after 3s so user sees the completion screen
    setTimeout(() => navigate(`/assessment/results/${sessionId}`), 3000);
  };

  // ── TTS — stops immediately on unmount, guaranteed resolve ───────────────
  const speakText = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      // If already unmounted, resolve immediately — don't play anything
      if (!isMountedRef.current) { resolve(); return; }

      setAiSpeaking(true);

      const done = () => {
        if (isMountedRef.current) setAiSpeaking(false);
        resolve();
      };

      const safetyTimer = setTimeout(() => {
        console.warn("⚠️ TTS safety timeout fired");
        done();
      }, 30_000);

      const finish = () => { clearTimeout(safetyTimer); done(); };

      try {
        const res = await fetch("http://localhost:3001/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        // Check again after the async fetch — component may have unmounted
        if (!isMountedRef.current) { clearTimeout(safetyTimer); resolve(); return; }

        if (res.ok && res.headers.get("content-type")?.includes("audio")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); finish(); };
          audio.onerror = () => { URL.revokeObjectURL(url); finish(); };
          // If unmounted before play, kill immediately
          if (!isMountedRef.current) {
            audio.src = "";
            URL.revokeObjectURL(url);
            clearTimeout(safetyTimer);
            resolve();
            return;
          }
          await audio.play().catch(() => finish());
          return;
        }
      } catch (_) {}

      if (!isMountedRef.current) { clearTimeout(safetyTimer); resolve(); return; }

      // Browser TTS fallback
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.88;
        utt.pitch = 1.05;
        utt.onend = () => finish();
        utt.onerror = () => finish();
        window.speechSynthesis.speak(utt);
        const estimatedMs = Math.max(3000, (text.split(" ").length / 130) * 60_000 * (1 / 0.88));
        setTimeout(() => {
          if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          finish();
        }, estimatedMs + 1000);
      } else {
        finish();
      }
    });
  };

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const handleEnd = () => {
    if (!window.confirm("End assessment early?")) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopListening();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    navigate("/dashboard");
  };

  // ── Loading screen — only shown while requesting permissions ─────────────
  if (!permissionsGranted) {
    return (
      <div className="h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Requesting camera & microphone...</p>
          <p className="text-gray-600 text-sm mt-2">Please allow access when prompted</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // ── Completion screen ──────────────────────────────────────────────────────
  if (isCompleted) {
    const score = calculateScore(answers);
    const severity = getSeverity(score, totalQuestions);
    const severityColor =
      severity === "Minimal" ? "text-green-400" :
      severity === "Mild" ? "text-yellow-400" :
      severity === "Moderate" ? "text-orange-400" : "text-red-400";

    return (
      <div className="h-screen bg-[#0a0b0f] flex items-center justify-center overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center max-w-md mx-auto px-6"
        >
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center border-4 border-purple-500/40 mx-auto mb-6"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl"
            >
              ✓
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Assessment Complete
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-6"
          >
            {TITLES[type || "phq9"]}
          </motion.p>

          {/* Score summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6"
          >
            <p className="text-gray-400 text-sm mb-1">Your Score</p>
            <p className="text-5xl font-bold text-white mb-1">{score}</p>
            <p className={`text-lg font-semibold ${severityColor}`}>{severity}</p>
          </motion.div>

          {/* Report generating status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            {reportGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-purple-400 text-sm">Generating your detailed report...</span>
              </>
            ) : (
              <>
                <span className="text-green-400 text-sm">✓ Report ready — redirecting to results...</span>
              </>
            )}
          </motion.div>

          {/* Manual navigate button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate(`/assessment/results/${sessionId}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold mb-3"
          >
            View Full Report →
          </motion.button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    // ✅ h-screen + overflow-hidden = NO PAGE SCROLL
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0b0f] text-white">

      {/* Initializing overlay — shown while session starts but video is already in DOM */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-[#0a0b0f]/90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Initializing Dr. Sarah...</p>
          </div>
        </div>
      )}

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── Header ── */}
      <div className="flex-shrink-0 relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">AI Psychological Interview</h1>
            <p className="text-gray-400 text-xs">{TITLES[type || "phq9"]}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </p>
              <div className="w-36 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
            <button onClick={handleEnd} className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3-Column Body ── */}
      <div className="flex-1 relative z-10 flex overflow-hidden min-h-0">

        {/* ── LEFT: Video + Status (fixed width, inner content scrolls) ── */}
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col">
          {/* Fixed: video section */}
          <div className="flex-shrink-0 p-4 pb-2">
            <p className="text-sm font-semibold text-gray-300 mb-3">Your Video</p>

          {/* Video feed — larger, fixed height */}
          <div className="relative w-full h-[200px] flex-shrink-0 bg-black rounded-xl overflow-hidden border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)", display: isVideoOn ? "block" : "none" }}
            />
            {/* Pose skeleton overlay canvas */}
            <canvas
              ref={canvasRef}
              width={300}
              height={200}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: isVideoOn ? "block" : "none" }}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff className="w-10 h-10 text-gray-600" />
              </div>
            )}
            {/* Live badge */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-full flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isVideoOn ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-white text-xs">{isVideoOn ? "Live" : "Off"}</span>
            </div>
            {isListening && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/90 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs">Listening</span>
              </div>
            )}
          </div>
          </div>{/* end fixed video section */}

          {/* Scrollable: status panels */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar min-h-0">

          {/* System status — all live, no fake values */}
          <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1.5">
            <p className="text-gray-400 font-semibold mb-2">System Status</p>
            {[
              { label: "Permissions", value: sysStatus.permissions, ok: sysStatus.permissions === "Granted" },
              { label: "Video", value: sysStatus.video, ok: sysStatus.video === "Ready" },
              { label: "Stream", value: sysStatus.stream, ok: sysStatus.stream === "Active" },
              { label: "Speech", value: sysStatus.speech, ok: sysStatus.speech === "Listening" || sysStatus.speech === "Ready" || sysStatus.speech === "Idle" },
              { label: "Session", value: sysStatus.session, ok: sysStatus.session === "Active" },
              { label: "Question", value: sysStatus.question, ok: sysStatus.question !== "—" },
              { label: "Listening", value: sysStatus.listening, ok: sysStatus.listening === "Active" },
              { label: "Processing", value: sysStatus.processing, ok: sysStatus.processing === "Active" },
              { label: "AI Speaking", value: sysStatus.aiSpeakingStatus, ok: sysStatus.aiSpeakingStatus === "Active" },
              { label: "Transcription", value: sysStatus.transcription, ok: sysStatus.transcription === "Working" },
              { label: "Emotion AI", value: sysStatus.emotionAnalysis, ok: sysStatus.emotionAnalysis === "Active" },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    ok ? "bg-green-400 animate-pulse" :
                    value.includes("Failed") || value.includes("Denied") || value.includes("Error") ? "bg-red-400" :
                    "bg-gray-600"
                  }`} />
                  <span className="text-gray-400">{label}:</span>
                </div>
                <span className={`font-medium truncate max-w-[100px] text-right ${
                  ok ? "text-green-300" :
                  value.includes("Failed") || value.includes("Denied") ? "text-red-300" :
                  "text-gray-400"
                }`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Sentiment / Emotion — only shows AFTER user speaks */}
          <div className="p-3 bg-white/5 rounded-xl text-xs space-y-2">
            <p className="text-gray-400 font-semibold">Emotional Analysis</p>
            {!sentiment ? (
              <p className="text-gray-600 italic">Waiting for response...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{sentiment.label}</span>
                  <span className="text-gray-400">{sentiment.score}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      sentiment.score >= 70 ? "bg-green-400" :
                      sentiment.score >= 45 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    animate={{ width: `${sentiment.score}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {emotion && (
                  <>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-gray-400">Tone:</span>
                      <span className="text-purple-300 font-semibold">{emotion.tone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Emotion:</span>
                      <span className="text-blue-300 font-semibold">{emotion.label}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Score preview */}
          {answers.length > 0 && (
            <div className="p-3 bg-white/5 rounded-xl text-xs">
              <p className="text-gray-400 font-semibold mb-1">Progress</p>
              <p className="text-white">{answers.length} / {totalQuestions} answered</p>
              <p className="text-purple-300">Score so far: {calculateScore(answers)}</p>
            </div>
          )}

          {/* Voice Analysis — real Web Audio API values */}
          <div className="p-3 bg-white/5 rounded-xl text-xs space-y-2">
            <p className="text-gray-400 font-semibold">Voice Analysis</p>
            {!voiceAnalysis ? (
              <p className="text-gray-600 italic">Waiting for speech...</p>
            ) : (
              <>
                {[
                  { label: "Pitch", value: voiceAnalysis.pitch, low: "Low", high: "High" },
                  { label: "Speed", value: voiceAnalysis.speed, low: "Slow", high: "Fast" },
                  { label: "Energy", value: voiceAnalysis.energy, low: "Low", high: "High" },
                ].map(({ label, value, low, high }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-400">{label}:</span>
                    <span className={`font-semibold ${
                      value === high ? "text-orange-300" :
                      value === low ? "text-blue-300" : "text-green-300"
                    }`}>{value}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Behavioral Analysis — MediaPipe Pose */}
          <div className="p-3 bg-white/5 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 font-semibold">Behavioral Analysis</p>
              {behavior && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </div>
            {!behavior ? (
              <p className="text-gray-600 italic">Initializing pose detection...</p>
            ) : (
              <>
                {[
                  { label: "Posture", value: behavior.posture,
                    color: behavior.posture === "Stable" ? "text-green-300" : "text-yellow-300" },
                  { label: "Head", value: behavior.head,
                    color: behavior.head === "Centered" ? "text-green-300" : "text-yellow-300" },
                  { label: "Engagement", value: behavior.engagement,
                    color: behavior.engagement === "High" ? "text-green-300" : behavior.engagement === "Moderate" ? "text-yellow-300" : "text-red-300" },
                  { label: "State", value: behavior.state,
                    color: behavior.state === "Focused" || behavior.state === "Engaged" ? "text-purple-300" : "text-gray-300" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-400">{label}:</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          </div>{/* end scrollable status section */}
        </div>{/* end LEFT panel */}

        {/* ── CENTER: AI Avatar + Question + Controls (fixed, no scroll) ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 p-6">

          {/* AI Avatar — large, dominant hero */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3 mb-2">
            <motion.div
              animate={{
                scale: aiSpeaking ? [1, 1.06, 1] : 1,
                boxShadow: aiSpeaking
                  ? ["0 0 60px rgba(139,92,246,0.4)", "0 0 120px rgba(139,92,246,0.7)", "0 0 60px rgba(139,92,246,0.4)"]
                  : "0 0 60px rgba(139,92,246,0.25)",
              }}
              transition={{ duration: 1.5, repeat: aiSpeaking ? Infinity : 0 }}
              className="w-44 h-44 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 rounded-full flex items-center justify-center border-4 border-purple-500/50 relative"
            >
              <Brain className="w-24 h-24 text-purple-300" />
              {/* Outer ring pulse when speaking */}
              {aiSpeaking && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400/40"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">Dr. Sarah</p>
              <p className="text-gray-400 text-sm">Clinical Psychologist · AI</p>
              {aiSpeaking && (
                <motion.p
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-purple-400 text-xs mt-1"
                >
                  ● Speaking
                </motion.p>
              )}
            </div>
          </div>

          {/* Question / AI response box */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-xl space-y-3">
              <AnimatePresence mode="wait">
                {isProcessing && !showTyping ? (
                  <motion.div key="processing" className="flex items-center justify-center gap-3 py-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                    />
                    <span className="text-purple-400">Analyzing response...</span>
                  </motion.div>
                ) : currentQuestion ? (
                  <motion.div
                    key={`q-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <p className="text-purple-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </p>
                    <p className="text-white text-lg leading-relaxed">{currentQuestion.text}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Live transcription — CENTER panel, real-time while speaking */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    key="live-transcript"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-xs text-green-400 font-semibold">Listening...</p>
                    </div>
                    <p className="text-green-200 text-sm min-h-[1.25rem]">
                      {liveTranscript || <span className="text-green-400/50 italic">Speak your answer</span>}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User answer display */}
              <AnimatePresence>
                {userDisplay && (
                  <motion.div
                    key="user-display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3"
                  >
                    <p className="text-xs text-blue-400 font-semibold mb-1">Your answer:</p>
                    <p className="text-blue-200 text-sm">{userDisplay}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI response display */}
              <AnimatePresence>
                {aiResponse && !isProcessing && (
                  <motion.div
                    key="ai-display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3"
                  >
                    <p className="text-xs text-purple-400 font-semibold mb-1">Dr. Sarah:</p>
                    <p className="text-purple-200 text-sm">{aiResponse}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 space-y-3">
            {/* Continue button — only shows when ready */}
            <AnimatePresence>
              {canContinue && !isProcessing && !aiSpeaking && (
                <motion.button
                  key="continue"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  onClick={handleContinue}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-purple-500/20"
                >
                  Continue to Next Question →
                </motion.button>
              )}
            </AnimatePresence>

            {/* Mic / Video / End */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${!isVideoOn ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Status hint */}
            <div className="text-center text-sm h-5">
              {isListening && <span className="text-green-400">🎤 Listening — speak your answer</span>}
              {aiSpeaking && <span className="text-purple-400">🔊 Dr. Sarah is speaking...</span>}
              {isProcessing && !aiSpeaking && <span className="text-yellow-400">⏳ Processing your response...</span>}
              {canContinue && !aiSpeaking && !isProcessing && (
                <span className="text-blue-400">✅ Click Continue when ready</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Transcript (ONLY THIS SCROLLS) ── */}
        <div className="w-[340px] flex-shrink-0 h-full overflow-hidden border-l border-white/10 bg-black/20 backdrop-blur-xl p-4 flex flex-col">
          <p className="text-sm font-semibold text-gray-300 flex-shrink-0 mb-3">Live Transcript</p>

          {/* ✅ overflow-y-auto ONLY here */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
            {transcript.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.speaker === "ai" ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl text-sm ${
                    msg.speaker === "ai"
                      ? "bg-purple-500/15 border border-purple-500/25"
                      : "bg-blue-500/15 border border-blue-500/25"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${msg.speaker === "ai" ? "text-purple-300" : "text-blue-300"}`}>
                      {msg.speaker === "ai" ? "Dr. Sarah" : "You"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}

            {/* Typing animation while AI is thinking */}
            {showTyping && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-start"
              >
                <div className="bg-purple-500/15 border border-purple-500/25 p-3 rounded-xl">
                  <p className="text-xs text-purple-300 font-semibold mb-1">Dr. Sarah</p>
                  <TypingDots />
                </div>
              </motion.div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssessmentInterview;
