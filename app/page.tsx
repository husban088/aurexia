"use client";

import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import HomeReviews from "./components/HomeReviews";
import WhyChooseUs from "./components/WhyChooseUs";
import GlobalFAQSection from "./components/GlobalFAQSection";
import TrustBadgesSection from "./components/TrustBadgesSection";
import HeroExplore from "./components/HeroExplore";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 page-fade-in">
      <HeroExplore />
      <ExploreAurexia />
      <TrustBadgesSection />
      <FeaturedProducts />
      <WhyChooseUs />
      <HomeReviews />
      <GlobalFAQSection />
    </main>
  );
}
