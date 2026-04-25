"use client";

import Subcategory from "@/app/components/SubcategoryPage";

export default function WallDecor() {
  return (
    <Subcategory
      category="Home Decor"
      subcategory="Wall Decor"
      title="Wall <em>Decor</em>"
      description="Stunning wall art, mirrors, and decorative pieces to enhance your walls"
      breadcrumb={{
        parent: "Home Decor",
        parentHref: "/home-decor",
      }}
    />
  );
}
