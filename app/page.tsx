"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import HomeReviews from "./components/HomeReviews";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 page-fade-in">
      <HeroSection />
      <ExploreAurexia />
      <FeaturedProducts />
      <HomeReviews />
    </main>
  );
}
