import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  User,
  Activity,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import CircularAssessmentViz from "@/components/CircularAssessmentViz";

interface User {
  id: string;
  full_name: string;
  email: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleStartAssessment = () => {
    navigate("/assessment/start");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-glow-indigo/30 border-t-glow-indigo rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "assessments", label: "Assessments", icon: Brain },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    {
      label: "Assessments",
      value: "3",
      change: "+2 this month",
      icon: Brain,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      label: "Mood Score",
      value: "7.2",
      change: "+0.5 improvement",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      label: "Active Days",
      value: "12",
      change: "Current streak",
      icon: Activity,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      label: "Next Session",
      value: "3 days",
      change: "Dr. Sarah Johnson",
      icon: Clock,
      color: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
  ];

  const recentAssessments = [
    {
      id: 1,
      type: "PHQ-9 Depression Screening",
      date: "2 days ago",
      score: 8,
      maxScore: 27,
      classification: "Mild",
      status: "completed",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      id: 2,
      type: "GAD-7 Anxiety Assessment",
      date: "1 week ago",
      score: 12,
      maxScore: 21,
      classification: "Moderate",
      status: "completed",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      id: 3,
      type: "General Wellness Check",
      date: "2 weeks ago",
      score: 85,
      maxScore: 100,
      classification: "Good",
      status: "completed",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0f] relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-64 min-h-screen bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col"
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                    "0 0 30px rgba(139, 92, 246, 0.5)",
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center"
              >
                <Brain className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <span className="text-white font-semibold text-lg">NeuroScan</span>
                <p className="text-xs text-gray-400">AI Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <motion.button
                      onClick={() => setActiveTab(item.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-purple-400" : ""}`} />
                      <span className="relative z-10 font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 relative z-10"
                        />
                      )}
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full flex items-center justify-center border border-purple-500/30">
                <User className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{user.full_name}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-400 transition-colors duration-300 rounded-lg hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black/20 backdrop-blur-xl border-b border-white/5 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back, {user.full_name.split(" ")[0]} 👋
                </h1>
                <p className="text-gray-400">
                  Track your mental health journey and insights
                </p>
              </div>
              
              {/* Start Assessment CTA */}
              <motion.button
                onClick={handleStartAssessment}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white font-medium">
                  <Sparkles className="w-5 h-5" />
                  Start Assessment
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </div>
          </motion.header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-auto">
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="relative group"
                      >
                        {/* Glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                        
                        {/* Card */}
                        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                              <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="text-3xl font-bold text-white"
                            >
                              {stat.value}
                            </motion.div>
                          </div>
                          <h3 className="text-gray-400 text-sm font-medium mb-1">
                            {stat.label}
                          </h3>
                          <p className="text-gray-500 text-xs">{stat.change}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mental Health Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mt-8"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className="text-2xl font-semibold text-white mb-1">Mental Health Journey</h2>
                      <p className="text-gray-400 text-sm">Your assessment timeline and insights</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("assessments")}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      View Full History
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Circular Insight Cluster */}
                  <CircularAssessmentViz assessments={recentAssessments} />
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="mt-8"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Schedule Appointment */}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                          <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-white font-medium mb-2">Schedule Appointment</h3>
                        <p className="text-gray-400 text-sm">Book a session with a therapist</p>
                      </div>
                    </motion.div>

                    {/* View Reports */}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => setActiveTab("reports")}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all duration-300">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-white font-medium mb-2">View Reports</h3>
                        <p className="text-gray-400 text-sm">Access your assessment history</p>
                      </div>
                    </motion.div>

                    {/* Resources */}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                          <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-white font-medium mb-2">Mental Health Resources</h3>
                        <p className="text-gray-400 text-sm">Explore helpful articles and tools</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Other tabs content */}
            {activeTab !== "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center min-h-[400px]"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Coming Soon</h3>
                  <p className="text-gray-400">
                    The {activeTab} section is under development
                  </p>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
