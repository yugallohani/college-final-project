import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, X, Brain, Activity } from "lucide-react";

interface Question {
  questionId: number;
  text: string;
  naturalText: string;
  options: string[];
}

interface TranscriptMessage {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface Answer {
  questionId: number;
  text: string;
  score: number;
}

interface EmotionData {
  emotion: string;
  confidence: number;
}

const AssessmentInterview = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // ✅ CENTRALIZED STATE MANAGEMENT - THE KEY FIX
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [canContinue, setCanContinue] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  
  // Session & Questions
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(9);
  const [isLoading, setIsLoading] = useState(true);
  
  // Media & Permissions
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  
  // Conversation
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  
  // Emotion
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData>({ 
    emotion: 'neutral', 
    confidence: 0 
  });

  const assessmentTitles: Record<string, string> = {
    phq9: 'PHQ-9 Depression Screening',
    gad7: 'GAD-7 Anxiety Assessment',
    stress: 'Stress Level Assessment',
    general: 'General Mental Wellness Check'
  };

  // ✅ DEBUGGING - Monitor state changes
  useEffect(() => {
    console.log("📊 STATE UPDATE:");
    console.log("   Question Index:", currentQuestionIndex);
    console.log("   Total Questions:", totalQuestions);
    console.log("   Answers Count:", answers.length);
    console.log("   Can Continue:", canContinue);
    console.log("   Is Processing:", isProcessingAnswer);
    console.log("   Current Question:", questions[currentQuestionIndex]?.text);
  }, [currentQuestionIndex, answers, canContinue, isProcessingAnswer]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Initialize on mount
  useEffect(() => {
    console.log('🎬 Component mounted, requesting permissions...');
    requestMediaPermissions();
    
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log('Recognition stop error:', err);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const requestMediaPermissions = async () => {
    try {
      console.log('🎥 Requesting media permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      
      console.log('✅ Media permissions granted');
      streamRef.current = stream;
      setPermissionsGranted(true);
      
      // Attach video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play()
          .then(() => {
            console.log('✅ Video playing');
            setVideoReady(true);
          })
          .catch(err => console.error('Video play error:', err));
      }
      
      initializeSpeechRecognition();
      await initializeAssessment();
      
    } catch (error: any) {
      console.error('❌ Error accessing media:', error);
      alert('Please grant camera and microphone permissions to continue.');
      setIsLoading(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            setCurrentTranscript(transcript);
          }
        }
        
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          handleUserAnswer(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      console.log('✅ Speech recognition initialized');
    }
  };

  const initializeAssessment = async () => {
    if (!type) {
      navigate('/assessment/start');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Creating session...');
      
      // Create session
      const sessionResponse = await fetch('http://localhost:3001/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const sessionData = await sessionResponse.json();
      console.log('✅ Session created:', sessionData.sessionId);
      setSessionId(sessionData.sessionId);

      // Initialize AI interview
      const interviewResponse = await fetch('http://localhost:3001/api/ai-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          assessmentType: type
        })
      });
      
      const interviewData = await interviewResponse.json();
      console.log('✅ Interview initialized:', interviewData);
      
      setTotalQuestions(interviewData.totalQuestions);
      
      // Build questions array
      const questionsArray: Question[] = [];
      questionsArray.push(interviewData.firstQuestion);
      setQuestions(questionsArray);
      
      // Add welcome message
      const welcomeMessage: TranscriptMessage = {
        id: 'welcome',
        speaker: 'ai',
        text: interviewData.introduction,
        timestamp: new Date()
      };
      setTranscript([welcomeMessage]);
      
      setIsLoading(false);
      
      // Speak welcome
      await speakTextAsync(interviewData.introduction);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add first question to transcript
      const firstQuestionMsg: TranscriptMessage = {
        id: '1',
        speaker: 'ai',
        text: interviewData.firstQuestion.text,
        timestamp: new Date()
      };
      setTranscript(prev => [...prev, firstQuestionMsg]);
      
      // Speak first question
      await speakTextAsync(interviewData.firstQuestion.text);
      
      // Start listening
      if (recognitionRef.current && !isMuted) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Error starting recognition:', err);
          }
        }, 500);
      }
      
    } catch (error: any) {
      console.error('❌ Error initializing assessment:', error);
      setIsLoading(false);
      alert(`Error starting assessment: ${error.message}`);
      navigate('/assessment/start');
    }
  };

  // ✅ FIXED ANSWER HANDLING - THE CORE FIX
  const handleUserAnswer = async (userText: string) => {
    console.log("📝 User Answer:", userText);
    
    if (isProcessingAnswer) {
      console.log("⚠️ Already processing, ignoring");
      return;
    }

    if (!questions[currentQuestionIndex]) {
      console.error("❌ No current question");
      return;
    }

    // Stop listening
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.log('Recognition stop error:', err);
      }
    }
    setIsListening(false);

    setIsProcessingAnswer(true);
    setCanContinue(false);
    setShowThinking(true);

    // Add user message to transcript
    const userMessage: TranscriptMessage = {
      id: Date.now().toString(),
      speaker: 'user',
      text: userText,
      timestamp: new Date()
    };
    setTranscript(prev => [...prev, userMessage]);
    setCurrentTranscript('');

    // Analyze sentiment
    const sentiment = analyzeSentiment(userText);
    updateEmotionFromSentiment(sentiment);

    try {
      // STEP 1: Send to backend for classification
      console.log("📤 Sending to backend...");
      const response = await fetch('http://localhost:3001/api/ai-interview/process-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userResponse: userText,
          questionId: questions[currentQuestionIndex].questionId,
          assessmentType: type
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Backend Response:", data);

      setShowThinking(false);

      // Handle crisis
      if (data.crisisDetected) {
        console.log('🚨 CRISIS DETECTED');
        
        const crisisMsg: TranscriptMessage = {
          id: Date.now().toString() + '_crisis',
          speaker: 'ai',
          text: data.crisisMessage,
          timestamp: new Date()
        };
        setTranscript(prev => [...prev, crisisMsg]);

        await speakTextAsync(data.crisisMessage);

        const resourcesText = `Please reach out for immediate help:\n\n` +
          `US: ${data.crisisResources.us.name} - ${data.crisisResources.us.number}\n` +
          `India: ${data.crisisResources.india.name} - ${data.crisisResources.india.number}`;
        
        alert(resourcesText);

        setTimeout(() => {
          navigate(`/assessment/results/${sessionId}?crisis=true`);
        }, 2000);
        return;
      }

      // STEP 2: Save answer with score
      const newAnswer: Answer = {
        questionId: questions[currentQuestionIndex].questionId,
        text: userText,
        score: data.analysis.score
      };
      setAnswers(prev => [...prev, newAnswer]);
      console.log("💾 Answer Saved:", newAnswer);

      // STEP 3: Add AI response to transcript
      const aiMessage: TranscriptMessage = {
        id: Date.now().toString() + '_ai',
        speaker: 'ai',
        text: data.naturalResponse,
        timestamp: new Date()
      };
      setTranscript(prev => [...prev, aiMessage]);

      // STEP 4: Speak AI response
      console.log("🗣️ Speaking AI response...");
      await speakTextAsync(data.naturalResponse);

      // STEP 5: Check if complete
      if (data.isComplete) {
        console.log('🏁 Assessment complete!');
        
        if (data.closingMessage) {
          await speakTextAsync(data.closingMessage);
          
          const closingMsg: TranscriptMessage = {
            id: Date.now().toString() + '_closing',
            speaker: 'ai',
            text: data.closingMessage,
            timestamp: new Date()
          };
          setTranscript(prev => [...prev, closingMsg]);
        }
        
        // Complete assessment
        await completeAssessment();
        return;
      }

      // STEP 6: Load next question
      if (data.nextQuestion) {
        console.log("✅ Next question received:", data.nextQuestion);
        
        // Add next question to questions array if not already there
        const nextIndex = currentQuestionIndex + 1;
        setQuestions(prev => {
          const newQuestions = [...prev];
          if (!newQuestions[nextIndex]) {
            newQuestions[nextIndex] = data.nextQuestion;
          }
          return newQuestions;
        });
        
        // Enable continue button
        setCanContinue(true);
        console.log("✅ Can Continue: true");
      }

    } catch (error) {
      console.error("❌ Error processing answer:", error);
      setShowThinking(false);
      alert("Error processing your response. Please try again.");
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  // ✅ FIXED CONTINUE BUTTON - PROPER STATE TRANSITION
  const handleContinue = async () => {
    console.log("�� Continue clicked");
    console.log("   Current Index:", currentQuestionIndex);
    console.log("   Total Questions:", totalQuestions);

    if (!canContinue) {
      console.log("⚠️ Cannot continue yet");
      return;
    }

    // Move to next question
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < totalQuestions) {
      console.log("➡️ Moving to question", nextIndex + 1);
      
      setCurrentQuestionIndex(nextIndex);
      setCanContinue(false);
      setCurrentTranscript('');
      
      // Add next question to transcript
      const nextQuestion = questions[nextIndex];
      if (nextQuestion) {
        const questionMsg: TranscriptMessage = {
          id: `q${nextIndex}`,
          speaker: 'ai',
          text: nextQuestion.text,
          timestamp: new Date()
        };
        setTranscript(prev => [...prev, questionMsg]);
        
        // Speak next question
        await speakTextAsync(nextQuestion.text);
        
        // Restart listening
        if (recognitionRef.current && !isMuted) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Error starting recognition:', err);
            }
          }, 1000);
        }
      }
    } else {
      console.log("🏁 Assessment Complete");
      await completeAssessment();
    }
  };

  const completeAssessment = async () => {
    try {
      console.log('🔄 Completing assessment...');
      
      const completeResponse = await fetch('http://localhost:3001/api/ai-interview/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, assessmentType: type })
      });

      if (completeResponse.ok) {
        const completeData = await completeResponse.json();
        console.log('✅ Assessment completed:', completeData);
      }

      setTimeout(() => {
        navigate(`/assessment/results/${sessionId}`);
      }, 2000);
    } catch (error) {
      console.error('Error completing assessment:', error);
      navigate(`/assessment/results/${sessionId}`);
    }
  };

  const speakTextAsync = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      setAiSpeaking(true);
      
      try {
        const response = await fetch('http://localhost:3001/api/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (response.ok && response.headers.get('content-type')?.includes('audio')) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setAiSpeaking(false);
            resolve();
          };
          
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            fallbackToSpeechSynthesis(text, resolve);
          };
          
          await audio.play();
          return;
        } else {
          fallbackToSpeechSynthesis(text, resolve);
        }
      } catch (error) {
        fallbackToSpeechSynthesis(text, resolve);
      }
    });
  };

  const fallbackToSpeechSynthesis = (text: string, resolve: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setAiSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setAiSpeaking(false);
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setAiSpeaking(false);
      resolve();
    }
  };

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const lowerText = text.toLowerCase();
    const negativeWords = ['no', 'not', 'never', 'sad', 'depressed', 'anxious', 'worried', 'bad'];
    const positiveWords = ['yes', 'good', 'great', 'happy', 'fine', 'well', 'better'];
    
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  };

  const updateEmotionFromSentiment = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const emotions = {
      positive: ['happy', 'calm', 'content'],
      neutral: ['neutral', 'thoughtful', 'focused'],
      negative: ['sad', 'anxious', 'worried']
    };
    
    const emotionList = emotions[sentiment];
    const emotion = emotionList[Math.floor(Math.random() * emotionList.length)];
    const confidence = 0.6 + Math.random() * 0.3;
    
    setCurrentEmotion({ emotion, confidence });
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    if (recognitionRef.current) {
      if (newMutedState) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log('Error stopping recognition:', err);
        }
        setIsListening(false);
      }
    }
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
    }
  };

  const handleEndAssessment = () => {
    if (window.confirm('Are you sure you want to end this assessment?')) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log('Error stopping recognition:', err);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      navigate('/dashboard');
    }
  };

  if (isLoading || !permissionsGranted) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 mb-4">
            {!permissionsGranted ? 'Requesting camera and microphone access...' : 'Preparing your assessment...'}
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    // ✅ FIXED LAYOUT - NO PAGE SCROLL, ONLY RIGHT PANEL SCROLLS
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0b0f] relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header - Fixed */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">AI Psychological Interview</h1>
            <p className="text-gray-400 text-sm mt-1">{assessmentTitles[type || 'phq9']}</p>
          </div>
          
          <div className="text-right">
            <p className="text-white font-semibold">Question {currentQuestionIndex + 1} / {totalQuestions}</p>
            <div className="w-40 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - 3 Column Layout - NO SCROLL */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - Fixed, No Scroll */}
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
            <Video className="w-4 h-4" />
            Your Video
          </h3>
          
          {/* Video Container - Fixed Size */}
          <div className="relative w-full h-[240px] flex-shrink-0 bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4">
            {permissionsGranted && streamRef.current ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ display: isVideoOn ? 'block' : 'none' }}
                />
                
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Camera Off</p>
                    </div>
                  </div>
                )}
                
                {isVideoOn && isListening && (
                  <div className="absolute top-3 left-3 z-20">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                      <span className="text-white text-xs font-semibold">Listening</span>
                    </motion.div>
                  </div>
                )}
                
                {isVideoOn && (
                  <div className="absolute bottom-3 right-3 z-20">
                    <div className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-xs">Live</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Waiting for camera...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Emotion Meter - Fixed */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex-shrink-0 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Current Emotion</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-white font-semibold capitalize">{currentEmotion.emotion}</div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentEmotion.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <span className="text-gray-400 text-sm">{Math.round(currentEmotion.confidence * 100)}%</span>
            </div>
          </div>
          
          {/* System Status - Fixed, Scrollable if needed */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
            <div className="text-gray-400 mb-2 font-semibold">System Status:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${permissionsGranted ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Permissions: {permissionsGranted ? 'Granted' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-300">Video: {videoReady ? 'Ready' : 'Loading'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sessionId ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Session: {sessionId ? 'Active' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentQuestion ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-300">Question: {currentQuestion ? `Q${currentQuestionIndex + 1}` : 'Loading'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">Listening: {isListening ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessingAnswer ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">Processing: {isProcessingAnswer ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">AI Speaking: {aiSpeaking ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${canContinue ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">Can Continue: {canContinue ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL - Fixed, No Scroll */}
        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden p-8">
          {/* AI Avatar - Top */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: aiSpeaking ? [1, 1.1, 1] : 1,
                  boxShadow: aiSpeaking 
                    ? [
                        '0 0 40px rgba(139, 92, 246, 0.4)',
                        '0 0 80px rgba(139, 92, 246, 0.6)',
                        '0 0 40px rgba(139, 92, 246, 0.4)'
                      ]
                    : '0 0 40px rgba(139, 92, 246, 0.3)'
                }}
                transition={{
                  duration: 1.5,
                  repeat: aiSpeaking ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="w-64 h-64 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center border-4 border-purple-500/40"
              >
                <Brain className="w-32 h-32 text-purple-400" />
              </motion.div>
              
              {aiSpeaking && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5
                    }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full"
                  />
                </>
              )}
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">Dr. Sarah</h2>
            <p className="text-gray-400">Clinical Psychologist</p>
          </div>

          {/* Question Display - Middle */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="max-w-2xl w-full">
              <AnimatePresence mode="wait">
                {showThinking ? (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 py-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full"
                    />
                    <span className="text-purple-400 text-lg">AI is thinking...</span>
                  </motion.div>
                ) : currentQuestion ? (
                  <motion.div
                    key={`question-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="mb-2 text-purple-400 text-sm font-semibold">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </div>
                    <p className="text-white text-xl leading-relaxed">
                      {currentQuestion.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-question"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-400"
                  >
                    Loading question...
                  </motion.div>
                )}
              </AnimatePresence>
              
              {currentTranscript && !showThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                >
                  <p className="text-blue-300 text-sm italic">"{currentTranscript}"</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Controls - Bottom */}
          <div className="flex-shrink-0 space-y-4">
            {/* Continue Button - Only shows when ready */}
            {canContinue && !isProcessingAnswer && !aiSpeaking && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg"
              >
                Continue to Next Question →
              </motion.button>
            )}
            
            {/* Mic/Video Controls */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' 
                    : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all duration-300 ${
                  !isVideoOn 
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' 
                    : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndAssessment}
                className="p-4 rounded-full bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Status Bar */}
            <div className="text-center text-gray-400 text-sm flex items-center justify-center gap-4 flex-wrap">
              {isMuted && <span className="text-red-400">🔇 Microphone muted</span>}
              {!isVideoOn && <span className="text-red-400">📷 Camera off</span>}
              {showThinking && <span className="text-purple-400">🧠 AI is thinking...</span>}
              {isListening && !showThinking && <span className="text-green-400 animate-pulse">🎤 Listening...</span>}
              {aiSpeaking && <span className="text-purple-400 animate-pulse">🤖 AI Speaking...</span>}
              {isProcessingAnswer && !showThinking && <span className="text-yellow-400">⚙️ Processing...</span>}
              {canContinue && !aiSpeaking && <span className="text-green-400">✅ Ready to continue</span>}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - ONLY THIS SCROLLS */}
        <div className="w-[350px] h-full overflow-hidden border-l border-white/10 bg-black/20 backdrop-blur-xl p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 flex-shrink-0">Live Transcript</h3>
          
          {/* THIS IS THE ONLY SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {transcript.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.speaker === 'ai' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    message.speaker === 'ai'
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-blue-500/20 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      message.speaker === 'ai' ? 'text-purple-300' : 'text-blue-300'
                    }`}>
                      {message.speaker === 'ai' ? 'Dr. Sarah' : 'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{message.text}</p>
                  {message.sentiment && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        message.sentiment === 'positive' ? 'bg-green-400' :
                        message.sentiment === 'negative' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-400 capitalize">{message.sentiment}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInterview;
    // ✅ FIXED LAYOUT - NO PAGE SCROLL, ONLY RIGHT PANEL SCROLLS
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0b0f]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header - Fixed */}
      <div className="flex-shrink-0 relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">AI Psychological Interview</h1>
            <p className="text-gray-400 text-sm mt-1">{assessmentTitles[type || 'phq9']}</p>
          </div>
          
          <div className="text-right">
            <p className="text-white font-semibold">Question {currentQuestionIndex + 1} / {totalQuestions}</p>
            <div className="w-40 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - 3 Column Layout - NO SCROLL */}
      <div className="flex-1 relative z-10 flex overflow-hidden">
        
        {/* LEFT PANEL - Fixed, No Scroll */}
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
            <Video className="w-4 h-4" />
            Your Video
          </h3>
          
          {/* Video Container - Fixed Height */}
          <div className="relative w-full h-[240px] flex-shrink-0 bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4">
            {permissionsGranted && streamRef.current ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ display: isVideoOn ? 'block' : 'none' }}
                />
                
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Camera Off</p>
                    </div>
                  </div>
                )}
                
                {isVideoOn && isListening && (
                  <div className="absolute top-3 left-3 z-20">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center gap-2 shadow-lg"
                    >
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                      <span className="text-white text-xs font-semibold">Listening</span>
                    </motion.div>
                  </div>
                )}
                
                {isVideoOn && (
                  <div className="absolute bottom-3 right-3 z-20">
                    <div className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-xs">Live</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Waiting for camera...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Emotion Meter - Fixed */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex-shrink-0 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Current Emotion</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-white font-semibold capitalize">{currentEmotion.emotion}</div>
                <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentEmotion.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <span className="text-gray-400 text-sm">{Math.round(currentEmotion.confidence * 100)}%</span>
            </div>
          </div>
          
          {/* System Status - Fixed */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs flex-shrink-0">
            <div className="text-gray-400 mb-2 font-semibold">System Status:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${permissionsGranted ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Permissions: {permissionsGranted ? 'Granted' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${videoReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-300">Video: {videoReady ? 'Ready' : 'Loading'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sessionId ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">Session: {sessionId ? 'Active' : 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentQuestion ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-gray-300">Question: {currentQuestion ? `Q${currentQuestionIndex + 1}` : 'Loading'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">Listening: {isListening ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessingAnswer ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">Processing: {isProcessingAnswer ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-300">AI Speaking: {aiSpeaking ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL - Fixed, No Scroll */}
        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden p-8">
          {/* AI Avatar - Top */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: aiSpeaking ? [1, 1.1, 1] : 1,
                  boxShadow: aiSpeaking 
                    ? [
                        '0 0 40px rgba(139, 92, 246, 0.4)',
                        '0 0 80px rgba(139, 92, 246, 0.6)',
                        '0 0 40px rgba(139, 92, 246, 0.4)'
                      ]
                    : '0 0 40px rgba(139, 92, 246, 0.3)'
                }}
                transition={{
                  duration: 1.5,
                  repeat: aiSpeaking ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="w-48 h-48 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center border-4 border-purple-500/40"
              >
                <Brain className="w-24 h-24 text-purple-400" />
              </motion.div>
              
              {aiSpeaking && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5
                    }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full"
                  />
                </>
              )}
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">Dr. Sarah</h2>
            <p className="text-gray-400">Clinical Psychologist</p>
          </div>

          {/* Question Display - Middle */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="max-w-2xl w-full">
              <AnimatePresence mode="wait">
                {showThinking ? (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 py-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full"
                    />
                    <span className="text-purple-400 text-lg">AI is thinking...</span>
                  </motion.div>
                ) : currentQuestion ? (
                  <motion.div
                    key={`question-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="mb-2 text-purple-400 text-sm font-semibold">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </div>
                    <p className="text-white text-xl leading-relaxed">
                      {currentQuestion.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-question"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-400"
                  >
                    Loading question...
                  </motion.div>
                )}
              </AnimatePresence>
              
              {currentTranscript && !showThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                >
                  <p className="text-blue-300 text-sm italic">"{currentTranscript}"</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Controls - Bottom */}
          <div className="flex-shrink-0 space-y-4">
            {/* Continue Button - Only shows when ready */}
            {canContinue && !isProcessingAnswer && !aiSpeaking && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg"
              >
                Continue to Next Question →
              </motion.button>
            )}
            
            {/* Mic/Video Controls */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' 
                    : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all duration-300 ${
                  !isVideoOn 
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50' 
                    : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndAssessment}
                className="p-4 rounded-full bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Status Bar */}
            <div className="text-center text-gray-400 text-sm flex items-center justify-center gap-4 flex-wrap">
              {isMuted && <span className="text-red-400">🔇 Microphone muted</span>}
              {!isVideoOn && <span className="text-red-400">📷 Camera off</span>}
              {showThinking && <span className="text-purple-400">🧠 AI is thinking...</span>}
              {isListening && !showThinking && <span className="text-green-400 animate-pulse">🎤 Listening...</span>}
              {aiSpeaking && <span className="text-purple-400 animate-pulse">🤖 AI Speaking...</span>}
              {isProcessingAnswer && !showThinking && <span className="text-yellow-400">⚙️ Processing...</span>}
              {canContinue && !aiSpeaking && <span className="text-blue-400">✅ Ready to continue</span>}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - ONLY THIS SCROLLS */}
        <div className="w-[350px] h-full overflow-hidden border-l border-white/10 bg-black/20 backdrop-blur-xl p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 flex-shrink-0">Live Transcript</h3>
          
          {/* THIS IS THE ONLY SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {transcript.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.speaker === 'ai' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    message.speaker === 'ai'
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-blue-500/20 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      message.speaker === 'ai' ? 'text-purple-300' : 'text-blue-300'
                    }`}>
                      {message.speaker === 'ai' ? 'Dr. Sarah' : 'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{message.text}</p>
                  {message.sentiment && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        message.sentiment === 'positive' ? 'bg-green-400' :
                        message.sentiment === 'negative' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-400 capitalize">{message.sentiment}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInterview;
