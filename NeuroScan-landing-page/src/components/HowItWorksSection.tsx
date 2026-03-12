import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { MessageSquare, HeartPulse, Cpu, BarChart3, UserCheck } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Conversation",
    description: "Begin a natural dialogue with your AI psychologist. No forms, no scripts — just a calm, supportive conversation about how you're feeling.",
    detail: "Text or voice input with adaptive questioning flow.",
  },
  {
    icon: HeartPulse,
    step: "02",
    title: "Screening",
    description: "The AI guides you through clinically validated assessments — PHQ-9 for depression, GAD-7 for anxiety — woven naturally into the conversation.",
    detail: "Structured screening embedded in natural dialogue.",
  },
  {
    icon: Cpu,
    step: "03",
    title: "Analysis",
    description: "NeuroScan AI analyzes 200+ emotional language biomarkers — sentiment drift, hedging patterns, temporal references, and semantic coherence.",
    detail: "Transformer models trained on 2M+ clinical conversations.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Report",
    description: "Receive a structured mental health screening report with risk scores, identified patterns, and interpretable evidence from your conversation.",
    detail: "Explainable AI with full conversational audit trail.",
  },
  {
    icon: UserCheck,
    step: "05",
    title: "Connect",
    description: "If potential risk is detected, NeuroScan AI recommends licensed psychologists and facilitates a seamless handoff for professional evaluation.",
    detail: "Direct referral to vetted mental health professionals.",
  },
];

const TimelineStep = ({ step, index }: { step: typeof steps[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = step.icon;
  const isLeft = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.35"],
  });

  const cardOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);
  const cardX = useTransform(scrollYProgress, [0, 0.5, 1], [isLeft ? -50 : 50, 0, 0]);
  const cardScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1]);
  const dotScale = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 1.4, 1]);
  const dotOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 0.8, 0]);

  return (
    <div ref={ref} className="relative" style={{ minHeight: "280px" }}>
      {/* Center dot + glow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-8 z-20 flex flex-col items-center">
        <motion.div
          className="absolute w-10 h-10 rounded-full"
          style={{
            opacity: glowOpacity,
            background: "hsl(var(--glow-indigo) / 0.4)",
            filter: "blur(14px)",
          }}
        />
        <motion.div
          className="relative w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{
            scale: dotScale,
            opacity: dotOpacity,
            borderColor: "hsl(var(--glow-indigo))",
            background: "hsl(var(--background))",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--glow-indigo))" }} />
        </motion.div>
      </div>

      {/* Card — alternating left/right */}
      <motion.div
        className={`relative ${isLeft ? "mr-auto pr-4 md:pr-0 md:mr-0 md:w-[45%]" : "ml-auto pl-4 md:pl-0 md:ml-0 md:w-[45%] md:ml-auto"}`}
        style={{
          opacity: cardOpacity,
          x: cardX,
          scale: cardScale,
          ...(isLeft ? { marginRight: "auto", marginLeft: "0" } : { marginLeft: "auto", marginRight: "0" }),
        }}
      >
        <div className="group relative p-6 md:p-8 rounded-lg border border-border/40 bg-surface/80 backdrop-blur-sm hover:border-glow-indigo/30 transition-all duration-500 overflow-hidden">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(350px circle at ${isLeft ? "80%" : "20%"} 30%, hsl(var(--glow-indigo) / 0.06), transparent 70%)`,
            }}
          />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-display text-lg md:text-xl font-semibold text-text-bright">
              {step.title}
            </h3>
            <div
              className="w-9 h-9 rounded-lg border border-glow-indigo/15 flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--glow-indigo) / 0.06)" }}
            >
              <Icon className="w-4 h-4 text-glow-indigo" strokeWidth={1.5} />
            </div>
          </div>

          <p className="text-sm text-text-dim leading-relaxed mb-4 relative z-10">
            {step.description}
          </p>

          <div className="border-t border-border/20 pt-3 relative z-10">
            <p className="text-xs text-text-dim/50 font-mono">{step.detail}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.6", "end 0.8"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="py-32 relative" ref={sectionRef}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[800px] bg-gradient-to-b from-glow-indigo/3 via-glow-purple/2 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-5xl">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-glow-indigo mb-4">
            How It Works
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-bright leading-tight">
            From conversation to clarity.
          </h2>
          <p className="mt-4 text-sm text-text-dim max-w-md mx-auto leading-relaxed">
            Five steps. One seamless experience. Scroll to follow the journey.
          </p>
        </motion.div>

        <div className="relative">
          {/* Static center line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border/20 hidden md:block" />

          {/* Animated glowing fill */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-px origin-top hidden md:block"
            style={{
              height: lineHeight,
              background: "linear-gradient(to bottom, hsl(var(--glow-indigo)), hsl(var(--glow-purple)), transparent)",
            }}
          />

          <div className="flex flex-col gap-12 md:gap-4">
            {steps.map((step, i) => (
              <TimelineStep key={step.step} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
