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
    <main className="relative overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute left-[-8rem] top-[28rem] h-[22rem] w-[22rem] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-18 px-6 py-14 md:space-y-24 md:px-10 md:py-18 lg:px-14 lg:space-y-28 lg:py-20">
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