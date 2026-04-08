import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Heart, Activity, Sparkles, Clock, ArrowLeft } from "lucide-react";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";

interface AssessmentCard {
  id: string;
  type: 'phq9' | 'gad7' | 'stress' | 'general';
  title: string;
  description: string;
  duration: string;
  icon: any;
  color: string;
}

const AssessmentStart = () => {
  const navigate = useNavigate();

  const assessments: AssessmentCard[] = [
    {
      id: '1',
      type: 'phq9',
      title: 'PHQ-9 Depression Screening',
      description: 'Measures severity of depression symptoms over the past two weeks',
      duration: '~3 minutes',
      icon: Brain,
      color: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      id: '2',
      type: 'gad7',
      title: 'GAD-7 Anxiety Test',
      description: 'Evaluates anxiety symptoms and worry patterns',
      duration: '~3 minutes',
      icon: Heart,
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: '3',
      type: 'stress',
      title: 'Stress Level Assessment',
      description: 'Evaluate your current stress levels and coping mechanisms',
      duration: '~4 minutes',
      icon: Activity,
      color: 'from-orange-500/20 to-red-500/20'
    },
    {
      id: '4',
      type: 'general',
      title: 'General Mental Wellness Check',
      description: 'Comprehensive overview of your psychological health and well-being',
      duration: '~5 minutes',
      icon: Sparkles,
      color: 'from-green-500/20 to-teal-500/20'
    }
  ];

  const handleStartAssessment = (type: string) => {
    navigate(`/assessment/interview/${type}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </motion.button>

        {/* Dynamic Island Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative -mt-4 mb-12"
        >
          {/* Floating Dynamic Island Container */}
          <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ duration: 0.3 }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-60" />
            
            {/* Main Island */}
            <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden">
              {/* Animated background gradient */}
              <motion.div
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-purple-500/5 opacity-50"
                style={{ backgroundSize: '200% 200%' }}
              />
              
              {/* Content */}
              <div className="relative text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-5xl font-bold text-white mb-3"
                >
                  Choose an Assessment
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-gray-400 text-lg"
                >
                  Select a test to begin your AI-guided psychological evaluation
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Assessment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {assessments.map((assessment, index) => {
            const Icon = assessment.icon;
            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group cursor-pointer"
              >
                {/* Card glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${assessment.color} rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                
                {/* Card content */}
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 group-hover:border-white/20 transition-all duration-300 shadow-xl">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${assessment.color} rounded-2xl mb-5 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {assessment.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                    {assessment.description}
                  </p>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                    <Clock className="w-4 h-4" />
                    <span>{assessment.duration}</span>
                  </div>

                  {/* Start Button */}
                  <motion.button
                    onClick={() => handleStartAssessment(assessment.type)}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
                  >
                    Start Test
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              What to Expect
            </h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold mt-0.5">1</span>
                <span>You'll be guided through a series of questions by our AI psychologist</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold mt-0.5">2</span>
                <span>Answer honestly based on how you've been feeling recently</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold mt-0.5">3</span>
                <span>Your responses are confidential and encrypted</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold mt-0.5">4</span>
                <span>You'll receive a detailed report with personalized insights</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentStart;
