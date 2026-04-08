import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download, 
  AlertTriangle, 
  FileText, 
  Calendar,
  User,
  Activity,
  Brain,
  TrendingUp,
  Shield
} from "lucide-react";

interface QuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  score: number;
  maxScore: number;
}

interface ClinicalReportData {
  patientId: string;
  patientName: string;
  assessmentType: 'phq9' | 'gad7';
  sessionId: string;
  completedAt: Date;
  totalScore: number;
  maxScore: number;
  severityLevel: string;
  riskLevel: string;
  questionBreakdown: QuestionResult[];
  riskIndicators: string[];
  conversationSummary: string;
  recommendedAction: string;
  highRisk: boolean;
  crisisDetected: boolean;
}

const ClinicalReport = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ClinicalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/clinical-reports/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
      } else {
        setError('Report not found');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    
    try {
      const response = await fetch(`${API}/api/clinical-reports/${sessionId}?format=pdf`);
      const reportText = await response.text();
      
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-report-${report.patientName.replace(/\s+/g, '-')}-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  const getRiskColor = (riskLevel: string, highRisk: boolean) => {
    if (highRisk) return 'text-red-400 bg-red-500/10 border-red-500/30';
    
    switch (riskLevel.toLowerCase()) {
      case 'severe':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
      case 'moderately_severe':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'mild':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'minimal':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 75) return 'text-red-400';
    if (percentage >= 50) return 'text-orange-400';
    if (percentage >= 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading clinical report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-xl mb-2">{error || 'Report not found'}</p>
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doctor-dashboard')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Clinical Assessment Report</h1>
              <p className="text-gray-400 mt-1">Session ID: {sessionId}</p>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Patient Info & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Patient Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Patient Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-medium">{report.patientName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Assessment Type</p>
                <p className="text-white font-medium">
                  {report.assessmentType.toUpperCase()} {report.assessmentType === 'phq9' ? 'Depression Screening' : 'Anxiety Assessment'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-white font-medium">
                  {new Date(report.completedAt).toLocaleDateString()} at {new Date(report.completedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Score Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Assessment Score</h3>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(report.totalScore, report.maxScore)}`}>
                {report.totalScore}
              </div>
              <div className="text-gray-400 text-sm mb-4">out of {report.maxScore}</div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getRiskColor(report.riskLevel, report.highRisk)}`}>
                {report.severityLevel}
              </div>
            </div>
          </motion.div>

          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold">Risk Assessment</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Risk Level</p>
                <p className={`font-medium ${report.highRisk ? 'text-red-400' : 'text-green-400'}`}>
                  {report.highRisk ? 'HIGH RISK' : 'Standard Risk'}
                </p>
              </div>
              {report.crisisDetected && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Crisis Detected</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">Question Breakdown</h3>
          </div>
          
          <div className="space-y-4">
            {report.questionBreakdown.map((question, index) => (
              <div key={question.questionId} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-2">
                      Q{question.questionId}: {question.questionText}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Answer: <span className="text-white">{question.userAnswer}</span>
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${getScoreColor(question.score, question.maxScore)}`}>
                      {question.score}/{question.maxScore}
                    </div>
                  </div>
                </div>
                
                {/* Score visualization */}
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      question.score === 0 ? 'bg-green-500' :
                      question.score === 1 ? 'bg-yellow-500' :
                      question.score === 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(question.score / question.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold">Risk Indicators</h3>
          </div>
          
          {report.riskIndicators.length > 0 ? (
            <div className="space-y-3">
              {report.riskIndicators.map((indicator, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    indicator.includes('SUICIDAL') ? 'bg-red-400' :
                    indicator.includes('Persistent') ? 'bg-orange-400' : 'bg-yellow-400'
                  }`} />
                  <p className={`text-sm ${
                    indicator.includes('SUICIDAL') ? 'text-red-400 font-medium' : 'text-gray-300'
                  }`}>
                    {indicator}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No significant risk indicators identified</p>
          )}
        </motion.div>

        {/* Clinical Summary & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold">AI Conversation Summary</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{report.conversationSummary}</p>
          </motion.div>

          {/* Recommended Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Recommended Action</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{report.recommendedAction}</p>
          </motion.div>
        </div>

        {/* Clinical Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-medium mb-2">Clinical Disclaimer</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                This report was generated by NeuroScan AI Mental Health Triage Platform. 
                This system provides screening and triage only. All cases require clinical validation 
                and interpretation by licensed healthcare professionals. This report should not be 
                used as a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClinicalReport;
