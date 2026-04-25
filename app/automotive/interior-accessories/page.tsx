"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function InteriorAccessories() {
  return (
    <Subcategory
      category="Automotive"
      subcategory="Interior Accessories"
      title="Interior <em>Accessories</em>"
      description="Transform your cabin with ambient lighting, organizers, and premium accents"
      breadcrumb={{
        parent: "Automotive",
        parentHref: "/automotive",
      }}
    />
  );
}
