import Header from "../components/shared/landing/Header";
import Hero from "../components/shared/landing/Hero";
import Problem from "../components/shared/landing/Problem";
import { WhatIs, HowWorks } from "../components/shared/landing/AboutHow";
import Features from "../components/shared/dashboard/main/Features";
import Control from "../components/shared/landing/Control";
import { Value, Audience } from "../components/shared/landing/ValueAudience";
import { Cases, Testimonials } from "../components/shared/landing/Proof";
import { Pricing, Faq } from "../components/shared/landing/PricingFaq";
import { Launch, Footer } from "../components/shared/landing/Finale";
import { Starfield } from "../components/ui/Ambient";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-void font-body text-mist">
      {/* ambient background */}
      <Starfield />
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 70% -10%, rgba(30,58,138,0.28), transparent 60%), radial-gradient(ellipse 60% 45% at 10% 30%, rgba(139,133,248,0.1), transparent 65%), linear-gradient(180deg, #04070f 0%, #060b18 55%, #04070f 100%)",
        }}
      />
      <div className="noise-overlay" />

      <Header />

      <main>
        <Hero />
        <Problem />
        <WhatIs />
        <HowWorks />
        <Features />
        <Control />
        <Value />
        <Audience />
        <Cases />
        <Testimonials />
        <Pricing />
        <Faq />
        <Launch />
      </main>

      <Footer />
    </div>
  );
}
