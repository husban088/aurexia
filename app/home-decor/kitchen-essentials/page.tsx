"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function KitchenEssentials() {
  return (
    <Subcategory
      category="Home Decor"
      subcategory="Kitchen Essentials"
      title="Kitchen <em>Essentials</em>"
      description="Premium cookware, utensils, and organization for your kitchen"
      breadcrumb={{
        parent: "Home Decor",
        parentHref: "/home-decor",
      }}
    />
  );
}
