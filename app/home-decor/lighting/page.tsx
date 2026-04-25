"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function Lighting() {
  return (
    <Subcategory
      category="Home Decor"
      subcategory="Lighting"
      title="Decorative <em>Lighting</em>"
      description="Create the perfect ambiance with our elegant lighting solutions"
      breadcrumb={{
        parent: "Home Decor",
        parentHref: "/home-decor",
      }}
    />
  );
}
