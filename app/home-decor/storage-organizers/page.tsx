"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function StorageOrganizers() {
  return (
    <Subcategory
      category="Home Decor"
      subcategory="Storage & Organizers"
      title="Storage <em>& Organizers</em>"
      description="Beautiful and functional storage solutions for every room"
      breadcrumb={{
        parent: "Home Decor",
        parentHref: "/home-decor",
      }}
    />
  );
}
