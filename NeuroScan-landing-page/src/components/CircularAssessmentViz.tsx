import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface Assessment {
  id: number;
  type: string;
  date: string;
  score: number;
  maxScore: number;
  classification: string;
  status: string;
  color: string;
  bgColor: string;
}

interface CircularAssessmentVizProps {
  assessments: Assessment[];
}

const CircularAssessmentViz = ({ assessments }: CircularAssessmentVizProps) => {
  // Map assessments to specific types
  const depression = assessments.find(a => a.type.includes("Depression"));
  const anxiety = assessments.find(a => a.type.includes("Anxiety"));
  const wellness = assessments.find(a => a.type.includes("Wellness"));

  return (
    <div className="relative w-full max-w-3xl mx-auto py-12">
      {/* Orbital Connection Rings - SVG Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          {/* Gradient for orbital paths */}
          <linearGradient id="orbitalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.15)" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.1)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
          </linearGradient>
        </defs>
        
        {/* Large orbital ring connecting all three */}
        <motion.ellipse
          cx="50%"
          cy="50%"
          rx="45%"
          ry="42%"
          fill="none"
          stroke="url(#orbitalGradient)"
          strokeWidth="1"
          strokeDasharray="4,8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        
        {/* Inner connecting paths */}
        <motion.path
          d="M 35% 38% Q 50% 35% 65% 38%"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="1"
          strokeDasharray="3,6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        
        <motion.path
          d="M 35% 42% L 50% 62%"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="1"
          strokeDasharray="3,6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
        
        <motion.path
          d="M 65% 42% L 50% 62%"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="1"
          strokeDasharray="3,6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 1.4 }}
        />

        {/* Small glowing particles */}
        <motion.circle
          cx="50%"
          cy="30%"
          r="2"
          fill="rgba(139, 92, 246, 0.4)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.6] }}
          transition={{ duration: 1, delay: 1.8 }}
        />
        <motion.circle
          cx="42%"
          cy="50%"
          r="2"
          fill="rgba(234, 179, 8, 0.4)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.6] }}
          transition={{ duration: 1, delay: 2 }}
        />
        <motion.circle
          cx="58%"
          cy="50%"
          r="2"
          fill="rgba(239, 68, 68, 0.4)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.6] }}
          transition={{ duration: 1, delay: 2.2 }}
        />
      </svg>

      {/* Compact Triangular Cluster */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Top Row - Depression (Left) and Anxiety (Right) - Closer Together */}
        <div className="flex justify-center items-start gap-16 mb-12">
          {/* Depression Assessment - Left - Smaller Size */}
          {depression && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, type: "spring" }}
              className="flex flex-col items-center"
            >
              {/* Circular Progress Ring - Reduced Size */}
              <div className="relative group cursor-pointer">
                {/* Outer Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 blur-xl"
                />

                {/* Main Circle - Smaller */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG Progress Ring */}
                  <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="rgba(234, 179, 8, 0.08)"
                      strokeWidth="6"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="url(#depressionGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: depression.score / depression.maxScore }}
                      transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                      style={{
                        strokeDasharray: 364.42,
                        strokeDashoffset: 0,
                      }}
                    />
                    <defs>
                      <linearGradient id="depressionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.5, type: "spring" }}
                      className="text-4xl font-bold text-yellow-400 mb-0.5"
                    >
                      {depression.score}
                    </motion.div>
                    <div className="text-gray-400 text-sm">/{depression.maxScore}</div>
                  </div>

                  {/* Trend Icon - Smaller */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 1.7, type: "spring" }}
                    className="absolute top-2 right-2 w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                  </motion.div>
                </div>
              </div>

              {/* Assessment Info - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-4 text-center"
              >
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">Mild Depression</h3>
                <p className="text-gray-400 text-xs mb-0.5">{depression.type}</p>
                <p className="text-gray-500 text-xs">{depression.date}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                  <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">{depression.classification}</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Anxiety Assessment - Right - Smaller Size */}
          {anxiety && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, type: "spring" }}
              className="flex flex-col items-center"
            >
              {/* Circular Progress Ring - Reduced Size */}
              <div className="relative group cursor-pointer">
                {/* Outer Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 blur-xl"
                />

                {/* Main Circle - Smaller */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG Progress Ring */}
                  <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="rgba(239, 68, 68, 0.08)"
                      strokeWidth="6"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="url(#anxietyGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: anxiety.score / anxiety.maxScore }}
                      transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
                      style={{
                        strokeDasharray: 364.42,
                        strokeDashoffset: 0,
                      }}
                    />
                    <defs>
                      <linearGradient id="anxietyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.7, type: "spring" }}
                      className="text-4xl font-bold text-orange-400 mb-0.5"
                    >
                      {anxiety.score}
                    </motion.div>
                    <div className="text-gray-400 text-sm">/{anxiety.maxScore}</div>
                  </div>

                  {/* Trend Icon - Smaller */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 1.9, type: "spring" }}
                    className="absolute top-2 right-2 w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  </motion.div>
                </div>
              </div>

              {/* Assessment Info - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="mt-4 text-center"
              >
                <h3 className="text-lg font-semibold text-orange-400 mb-1">Moderate Anxiety</h3>
                <p className="text-gray-400 text-xs mb-0.5">{anxiety.type}</p>
                <p className="text-gray-500 text-xs">{anxiety.date}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
                  <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">{anxiety.classification}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Bottom Center - Wellness - Slightly Larger */}
        {wellness && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, type: "spring" }}
            className="flex flex-col items-center"
          >
            {/* Circular Progress Ring */}
            <div className="relative group cursor-pointer">
              {/* Outer Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 blur-2xl"
              />

              {/* Main Circle - Medium Size */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-44 h-44 -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.08)"
                    strokeWidth="7"
                  />
                  {/* Progress Circle */}
                  <motion.circle
                    cx="88"
                    cy="88"
                    r="80"
                    fill="none"
                    stroke="url(#wellnessGradient)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: wellness.score / wellness.maxScore }}
                    transition={{ duration: 2, delay: 1.4, ease: "easeOut" }}
                    style={{
                      strokeDasharray: 502.65,
                      strokeDashoffset: 0,
                    }}
                  />
                  <defs>
                    <linearGradient id="wellnessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.9, type: "spring" }}
                    className="text-5xl font-bold text-green-400 mb-1"
                  >
                    {wellness.score}
                  </motion.div>
                  <div className="text-gray-400 text-base">/{wellness.maxScore}</div>
                </div>

                {/* Trend Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 2.1, type: "spring" }}
                  className="absolute top-3 right-3 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </motion.div>
              </div>
            </div>

            {/* Assessment Info - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="mt-4 text-center"
            >
              <h3 className="text-xl font-semibold text-green-400 mb-1">Good Wellness</h3>
              <p className="text-gray-400 text-xs mb-0.5">{wellness.type}</p>
              <p className="text-gray-500 text-xs">{wellness.date}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">{wellness.classification}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CircularAssessmentViz;
