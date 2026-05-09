"use client";

import { useEffect, useState } from "react";
import HeroSection from "./components/HeroSection";
import ExploreAurexia from "./components/ExploreAurexia";
import FeaturedProducts from "./components/FeaturedProducts";
import PageLoader from "./components/PageLoader";
import HomeReviews from "./components/HomeReviews";

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Hide loader after minimum display time
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Don't render loader on server at all to prevent hydration issues
  if (!isClient) {
    return (
      <main className="flex flex-col flex-1">
        <HeroSection />
        <ExploreAurexia />
        <FeaturedProducts />
        <HomeReviews />
      </main>
    );
  }

  return (
    <>
      {showLoader && <PageLoader />}
      <main
        className="flex flex-col flex-1"
        style={{ display: showLoader ? "none" : "flex" }}
      >
        <HeroSection />
        <ExploreAurexia />
        <FeaturedProducts />
        <HomeReviews />
      </main>
    </>
  );
}
