import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
  AlertTriangle, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  Download,
  Eye,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";

interface PatientReport {
  patientName: string;
  assessmentType: string;
  score: string;
  riskLevel: string;
  completedAt: string;
  highRisk: boolean;
  sessionId: string;
}

interface DashboardSummary {
  totalAssessments: number;
  highRiskCases: number;
  recentAssessments: number;
}

const DoctorDashboard = () => {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({ totalAssessments: 0, highRiskCases: 0, recentAssessments: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/clinical-reports/dashboard/summary');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  const getRiskIcon = (highRisk: boolean) => {
    return highRisk ? (
      <AlertTriangle className="w-4 h-4 text-red-400" />
    ) : null;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === 'all' || 
      (filterRisk === 'high' && report.highRisk) ||
      (filterRisk === 'low' && !report.highRisk);
    
    return matchesSearch && matchesFilter;
  });

  const handleViewReport = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clinical-reports/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        // For now, just show an alert with the report data
        // In a real app, you'd open a modal or navigate to a detailed view
        alert(`Clinical Report for Session ${sessionId}\n\nScore: ${data.report.totalScore}/${data.report.maxScore}\nSeverity: ${data.report.severityLevel}\n\nThis would open a detailed clinical report view.`);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error loading clinical report');
    }
  };

  const handleDownloadReport = async (sessionId: string, patientName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clinical-reports/${sessionId}?format=pdf`);
      const reportText = await response.text();
      
      // Create and download file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-report-${patientName.replace(/\s+/g, '-')}-${sessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
            <p className="text-gray-400 mt-1">Mental Health Triage Platform</p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Assessments</p>
                <p className="text-2xl font-bold text-white">{summary.totalAssessments}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">High Risk Cases</p>
                <p className="text-2xl font-bold text-red-400">{summary.highRiskCases}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Recent (Today)</p>
                <p className="text-2xl font-bold text-green-400">{summary.recentAssessments}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk Only</option>
                  <option value="low">Low Risk Only</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-black/50 border border-white/20 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white placeholder-gray-400 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Patient Reports Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Patient Assessment Reports
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Patient</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Assessment</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Score</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Risk Level</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.sessionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getRiskIcon(report.highRisk)}
                        <span className="text-white font-medium">{report.patientName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{report.assessmentType}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-mono">{report.score}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(report.riskLevel, report.highRisk)}`}>
                        {report.riskLevel.charAt(0).toUpperCase() + report.riskLevel.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{report.completedAt}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReport(report.sessionId)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.sessionId, report.patientName)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReports.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No assessment reports found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || filterRisk !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Assessment reports will appear here once patients complete their evaluations'
                }
              </p>
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Clinical Notes</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">High Risk Cases</p>
                <p className="text-gray-400">PHQ-9 Q9 score ≥ 1 indicates suicidal ideation. Immediate clinical attention required.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-orange-400 font-medium">Moderate-Severe Cases</p>
                <p className="text-gray-400">Recommend prompt referral to mental health specialist for comprehensive evaluation.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-blue-400 font-medium">Triage Platform</p>
                <p className="text-gray-400">This system provides screening and triage. All cases require clinical validation by licensed professionals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
