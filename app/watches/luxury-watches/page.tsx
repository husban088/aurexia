"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function LuxuryWatches() {
  return (
    <Subcategory
      category="Watches"
      subcategory="Luxury Watches"
      title="Luxury <em>Watches</em>"
      description="Premium craftsmanship and luxury brands. Experience the pinnacle of horology with our curated selection of exquisite timepieces from the world's most prestigious watchmakers."
      breadcrumb={{
        parent: "Watches",
        parentHref: "/watches",
      }}
    />
  );
}
