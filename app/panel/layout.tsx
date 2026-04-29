"use client";

import PanelNavbar from "../components/PanelNavbar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PanelNavbar />
      <div className="panel-content" style={{ paddingTop: "68px" }}>
        {children}
      </div>
    </>
  );
}
