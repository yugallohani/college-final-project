import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TechnologySection from "@/components/TechnologySection";
import ResearchSection from "@/components/ResearchSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProductSection />
      <HowItWorksSection />
      <TechnologySection />
      <ResearchSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
