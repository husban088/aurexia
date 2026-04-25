"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function CarCleaningTools() {
  return (
    <Subcategory
      category="Automotive"
      subcategory="Car Cleaning Tools"
      title="Car <em>Cleaning Tools</em>"
      description="Professional-grade cleaning supplies and detailing equipment"
      breadcrumb={{
        parent: "Automotive",
        parentHref: "/automotive",
      }}
    />
  );
}
