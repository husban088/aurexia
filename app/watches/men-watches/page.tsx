"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function MenWatches() {
  return (
    <Subcategory
      category="Watches"
      subcategory="Men Watches"
      title="Men's <em>Watches</em>"
      description="Sophisticated timepieces for the modern gentleman. From classic analog to chronograph, explore our collection of precision-crafted watches that blend heritage with contemporary style."
      breadcrumb={{
        parent: "Watches",
        parentHref: "/watches",
      }}
    />
  );
}
