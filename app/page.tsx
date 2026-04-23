import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* ── Hero Slider Section ── */}
      <HeroSection />

      {/* ── Explore Aurexia Categories ── */}
      <ExploreAurexia />

      {/* ── Featured Products ── */}
      <FeaturedProducts />

      {/* ── Below — add more sections here later ── */}
    </main>
  );
}
