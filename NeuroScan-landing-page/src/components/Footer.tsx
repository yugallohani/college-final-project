const Footer = () => (
  <footer className="border-t border-border/30 py-12">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-xs text-text-dim">
        © 2026 NeuroScan AI. All rights reserved.
      </p>
      <div className="flex items-center gap-6">
        {["Privacy", "Terms", "Security"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-xs text-text-dim hover:text-text-bright transition-colors duration-300"
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
