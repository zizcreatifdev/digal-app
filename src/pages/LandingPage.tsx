import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeBanner } from "@/components/landing/MarqueeBanner";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { TeamRolesSection } from "@/components/landing/TeamRolesSection";
import { MockupsSection } from "@/components/landing/MockupsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { usePageTitle } from "@/hooks/usePageTitle";

const LandingPage = () => {
  usePageTitle("Digal · La plateforme des Community Managers");
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <MarqueeBanner />
      <ProblemSection />
      <SolutionSection />
      <TeamRolesSection />
      <MockupsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
