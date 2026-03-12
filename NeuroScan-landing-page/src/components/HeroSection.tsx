import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Orb from "./Orb";
import NeuralBackground from "./NeuralBackground";

const Logogram = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
    <div className="relative" style={{ width: "min(90vw, 700px)", height: "min(90vw, 700px)" }}>
      {/* Core glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-glow-indigo/15 to-glow-purple/8 animate-pulse-glow blur-[80px]" />

      {/* Rings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: `${i * 14}%`,
            borderColor: `hsl(var(--glow-indigo) / ${0.06 + i * 0.02})`,
          }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.15, 0.4, 0.15],
            rotate: [0, i % 2 === 0 ? 360 : -360],
          }}
          transition={{
            duration: 20 + i * 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Neural connection lines */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI * 2) / 6;
        const nextAngle = ((i + 2) * Math.PI * 2) / 6;
        return (
          <motion.svg
            key={`line-${i}`}
            className="absolute inset-0 w-full h-full"
            animate={{ opacity: [0.03, 0.12, 0.03] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.6 }}
          >
            <line
              x1={`${50 + Math.cos(angle) * 30}%`}
              y1={`${50 + Math.sin(angle) * 30}%`}
              x2={`${50 + Math.cos(nextAngle) * 30}%`}
              y2={`${50 + Math.sin(nextAngle) * 30}%`}
              stroke="hsl(var(--glow-indigo))"
              strokeWidth="0.5"
            />
          </motion.svg>
        );
      })}

      {/* Orbiting particles — multiple orbits */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const orbitRadius = 25 + (i % 4) * 10;
        const size = i % 3 === 0 ? 5 : i % 2 === 0 ? 3 : 2;
        return (
          <motion.div
            key={`p-${i}`}
            className="absolute rounded-full"
            style={{
              top: "50%",
              left: "50%",
              width: `${size}px`,
              height: `${size}px`,
              background: i % 3 === 0
                ? "hsl(var(--glow-purple) / 0.8)"
                : "hsl(var(--glow-indigo) / 0.7)",
              boxShadow: size >= 4
                ? "0 0 8px 2px hsl(var(--glow-indigo) / 0.3)"
                : "none",
            }}
            animate={{
              x: [
                Math.cos((i * Math.PI * 2) / 12) * orbitRadius * 3,
                Math.cos((i * Math.PI * 2) / 12 + Math.PI) * orbitRadius * 3,
                Math.cos((i * Math.PI * 2) / 12) * orbitRadius * 3,
              ],
              y: [
                Math.sin((i * Math.PI * 2) / 12) * orbitRadius * 3,
                Math.sin((i * Math.PI * 2) / 12 + Math.PI) * orbitRadius * 3,
                Math.sin((i * Math.PI * 2) / 12) * orbitRadius * 3,
              ],
              opacity: [0.15, 0.8, 0.15],
            }}
            transition={{
              duration: 8 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Center pulse */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
        style={{
          background: "hsl(var(--glow-indigo) / 0.9)",
          boxShadow: "0 0 40px 15px hsl(var(--glow-indigo) / 0.3)",
        }}
        animate={{
          scale: [1, 1.4, 1],
          boxShadow: [
            "0 0 30px 10px hsla(243, 75%, 59%, 0.2)",
            "0 0 60px 25px hsla(243, 75%, 59%, 0.4)",
            "0 0 30px 10px hsla(243, 75%, 59%, 0.2)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  </div>
);

const TypewriterText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 55);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      <span className={`inline-block w-[2px] h-[1em] bg-text-bright ml-1 align-text-bottom ${done ? "animate-cursor-blink" : ""}`} />
    </span>
  );
};

const HeroSection = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
    {/* Full-screen Orb Background - constrained to hero section */}
    <Orb 
      hue={243}
      hoverIntensity={1.2}
      rotateOnHover={true}
      backgroundColor="#0a0b0f"
    />
    
    {/* Neural Network Background */}
    <NeuralBackground />

    {/* Foreground content */}
    <div className="container text-center relative z-10">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-text-bright tracking-tight leading-tight max-w-4xl mx-auto"
      >
        <TypewriterText text="Your AI clinical psychologist." />
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="mt-8 text-sm md:text-base text-text-dim max-w-xl mx-auto leading-relaxed"
      >
        Talk to an AI that listens like a therapist. NeuroScan AI conducts
        conversational mental health screenings, analyzes emotional language,
        and generates clinical reports — all through natural dialogue.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.8 }}
        className="mt-12 flex items-center justify-center gap-6"
      >
        <a
          href="/signup"
          className="text-sm px-8 py-3 rounded-sm border border-border text-text-bright hover:border-text-dim transition-colors duration-300"
        >
          Join the Platform
        </a>
        <a
          href="#how-it-works"
          className="text-sm text-text-dim hover:text-text-bright transition-colors duration-300 underline underline-offset-4 decoration-border hover:decoration-glow-indigo/50"
        >
          See How It Works →
        </a>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 1 }}
        className="mt-16 flex items-center justify-center gap-8 text-xs text-text-dim/50"
      >
        {["HIPAA Compliant", "DSM-5 Aligned", "End-to-End Encrypted"].map((badge) => (
          <span key={badge} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--glow-indigo) / 0.5)" }} />
            {badge}
          </span>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
