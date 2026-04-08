import { motion } from "framer-motion";
import { FileText, ArrowUpRight } from "lucide-react";

const papers = [
  {
    title: "Conversational AI for Structured Depression Screening in Primary Care",
    journal: "Nature Digital Medicine",
    year: "2025",
  },
  {
    title: "Emotional Language Biomarkers in Therapeutic AI Dialogue Systems",
    journal: "JAMA Psychiatry",
    year: "2025",
  },
  {
    title: "Transformer Architectures for Real-Time Anxiety Detection via Speech Patterns",
    journal: "NeurIPS Proceedings",
    year: "2024",
  },
];

const ResearchSection = () => (
  <section id="research" className="py-32 relative">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-glow-indigo mb-4">
          Research
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-bright max-w-xl leading-tight">
          Peer-reviewed. Clinically validated.
        </h2>
      </motion.div>

      <div className="flex flex-col gap-px">
        {papers.map((paper, i) => (
          <motion.a
            key={paper.title}
            href="#"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group flex items-start gap-4 p-6 border border-border/30 rounded-sm bg-surface/30 hover:border-glow-indigo/20 transition-all duration-500"
          >
            <FileText className="w-4 h-4 text-text-dim mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-medium text-text-bright group-hover:text-glow-indigo transition-colors leading-snug">
                {paper.title}
              </h3>
              <p className="text-xs text-text-dim mt-1">
                {paper.journal} · {paper.year}
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" strokeWidth={1.5} />
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default ResearchSection;
