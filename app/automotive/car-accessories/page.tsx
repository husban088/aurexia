"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function CarAccessories() {
  return (
    <Subcategory
      category="Automotive"
      subcategory="Car Accessories"
      title="Car <em>Accessories</em>"
      description="Upgrade your ride with premium accessories from floor mats to seat covers"
      breadcrumb={{
        parent: "Automotive",
        parentHref: "/automotive",
      }}
    />
  );
}
