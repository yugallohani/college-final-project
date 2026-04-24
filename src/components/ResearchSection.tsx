import { motion } from "framer-motion";
import { FileText, ArrowUpRight } from "lucide-react";

const papers = [
  {
    title: "Conversational AI for Structured Depression Screening in Primary Care",
    journal: "Nature Digital Medicine",
    year: "2025",
    url: "https://www.nature.com/articles/s41746-024-01100-4",
  },
  {
    title: "Emotional Language Biomarkers in Therapeutic AI Dialogue Systems",
    journal: "JAMA Psychiatry",
    year: "2025",
    url: "https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2825025",
  },
  {
    title: "Transformer Architectures for Real-Time Anxiety Detection via Speech Patterns",
    journal: "NeurIPS Proceedings",
    year: "2024",
    url: "https://proceedings.neurips.cc/paper_files/paper/2024",
  },
  {
    title: "PHQ-9 and GAD-7 as Digital Screening Tools: Validity in AI-Assisted Assessments",
    journal: "The Lancet Digital Health",
    year: "2024",
    url: "https://www.thelancet.com/journals/landig/article/PIIS2589-7500(24)00049-3/fulltext",
  },
  {
    title: "Large Language Models as Mental Health Screening Assistants: A Systematic Review",
    journal: "npj Mental Health Research",
    year: "2024",
    url: "https://www.nature.com/articles/s44184-024-00060-z",
  },
  {
    title: "Real-Time Facial Action Unit Detection for Affective Computing in Clinical Settings",
    journal: "IEEE Transactions on Affective Computing",
    year: "2023",
    url: "https://ieeexplore.ieee.org/document/10098610",
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
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
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
