import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, AlertTriangle } from 'lucide-react';

interface ReportData {
  sessionId: string;
  phq9Score: number;
  phq9Classification: string;
  gad7Score: number;
  gad7Classification: string;
  keyObservations: string[];
  suggestions: string[];
  timestamp: Date;
  crisisDetected: boolean;
}

const Report = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:3001/api';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE}/report/${sessionId}`);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'minimal':
        return 'text-green-400';
      case 'mild':
        return 'text-yellow-400';
      case 'moderate':
        return 'text-orange-400';
      case 'moderately_severe':
      case 'severe':
        return 'text-red-400';
      default:
        return 'text-text-dim';
    }
  };

  const getScorePercentage = (score: number, max: number) => {
    return (score / max) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-glow-indigo/30 border-t-glow-indigo rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim">Generating your report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-dim">Report not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-glow-indigo/20 text-text-bright rounded hover:bg-glow-indigo/30 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-bright">Mental Health Screening Report</h1>
            <p className="text-sm text-text-dim mt-1">
              Generated on {new Date(report.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-surface text-text-dim rounded hover:bg-surface/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-glow-indigo/20 text-text-bright rounded hover:bg-glow-indigo/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Crisis Warning */}
        {report.crisisDetected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border-l-4 border-red-500 p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Immediate Professional Support Recommended
                </h3>
                <p className="text-text-dim">
                  Based on your responses, we strongly recommend speaking with a mental health professional as soon as possible.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Risk Scores */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Depression Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-text-bright mb-4">Depression Assessment (PHQ-9)</h2>
            <div className="mb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-text-bright">{report.phq9Score}</span>
                <span className="text-text-dim">/ 27</span>
              </div>
              <p className={`text-sm font-medium ${getClassificationColor(report.phq9Classification)}`}>
                {report.phq9Classification.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="w-full bg-surface-dark rounded-full h-2">
              <div
                className="bg-gradient-to-r from-glow-indigo to-glow-purple h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getScorePercentage(report.phq9Score, 27)}%` }}
              />
            </div>
          </motion.div>

          {/* Anxiety Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-text-bright mb-4">Anxiety Assessment (GAD-7)</h2>
            <div className="mb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-text-bright">{report.gad7Score}</span>
                <span className="text-text-dim">/ 21</span>
              </div>
              <p className={`text-sm font-medium ${getClassificationColor(report.gad7Classification)}`}>
                {report.gad7Classification.toUpperCase()}
              </p>
            </div>
            <div className="w-full bg-surface-dark rounded-full h-2">
              <div
                className="bg-gradient-to-r from-glow-purple to-glow-indigo h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getScorePercentage(report.gad7Score, 21)}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Key Observations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-text-bright mb-4">Key Observations</h2>
          <ul className="space-y-3">
            {report.keyObservations.map((observation, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-glow-indigo mt-2 flex-shrink-0" />
                <span className="text-text-dim">{observation}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface border border-border rounded-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-text-bright mb-4">Recommendations</h2>
          <ul className="space-y-3">
            {report.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-glow-purple mt-2 flex-shrink-0" />
                <span className="text-text-dim">{suggestion}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-dark border border-border rounded-lg p-6 text-sm text-text-dim"
        >
          <p className="font-semibold text-text-bright mb-2">Important Disclaimer</p>
          <p>
            This screening tool is designed to provide early detection of potential mental health concerns. 
            It is NOT a clinical diagnosis and should not replace professional medical advice, diagnosis, or treatment. 
            If you're experiencing mental health difficulties, please consult with a qualified healthcare provider or mental health professional.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;
