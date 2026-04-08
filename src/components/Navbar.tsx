import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Technology", href: "#technology" },
  { label: "Research", href: "#research" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Dynamic Island Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 left-0 right-0 z-50 hidden md:block"
      >
        <div className="flex justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-glow-indigo/20 via-glow-purple/20 to-glow-indigo/20 blur-xl opacity-60" />
            
            {/* Main navbar container */}
            <div className="relative flex items-center gap-8 px-8 py-3 rounded-full border border-border/30 bg-background/40 backdrop-blur-2xl shadow-2xl">
              {/* Logo */}
              <a 
                href="#" 
                className="font-display text-base font-semibold text-text-bright tracking-tight whitespace-nowrap hover:text-glow-indigo transition-colors duration-300"
              >
                NeuroScan<span className="text-glow-indigo">AI</span>
              </a>

              {/* Divider */}
              <div className="w-px h-5 bg-border/30" />

              {/* Nav items */}
              <div className="flex items-center gap-6">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="relative text-sm text-text-dim hover:text-text-bright transition-colors duration-300 group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-glow-indigo to-glow-purple group-hover:w-full transition-all duration-300" />
                  </a>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-border/30" />

              {/* Auth buttons */}
              <div className="flex items-center gap-3">
                <a
                  href="/login"
                  className="text-sm text-text-dim hover:text-text-bright transition-colors duration-300"
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  className="relative text-sm px-5 py-2 rounded-full text-text-bright border border-glow-indigo/30 bg-glow-indigo/5 hover:bg-glow-indigo/10 hover:border-glow-indigo/50 transition-all duration-300 whitespace-nowrap overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-glow-indigo/0 via-glow-indigo/20 to-glow-indigo/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="mx-4 mt-4 rounded-2xl border border-border/30 bg-background/40 backdrop-blur-2xl shadow-xl">
          <div className="flex h-14 items-center justify-between px-4">
            <a href="#" className="font-display text-base font-semibold text-text-bright tracking-tight">
              NeuroScan<span className="text-glow-indigo">AI</span>
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-text-dim hover:text-text-bright transition-colors p-2"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/30"
              >
                <div className="px-4 py-4 flex flex-col gap-3">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-text-dim hover:text-text-bright transition-colors py-2"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-3 pt-3 border-t border-border/30">
                    <a
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-text-dim hover:text-text-bright transition-colors py-2"
                    >
                      Sign In
                    </a>
                    <a
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm px-4 py-2 rounded-full text-text-bright border border-glow-indigo/30 bg-glow-indigo/5 hover:bg-glow-indigo/10 text-center transition-all duration-300"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
