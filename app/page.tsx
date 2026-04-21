import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* ── Hero Slider Section ── */}
      <HeroSection />

      {/* ── Explore Aurexia Categories ── */}
      <ExploreAurexia />

      {/* ── Below — add more sections here later ── */}
    </main>
  );
}
