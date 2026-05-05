"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import PageLoader from "./components/PageLoader";
import HomeReviews from "./components/HomeReviews";

export default function Home() {
  return (
    <>
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
