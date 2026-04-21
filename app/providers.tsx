"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Fixed Navbar — receives a callback to open the sidebar */}
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />

      {/* Right-side Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Page content pushed down by navbar height */}
      <div style={{ paddingTop: "76px" }} className="flex flex-col flex-1">
        {children}
      </div>
    </>
  );
}
