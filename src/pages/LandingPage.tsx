import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeBanner } from "@/components/landing/MarqueeBanner";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { MockupsSection } from "@/components/landing/MockupsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <MarqueeBanner />
      <ProblemSection />
      <SolutionSection />
      <MockupsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
