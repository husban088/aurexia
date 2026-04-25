"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function WomenWatches() {
  return (
    <Subcategory
      category="Watches"
      subcategory="Women Watches"
      title="Women's <em>Watches</em>"
      description="Elegant and stylish watches that complement your unique personality. Discover diamond-set dials, mother-of-pearl faces, and rose gold bracelets — time, reimagined as jewellery."
      breadcrumb={{
        parent: "Watches",
        parentHref: "/watches",
      }}
    />
  );
}
