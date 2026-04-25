"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function AutomotivePhoneHolders() {
  return (
    <Subcategory
      category="Automotive"
      subcategory="Phone Holders"
      title="Car <em>Phone Holders</em>"
      description="Secure magnetic and clamp mounts for safe navigation"
      breadcrumb={{
        parent: "Automotive",
        parentHref: "/automotive",
      }}
    />
  );
}
