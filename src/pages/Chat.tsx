import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, AlertCircle } from 'lucide-react';
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CrisisResources {
  hotline: string;
  emergency: string;
  text: string;
  international: string;
}

const Chat = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<string>('conversation');
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisResources, setCrisisResources] = useState<CrisisResources | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const API_BASE = `${API}/api`;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'en' })
        });

        const data = await response.json();
        setSessionId(data.sessionId);
        setMessages([{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
        setPhase(data.phase);
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    };

    initSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Navigate to report when processing is complete
  useEffect(() => {
    if (phase === 'processing') {
      setTimeout(() => {
        navigate(`/report/${sessionId}`);
      }, 3000);
    }
  }, [phase, sessionId, navigate]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: input })
      });

      const data = await response.json();

      if (data.crisis) {
        setCrisisDetected(true);
        setCrisisResources(data.resources);
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPhase(data.phase);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-semibold text-text-bright">NeuroScan AI</h1>
          <p className="text-sm text-text-dim mt-1">
            {phase === 'conversation' && 'Initial Conversation'}
            {phase === 'phq9' && 'Depression Screening (PHQ-9)'}
            {phase === 'gad7' && 'Anxiety Screening (GAD-7)'}
            {phase === 'processing' && 'Generating Report...'}
          </p>
        </div>
      </header>

      {/* Crisis Alert */}
      <AnimatePresence>
        {crisisDetected && crisisResources && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/20 border-l-4 border-red-500 p-6 mx-6 mt-4"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Immediate Support Available
                </h3>
                <p className="text-text-dim mb-4">
                  Your safety is our priority. Please reach out to these resources:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-text-bright">Crisis Hotline:</strong> {crisisResources.hotline}</p>
                  <p><strong className="text-text-bright">Emergency:</strong> {crisisResources.emergency}</p>
                  <p><strong className="text-text-bright">Text Support:</strong> {crisisResources.text}</p>
                </div>
                <button
                  onClick={() => setCrisisDetected(false)}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  I Acknowledge
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="container mx-auto max-w-3xl space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-glow-indigo/20 text-text-bright ml-auto'
                      : 'bg-surface text-text-dim'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-surface rounded-lg px-4 py-3">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={phase === 'processing'}
              className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-text-bright placeholder-text-dim focus:outline-none focus:border-glow-indigo/50 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || phase === 'processing'}
              className="px-6 py-3 bg-glow-indigo/20 hover:bg-glow-indigo/30 text-text-bright rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
            <button
              className="px-6 py-3 bg-surface hover:bg-surface/80 text-text-dim rounded-lg transition-colors"
              title="Voice input (coming soon)"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-text-dim mt-2 text-center">
            This is an AI screening tool and does not replace professional medical diagnosis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
