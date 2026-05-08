"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import PageLoader from "./components/PageLoader";
import HomeReviews from "./components/HomeReviews";
import HomePopup from "./components/HomePopup";

export default function Home() {
  return (
    <>
      <HomePopup /> {/* ← sirf yahan add karein */}
      <PageLoader />
      <main className="flex flex-col flex-1">
        <HeroSection />
        <ExploreAurexia />
        <FeaturedProducts />
        <HomeReviews />
      </main>
    </>
  );
}
