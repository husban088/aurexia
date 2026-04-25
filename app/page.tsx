"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import PageLoader from "./components/PageLoader";

export default function Home() {
  return (
    <>
      <PageLoader />
      <main className="flex flex-col flex-1">
        <HeroSection />
        <ExploreAurexia />
        <FeaturedProducts />
      </main>
    </>
  );
}
