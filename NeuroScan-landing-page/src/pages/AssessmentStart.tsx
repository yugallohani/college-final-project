import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Heart, Activity, Sparkles, Clock, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-text-dim hover:text-text-bright transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-semibold text-text-bright mb-2">
              Choose an Assessment
            </h1>
            <p className="text-text-dim">
              Select a test to begin your AI-guided psychological evaluation
            </p>
          </motion.div>
        </div>
      </div>

      {/* Assessment Cards Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {assessments.map((assessment, index) => {
            const Icon = assessment.icon;
            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Card glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${assessment.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Card content */}
                <div className="relative bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-border/80 transition-all duration-300">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${assessment.color} rounded-xl mb-4`}>
                    <Icon className="w-7 h-7 text-text-bright" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-text-bright mb-2">
                    {assessment.title}
                  </h3>

                  {/* Description */}
                  <p className="text-text-dim text-sm mb-4 leading-relaxed">
                    {assessment.description}
                  </p>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-text-dim text-sm mb-6">
                    <Clock className="w-4 h-4" />
                    <span>{assessment.duration}</span>
                  </div>

                  {/* Start Button */}
                  <motion.button
                    onClick={() => handleStartAssessment(assessment.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 bg-glow-purple hover:bg-glow-purple/90 text-white font-medium rounded-xl transition-all duration-300 shadow-lg"
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
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="bg-surface/30 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-bright mb-3">
              What to Expect
            </h3>
            <ul className="space-y-2 text-text-dim text-sm">
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>You'll be guided through a series of questions by our AI psychologist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>Answer honestly based on how you've been feeling recently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>Your responses are confidential and encrypted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
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
