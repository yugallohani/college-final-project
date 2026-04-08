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
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try { recognitionRef.current?.stop(); } catch (_) {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      audioRef.current?.pause();
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

      // Set isLoading=false NOW so the video element mounts in the DOM
      // The useEffect watching isLoading will then attach srcObject
      setIsLoading(false);

      initSpeechRecognition();
      await initAssessment();
    } catch (err) {
      console.error("Media error:", err);
      updateStatus("permissions", "Denied");
      updateStatus("video", "Failed");
      updateStatus("stream", "Inactive");
      alert("Please grant camera and microphone permissions to continue.");
      setIsLoading(false);
    }
  };

  // ── Speech recognition — continuous with silence debounce ─────────────────
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef("");

  const initSpeechRecognition = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      updateStatus("speech", "Not Supported");
      updateStatus("transcription", "Failed — use Chrome");
      console.warn("❌ Web Speech API not supported");
      return;
    }
    const rec = new SR();
    rec.continuous = true;       // ✅ don't stop on pause
    rec.interimResults = true;   // ✅ show live text while speaking
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }

      // Accumulate final chunks
      if (finalChunk) {
        accumulatedTranscriptRef.current += " " + finalChunk;
        accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
      }

      // Show live interim + accumulated
      const display = (accumulatedTranscriptRef.current + " " + interim).trim();
      setLiveTranscript(display);
      updateStatus("transcription", "Working");

      // Reset silence timer — fires 2s after user stops speaking
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const finalText = accumulatedTranscriptRef.current.trim();
        if (finalText && !isProcessingRef.current) {
          console.log("🎤 Final transcription (after silence):", finalText);
          accumulatedTranscriptRef.current = "";
          setLiveTranscript("");
          handleUserAnswer(finalText);
        }
      }, 2000); // ✅ wait 2s of silence before submitting
    };

    rec.onstart = () => {
      setIsListening(true);
      updateStatus("listening", "Active");
      updateStatus("speech", "Listening");
      console.log("🎤 Listening started");
    };

    rec.onend = () => {
      setIsListening(false);
      updateStatus("listening", "Idle");
      updateStatus("speech", "Idle");
      // Auto-restart if we should still be listening (handles browser cutting off)
      if (!isProcessingRef.current && !isMutedRef.current) {
        setTimeout(() => {
          try { rec.start(); } catch (_) {}
        }, 300);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech") return; // ignore — user just hasn't spoken yet
      console.warn("Speech error:", e.error);
      updateStatus("speech", `Error: ${e.error}`);
      if (e.error !== "aborted") updateStatus("transcription", "Failed");
    };

    recognitionRef.current = rec;
    updateStatus("speech", "Ready");
    console.log("✅ Speech recognition initialized (continuous mode)");
  };

  // Use ref for isMuted to avoid stale closure
  const isMutedRef = useRef(false);
  const startListening = () => {
    if (!recognitionRef.current || isMutedRef.current) return;
    accumulatedTranscriptRef.current = "";
    try {
      recognitionRef.current.start();
    } catch (_) {}
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

      // Start interview
      const intRes = await fetch("http://localhost:3001/api/ai-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, assessmentType: type }),
      });
      const intData = await intRes.json();

      setTotalQuestions(intData.totalQuestions);
      setQuestions([intData.firstQuestion]);
      questionsRef.current = [intData.firstQuestion];
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

  // ── Sentiment analysis (local keyword fallback) ────────────────────────────
  const analyzeSentiment = (text: string): { label: string; score: number } => {
    const t = text.toLowerCase();
    const negWords = (t.match(/sad|tired|hopeless|worthless|depressed|anxious|stressed|worried|awful|terrible|bad|horrible|empty|numb|exhausted/g) || []).length;
    const posWords = (t.match(/good|great|fine|okay|happy|calm|relaxed|better|well|positive|hopeful|energized/g) || []).length;
    if (negWords >= 2) return { label: "Low", score: 20 };
    if (negWords === 1) return { label: "Thoughtful", score: 40 };
    if (posWords >= 2) return { label: "Positive", score: 85 };
    if (posWords === 1) return { label: "Neutral", score: 60 };
    return { label: "Neutral", score: 50 };
  };

  // ── Tone analysis (keyword-based) ─────────────────────────────────────────
  const analyzeTone = (text: string): { label: string; tone: string } => {
    const t = text.toLowerCase();
    if (/cry|crying|tears|breakdown|can't cope|can't handle/.test(t)) return { label: "Distressed", tone: "Vulnerable" };
    if (/angry|frustrated|annoyed|irritated|mad/.test(t)) return { label: "Frustrated", tone: "Tense" };
    if (/scared|afraid|fear|panic|terrified/.test(t)) return { label: "Fearful", tone: "Anxious" };
    if (/happy|excited|great|wonderful|amazing/.test(t)) return { label: "Positive", tone: "Upbeat" };
    if (/tired|exhausted|drained|no energy/.test(t)) return { label: "Fatigued", tone: "Low Energy" };
    if (/okay|fine|alright|not bad/.test(t)) return { label: "Stable", tone: "Composed" };
    return { label: "Calm", tone: "Reflective" };
  };

  // ── Generate empathy response via backend (Gemini) ─────────────────────────
  // Uses ref to avoid stale closure on currentQuestionIndex
  const generateEmpathyResponse = async (userText: string, qIndex: number): Promise<string> => {
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

      // Update emotion from HuggingFace if available
      if (data.emotionData) {
        setSentiment({ label: data.emotionData.valence === 'positive' ? 'Positive' : data.emotionData.valence === 'negative' ? 'Low' : 'Neutral', score: data.emotionData.intensity });
        setEmotion({ label: data.emotionData.emotion.charAt(0).toUpperCase() + data.emotionData.emotion.slice(1), tone: data.emotionData.tone });
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
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    accumulatedTranscriptRef.current = "";
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

    // STEP 2: Local sentiment + tone (immediate, before HF response)
    const sentimentResult = analyzeSentiment(userText);
    const toneResult = analyzeTone(userText);
    setSentiment(sentimentResult);
    setEmotion(toneResult);
    updateStatus("emotionAnalysis", "Active");
    console.log("🎭 Sentiment:", sentimentResult.label, "| Tone:", toneResult.tone);

    // STEP 3: Save answer
    setAnswers((prev) => [
      ...prev,
      { questionId: questionsRef.current[qIndex].questionId, text: userText, score },
    ]);

    // STEP 4: Show typing animation, then get AI empathy response
    setShowTyping(true);
    await delay(1200);

    const aiReply = await generateEmpathyResponse(userText, qIndex);
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
      // Next question not pre-loaded — fetch it directly
      console.warn("⚠️ Next question not in cache — fetching from backend");
      try {
        const res = await fetch("http://localhost:3001/api/ai-interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, assessmentType: type }),
        });
        // Questions are already loaded at start — this is a fallback indicator
        // Just start listening and let the user know
        addAiMessage(`q${nextIndex}-fallback`, "Please go ahead and answer when you're ready.");
        setTimeout(() => startListening(), 600);
      } catch (_) {
        addAiMessage(`q${nextIndex}-err`, "Let's continue. Please share your response.");
        setTimeout(() => startListening(), 600);
      }
    }
  };

  // ── Finish assessment ──────────────────────────────────────────────────────
  const finishAssessment = async () => {
    const score = calculateScore(answers);
    const severity = getSeverity(score, totalQuestions);
    console.log("🏁 Final Score:", score, "Severity:", severity);

    const closing = `Thank you for completing the assessment. Based on your responses, I'll now prepare your detailed report.`;
    addAiMessage("closing", closing);
    await speakText(closing);

    try {
      await fetch("http://localhost:3001/api/ai-interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, assessmentType: type, score, severity }),
      });
    } catch (_) {}

    setTimeout(() => navigate(`/assessment/results/${sessionId}`), 2000);
  };

  // ── TTS — with guaranteed resolve so aiSpeaking never gets stuck ──────────
  const speakText = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      setAiSpeaking(true);

      const done = () => { setAiSpeaking(false); resolve(); };

      // Safety timeout — if audio never fires onended, unblock after 30s max
      const safetyTimer = setTimeout(() => {
        console.warn("⚠️ TTS safety timeout fired — unblocking");
        done();
      }, 30_000);

      const finish = () => { clearTimeout(safetyTimer); done(); };

      try {
        const res = await fetch("http://localhost:3001/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok && res.headers.get("content-type")?.includes("audio")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); finish(); };
          audio.onerror = () => { URL.revokeObjectURL(url); finish(); };
          await audio.play().catch(() => finish());
          return;
        }
      } catch (_) {}

      // Browser TTS fallback
      if ("speechSynthesis" in window) {
        // Cancel any ongoing speech first to avoid silent failures
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.88;
        utt.pitch = 1.05;
        utt.onend = () => finish();
        utt.onerror = () => finish();
        window.speechSynthesis.speak(utt);

        // Chrome bug: speechSynthesis sometimes never fires onend when tab is backgrounded
        // Add a duration-based fallback: ~130 words/min at rate 0.88
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
    try { recognitionRef.current?.stop(); } catch (_) {}
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

          {/* Live speech preview */}
          {liveTranscript && (
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-1">You're saying:</p>
              <p className="text-sm text-white italic">"{liveTranscript}"</p>
            </div>
          )}

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
