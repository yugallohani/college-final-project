import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Info, ArrowRight, Download, FileText, Eye } from "lucide-react";

interface AssessmentResult {
  score: number;
  classification: string;
  assessmentType: string;
  explanation: string;
  suggestions: string[];
}

const AssessmentResults = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicalReport, setClinicalReport] = useState<any>(null);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/assessment/results/${sessionId}`);
      const data = await response.json();
      setResults(data);
      
      // Also try to fetch clinical report if available
      try {
        const reportResponse = await fetch(`http://localhost:3001/api/clinical-reports/${sessionId}`);
        const reportData = await reportResponse.json();
        if (reportData.success) {
          setClinicalReport(reportData.report);
        }
      } catch (reportError) {
        console.log('Clinical report not available yet');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setIsLoading(false);
    }
  };

  const handleDownloadClinicalReport = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/clinical-reports/${sessionId}?format=pdf`);
      const reportText = await response.text();
      
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-report-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading clinical report:', error);
      alert('Clinical report not available yet. Please try again later.');
    }
  };

  const handleViewClinicalReport = () => {
    navigate(`/clinical-report/${sessionId}`);
  };

  const getClassificationColor = (classification: string) => {
    const colors: Record<string, string> = {
      'minimal': 'text-green-400',
      'mild': 'text-yellow-400',
      'moderate': 'text-orange-400',
      'moderately_severe': 'text-red-400',
      'severe': 'text-red-500'
    };
    return colors[classification.toLowerCase()] || 'text-text-bright';
  };

  const getClassificationIcon = (classification: string) => {
    if (classification.toLowerCase() === 'minimal') {
      return <CheckCircle className="w-16 h-16 text-green-400" />;
    } else if (classification.toLowerCase() === 'mild') {
      return <Info className="w-16 h-16 text-yellow-400" />;
    } else {
      return <AlertCircle className="w-16 h-16 text-orange-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-glow-purple/30 border-t-glow-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-dim">No results found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-glow-purple hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          {/* Results Card */}
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-8 mb-6">
            {/* Icon and Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-block mb-4"
              >
                {getClassificationIcon(results.classification)}
              </motion.div>
              
              <h1 className="text-3xl font-semibold text-text-bright mb-2">
                Assessment Complete
              </h1>
              <p className="text-text-dim">
                {results.assessmentType}
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-background/50 rounded-xl p-6 mb-6 text-center">
              <p className="text-text-dim text-sm mb-2">Your Score</p>
              <p className="text-5xl font-bold text-text-bright mb-2">
                {results.score}
              </p>
              <p className={`text-xl font-semibold ${getClassificationColor(results.classification)}`}>
                {results.classification.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            {/* Explanation */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-bright mb-3">
                What This Means
              </h3>
              <p className="text-text-dim leading-relaxed">
                {results.explanation}
              </p>
            </div>

            {/* Suggestions */}
            {results.suggestions && results.suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-bright mb-3">
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {results.suggestions.map((suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-3 text-text-dim"
                    >
                      <ArrowRight className="w-5 h-5 text-glow-purple mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                <strong>Important:</strong> This screening is not a clinical diagnosis. 
                If you're experiencing significant distress, please consult with a mental health professional.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 px-6 bg-glow-purple hover:bg-glow-purple/90 text-white font-medium rounded-xl transition-all duration-300"
              >
                View Dashboard
              </motion.button>
              
              {clinicalReport ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewClinicalReport}
                    className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Clinical Report
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadClinicalReport}
                    className="flex-1 py-3 px-6 bg-surface border border-border hover:bg-surface/70 text-text-bright font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadClinicalReport}
                  className="flex-1 py-3 px-6 bg-surface border border-border hover:bg-surface/70 text-text-bright font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </motion.button>
              )}
            </div>

            {/* Clinical Report Info */}
            {clinicalReport && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-400 font-medium mb-1">Clinical Report Available</p>
                    <p className="text-blue-300 text-sm">
                      A structured clinical report has been generated for healthcare professionals. 
                      This includes detailed scoring, risk assessment, and clinical recommendations.
                    </p>
                    <div className="mt-2 text-xs text-blue-300/80">
                      Score: {clinicalReport.totalScore}/{clinicalReport.maxScore} • 
                      Risk Level: {clinicalReport.riskLevel} • 
                      {clinicalReport.highRisk && <span className="text-red-400 font-medium">HIGH RISK</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-surface/30 backdrop-blur-sm border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-text-bright mb-3">
              What's Next?
            </h3>
            <ul className="space-y-2 text-text-dim text-sm">
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>Your results have been saved to your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>You can take another assessment anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-glow-purple mt-1">•</span>
                <span>Consider scheduling a follow-up assessment in 2-4 weeks</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentResults;
