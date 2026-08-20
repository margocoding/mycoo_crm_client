import "./index.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import { WhatIs, HowWorks } from "./components/AboutHow";
import Features from "./components/Features";
import Control from "./components/Control";
import { Value, Audience } from "./components/ValueAudience";
import { Cases, Testimonials } from "./components/Proof";
import { Pricing, Faq } from "./components/PricingFaq";
import { Launch, Footer } from "./components/Finale";
import { LaunchProvider } from "./components/Register";
import { Starfield } from "./components/ambient";

export default function App() {
  return (
    <LaunchProvider>
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
    </LaunchProvider>
  );
}
