import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { MessageCircle, Brain, FileText, Users, Shield, Sparkles } from "lucide-react";
import BrainVisualization from "./BrainVisualization";

const features = [
  {
    icon: MessageCircle,
    title: "Conversational Screening",
    description: "No static forms. NeuroScan AI interviews users through natural dialogue — like talking to a calm, supportive clinical assistant.",
  },
  {
    icon: Brain,
    title: "Emotional Language Analysis",
    description: "Our AI detects linguistic biomarkers of depression and anxiety in real-time — word choice, sentiment patterns, and conversational signals.",
  },
  {
    icon: FileText,
    title: "Clinical Reports",
    description: "Receive structured mental health screening reports based on validated psychological assessments including PHQ-9 and GAD-7.",
  },
  {
    icon: Users,
    title: "Psychologist Referral",
    description: "When risk is detected, NeuroScan AI recommends connecting with licensed mental health professionals for further evaluation.",
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "End-to-end encryption with zero-knowledge architecture. Your conversations and data never leave your infrastructure.",
  },
  {
    icon: Sparkles,
    title: "Voice & Text Input",
    description: "Speak or type. NeuroScan AI processes both modalities, adapting its analysis to capture the full emotional spectrum.",
  },
];

const StackCard = ({ feature, index, total }: { feature: typeof features[0]; index: number; total: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = feature.icon;

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        scale,
        opacity,
        position: "sticky",
        top: `${120 + index * 24}px`,
        zIndex: index,
      }}
      className="origin-top"
    >
      <div
        className="group relative p-8 md:p-10 rounded-lg border border-border/50 bg-surface/90 backdrop-blur-sm hover:border-glow-indigo/30 transition-all duration-500 overflow-hidden"
        style={{
          boxShadow: `0 ${4 + index * 2}px ${20 + index * 5}px hsl(var(--background) / 0.5)`,
        }}
      >
        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "radial-gradient(400px circle at 50% 0%, hsl(var(--glow-indigo) / 0.06), transparent 70%)",
          }}
        />
        <div className="flex items-start gap-6 relative z-10">
          <div className="shrink-0 w-12 h-12 rounded-lg border border-glow-indigo/20 flex items-center justify-center"
            style={{ background: "hsl(var(--glow-indigo) / 0.08)" }}
          >
            <Icon className="w-5 h-5 text-glow-indigo" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display text-lg md:text-xl font-semibold text-text-bright mb-2">
              {feature.title}
            </h3>
            <p className="text-sm md:text-base text-text-dim leading-relaxed max-w-xl">
              {feature.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="product" className="py-32 relative">
      <div className="container max-w-7xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center lg:text-left"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-glow-indigo mb-4">
            Product
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-bright max-w-xl leading-tight">
            Not a chatbot.
            <br />
            <span className="text-gradient-data">A clinical AI that listens.</span>
          </h2>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left column - Stacked Cards */}
          <div className="flex flex-col gap-6">
            {features.map((feature, i) => (
              <StackCard key={feature.title} feature={feature} index={i} total={features.length} />
            ))}
          </div>

          {/* Right column - Brain Animation */}
          <div className="relative lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[700px] w-[500px] mx-auto"
              style={{ background: "transparent", filter: "drop-shadow(0 0 60px rgba(79, 124, 255, 0.15))" }}
            >
              {/* Brain Animation */}
              <BrainVisualization />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
