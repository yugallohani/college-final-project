import { motion } from "framer-motion";

const ContactSection = () => (
  <section id="contact" className="py-32 relative">
    {/* Glow */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-t from-glow-indigo/5 to-transparent rounded-full blur-3xl pointer-events-none" />

    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto text-center"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-glow-indigo mb-4">
          Get Started
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-bright leading-tight mb-6">
          Ready to talk to your AI psychologist?
        </h2>
        <p className="text-sm text-text-dim leading-relaxed mb-10">
          NeuroScan AI is currently available in early access for
          individuals and licensed mental health professionals.
          Start your first conversational screening today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:access@neuroscan.ai"
            className="group relative text-sm px-8 py-3 rounded-sm text-primary-foreground overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, hsl(var(--glow-indigo)), hsl(var(--glow-purple)))",
            }}
          >
            <span className="relative z-10">Request Early Access</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, hsl(var(--glow-purple)), hsl(var(--glow-indigo)))",
              }}
            />
          </a>
          <a
            href="#"
            className="text-sm border border-border px-8 py-3 rounded-sm text-text-dim hover:text-text-bright hover:border-glow-indigo/40 transition-all duration-300"
          >
            Schedule a Demo
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ContactSection;
