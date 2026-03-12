import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, X, Brain } from "lucide-react";

interface Question {
  questionId: number;
  text: string;
  options: string[];
}

interface AssessmentInfo {
  title: string;
  totalQuestions: number;
}

const AssessmentInterview = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(9);
  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  // Assessment type mapping
  const assessmentTitles: Record<string, string> = {
    phq9: 'PHQ-9 Depression Screening',
    gad7: 'GAD-7 Anxiety Assessment',
    stress: 'Stress Level Assessment',
    general: 'General Mental Wellness Check'
  };

  useEffect(() => {
    initializeAssessment();
  }, [type]);

  const initializeAssessment = async () => {
    try {
      setIsLoading(true);
      
      // Create a new session
      const sessionResponse = await fetch('http://localhost:3001/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.sessionId);

      // Get questions for this assessment type
      const questionsResponse = await fetch(`http://localhost:3001/api/assessment/questions/${type}`);
      const questionsData = await questionsResponse.json();
      
      setTotalQuestions(questionsData.questions.length);
      setAssessmentInfo({
        title: assessmentTitles[type || 'phq9'],
        totalQuestions: questionsData.questions.length
      });

      // Load first question with typing animation
      setShowTyping(true);
      setTimeout(() => {
        setCurrentQuestion(questionsData.questions[0]);
        setShowTyping(false);
      }, 1500);

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing assessment:', error);
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answerValue: number) => {
    if (isAnswering || !currentQuestion) return;

    try {
      setIsAnswering(true);

      // Save the answer
      await fetch('http://localhost:3001/api/assessment/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.questionId,
          answerValue,
          assessmentType: type
        })
      });

      // Check if this was the last question
      if (questionNumber >= totalQuestions) {
        // Complete the assessment
        await fetch('http://localhost:3001/api/assessment/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        // Navigate to results
        navigate(`/assessment/results/${sessionId}`);
        return;
      }

      // Load next question with typing animation
      setShowTyping(true);
      setTimeout(async () => {
        const questionsResponse = await fetch(`http://localhost:3001/api/assessment/questions/${type}`);
        const questionsData = await questionsResponse.json();
        
        setCurrentQuestion(questionsData.questions[questionNumber]);
        setQuestionNumber(questionNumber + 1);
        setShowTyping(false);
        setIsAnswering(false);
      }, 1000);

    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsAnswering(false);
    }
  };

  const handleEndAssessment = () => {
    if (window.confirm('Are you sure you want to end this assessment? Your progress will be lost.')) {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-glow-purple/30 border-t-glow-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-bright">
              AI Psychological Interview
            </h1>
            <p className="text-text-dim text-sm mt-1">
              {assessmentInfo?.title}
            </p>
          </div>
          
          {/* Progress */}
          <div className="text-right">
            <p className="text-text-bright font-medium">
              Question {questionNumber} / {totalQuestions}
            </p>
            <div className="w-32 h-2 bg-surface rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-glow-purple to-glow-indigo"
                initial={{ width: 0 }}
                animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - AI Avatar */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center"
            >
              {/* AI Avatar */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: showTyping ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: showTyping ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 bg-gradient-to-br from-glow-purple/20 to-glow-indigo/20 rounded-full flex items-center justify-center border-4 border-glow-purple/30"
                >
                  <Brain className="w-24 h-24 text-glow-purple" />
                </motion.div>
                
                {/* Pulse effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-glow-purple/20 rounded-full"
                />
              </div>

              {/* AI Name */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-text-bright font-medium text-lg"
              >
                Dr. NeuroScan AI
              </motion.p>
              <p className="text-text-dim text-sm">Clinical Psychologist</p>
            </motion.div>

            {/* Right Side - Question & Answers */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              {/* Speech Bubble */}
              <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 mb-6 relative">
                {/* Triangle pointer */}
                <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-border" />
                
                <AnimatePresence mode="wait">
                  {showTyping ? (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-glow-purple rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-glow-purple rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-glow-purple rounded-full"
                        />
                      </div>
                      <span className="text-text-dim text-sm">AI is thinking...</span>
                    </motion.div>
                  ) : currentQuestion ? (
                    <motion.div
                      key={currentQuestion.questionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-text-bright text-lg leading-relaxed">
                        {currentQuestion.text}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {!showTyping && currentQuestion && currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={`${currentQuestion.questionId}-${index}`}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => handleAnswer(index)}
                      disabled={isAnswering}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 bg-surface/50 backdrop-blur-sm border border-border rounded-xl text-text-bright hover:border-glow-purple/50 hover:bg-surface/70 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {option}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Controls (Video Call Style) */}
      <div className="border-t border-border bg-surface/30 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors duration-300 ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-surface border border-border text-text-bright hover:bg-surface/70'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* Video Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full transition-colors duration-300 ${
              !isVideoOn 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-surface border border-border text-text-bright hover:bg-surface/70'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          {/* End Assessment Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndAssessment}
            className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-center text-text-dim text-xs mt-3">
          {isMuted && 'Microphone muted • '}
          {!isVideoOn && 'Camera off • '}
          Session in progress
        </p>
      </div>
    </div>
  );
};

export default AssessmentInterview;
