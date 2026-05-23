"use client";

import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import HomeReviews from "./components/HomeReviews";
import WhyChooseUs from "./components/WhyChooseUs";
import GlobalFAQSection from "./components/GlobalFAQSection";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 page-fade-in">
      <HeroSection />
      <ExploreAurexia />
      <FeaturedProducts />
      <WhyChooseUs />
      <HomeReviews />
      <GlobalFAQSection />
    </main>
  );
}
