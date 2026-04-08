import { DemoResultsSection } from "../../components/marketing/DemoResultsSection";
import { FadeInOnScroll } from "../../components/marketing/FadeInOnScroll";
import { FeaturesSection } from "../../components/marketing/FeaturesSection";
import { FooterSection } from "../../components/marketing/FooterSection";
import { HeroSection } from "../../components/marketing/HeroSection";
import { PricingSection } from "../../components/marketing/PricingSection";
import { ProductOverviewSection } from "../../components/marketing/ProductOverviewSection";
import { WorkflowSection } from "../../components/marketing/WorkflowSection";

export default function MarketingHomePage() {
  return (
    <main className="aurora-bg relative overflow-hidden bg-background text-text">
      <div className="bg-grid-noise pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-16rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-accent/14 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-primary/14 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-12 px-5 py-12 md:space-y-16 md:px-8 md:py-16 lg:space-y-20 lg:px-12 lg:py-20">
        <FadeInOnScroll delayMs={0}>
          <HeroSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={60}>
          <ProductOverviewSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={80}>
          <FeaturesSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={100}>
          <DemoResultsSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={120}>
          <WorkflowSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={140}>
          <PricingSection />
        </FadeInOnScroll>
        <FadeInOnScroll delayMs={160}>
          <FooterSection />
        </FadeInOnScroll>
      </div>
    </main>
  );
}