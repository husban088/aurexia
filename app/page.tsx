"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import HomeReviews from "./components/HomeReviews";

/*
  PageLoader hataya gaya — 1500ms delay page ko slow aur bottom-heavy feel deta tha.
  Ab page instantly top se render hota hai.
  Agar loader chahiye to CSS-only fade-in use karo (below).
*/

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
