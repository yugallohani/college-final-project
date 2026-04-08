import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const metrics = [
  { value: "94.2%", label: "Sensitivity", sub: "Depression detection" },
  { value: "91.7%", label: "Specificity", sub: "Anxiety markers" },
  { value: "200+", label: "Biomarkers", sub: "Linguistic features" },
  { value: "2M+", label: "Conversations", sub: "Training dataset" },
];

const WaveformViz = () => (
  <div className="relative h-32 flex items-center justify-center gap-[2px] overflow-hidden">
    {Array.from({ length: 80 }).map((_, i) => {
      const height = Math.sin((i / 80) * Math.PI * 4) * 35 + Math.random() * 25 + 8;
      return (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{
            background: `linear-gradient(to top, hsl(var(--glow-indigo)), hsl(var(--glow-purple)))`,
          }}
          initial={{ height: 2, opacity: 0 }}
          whileInView={{ height, opacity: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.015, ease: "easeOut" }}
        />
      );
    })}
  </div>
);

const TechnologySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="technology" className="py-32 relative">
      <div className="container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-glow-indigo mb-4">
            Technology
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-bright max-w-xl leading-tight">
            Clinical evidence meets
            <br />
            <span className="text-gradient-data">neural architecture.</span>
          </h2>
        </motion.div>

        {/* Waveform visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-16 p-8 rounded-sm border border-border/30 bg-surface/30"
        >
          <p className="text-xs text-text-dim mb-6 uppercase tracking-wider">
            Emotional Language Signal Analysis — Live Session
          </p>
          <WaveformViz />
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-6 border border-border/30 rounded-sm bg-surface/30 text-center hover:border-glow-indigo/20 transition-all duration-500"
            >
              <div className="font-display text-2xl md:text-3xl font-semibold text-text-bright mb-1">
                {m.value}
              </div>
              <div className="text-xs text-glow-indigo mb-1">{m.label}</div>
              <div className="text-xs text-text-dim/60">{m.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
