"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function SmartWatches() {
  return (
    <Subcategory
      category="Watches"
      subcategory="Smart Watches"
      title="Smart <em>Watches</em>"
      description="Advanced fitness trackers, health monitors, and connected smartwatches. Stay connected, track your fitness goals, and manage your day with cutting-edge wearable technology."
      breadcrumb={{
        parent: "Watches",
        parentHref: "/watches",
      }}
    />
  );
}
