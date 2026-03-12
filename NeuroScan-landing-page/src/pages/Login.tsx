import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Brain } from "lucide-react";
import NeuralBackground from "@/components/NeuralBackground";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", data.tokens.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralBackground />

      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/6 left-1/6 w-80 h-80 bg-glow-purple/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-1/6 right-1/6 w-80 h-80 bg-glow-indigo/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-60 h-60 bg-glow-indigo/8 rounded-full blur-2xl"
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Back to home link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-text-dim hover:text-text-bright transition-all duration-300 mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glassmorphic card with glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-glow-purple/12 to-glow-indigo/8 rounded-2xl blur-xl" />
            <div className="relative bg-surface/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-glow-purple/8 to-glow-indigo/5 pointer-events-none" />
              
              <div className="relative">
                {/* Header with logo */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-glow-purple/20 to-glow-indigo/20 rounded-2xl mb-4 border border-glow-purple/30"
                  >
                    <Brain className="w-8 h-8 text-glow-purple" />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-2xl font-semibold text-text-bright mb-2"
                  >
                    Welcome Back
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="text-text-dim text-sm"
                  >
                    Sign in to continue your mental health journey
                  </motion.p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-text-bright mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl text-text-bright placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-glow-purple/50 focus:border-glow-purple/50 transition-all duration-300 hover:border-border"
                        placeholder="Enter your email"
                      />
                      {focusedField === "email" && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 rounded-xl bg-glow-purple/5 pointer-events-none"
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Password field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                  >
                    <label htmlFor="password" className="block text-sm font-medium text-text-bright mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl text-text-bright placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-glow-purple/50 focus:border-glow-purple/50 transition-all duration-300 hover:border-border pr-12"
                        placeholder="Enter your password"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright transition-colors duration-300 p-1 rounded-lg hover:bg-surface/50"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                      {focusedField === "password" && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 rounded-xl bg-glow-purple/5 pointer-events-none"
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 30px hsla(270, 60%, 62%, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-glow-purple to-glow-purple/90 hover:from-glow-purple/90 hover:to-glow-purple text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing In...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                {/* Sign up link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  className="mt-8 text-center"
                >
                  <p className="text-text-dim text-sm">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="text-glow-purple hover:text-glow-purple/80 transition-colors duration-300 font-medium hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-8 flex items-center justify-center gap-6 text-xs text-text-dim/50"
          >
            {["256-bit SSL", "HIPAA Compliant", "SOC 2 Type II"].map((badge, index) => (
              <motion.span
                key={badge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-glow-purple/50" />
                {badge}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;