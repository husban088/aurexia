"use client";

import { useState, useEffect, useRef } from "react";
import "./ProductGridFilters.css";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    categories: string[];
    subcategories: string[];
    colors: string[];
    sizes: string[];
    capacities: string[];
    materials: string[];
  };
  selectedFilters: {
    category: string;
    subcategory: string;
    color: string;
    size: string;
    capacity: string;
    material: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  isOpen,
  onClose,
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: FilterSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filterSections = [
    {
      id: "category",
      label: "Category",
      icon: "🏷️",
      items: filters.categories,
    },
    {
      id: "subcategory",
      label: "Subcategory",
      icon: "📂",
      items: filters.subcategories,
    },
    { id: "color", label: "Colors", icon: "🎨", items: filters.colors },
    { id: "size", label: "Sizes", icon: "📏", items: filters.sizes },
    {
      id: "capacity",
      label: "Capacity",
      icon: "⚡",
      items: filters.capacities,
    },
    { id: "material", label: "Material", icon: "🔧", items: filters.materials },
  ];

  const getActiveCount = () => {
    return Object.values(selectedFilters).filter((v) => v && v !== "All")
      .length;
  };

  const activeCount = getActiveCount();

  return (
    <>
      {/* Overlay */}
      <div
        className={`filter-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`filter-sidebar ${isOpen ? "open" : ""}`}
      >
        <div className="filter-header">
          <div className="filter-header-left">
            <span className="filter-icon">⚡</span>
            <h3 className="filter-title">Filters</h3>
            {activeCount > 0 && (
              <span className="filter-count">{activeCount}</span>
            )}
          </div>
          <button className="filter-close" onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-body">
          {filterSections.map(
            (section) =>
              section.items.length > 0 && (
                <div key={section.id} className="filter-section">
                  <button
                    className={`filter-section-header ${
                      activeSection === section.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setActiveSection(
                        activeSection === section.id ? null : section.id
                      )
                    }
                  >
                    <span className="filter-section-icon">{section.icon}</span>
                    <span className="filter-section-label">
                      {section.label}
                    </span>
                    {selectedFilters[
                      section.id as keyof typeof selectedFilters
                    ] &&
                      selectedFilters[
                        section.id as keyof typeof selectedFilters
                      ] !== "All" && (
                        <span className="filter-section-active-dot" />
                      )}
                    <svg
                      className={`filter-section-arrow ${
                        activeSection === section.id ? "open" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {activeSection === section.id && (
                    <div className="filter-section-content">
                      <button
                        className={`filter-chip ${
                          !selectedFilters[
                            section.id as keyof typeof selectedFilters
                          ] ||
                          selectedFilters[
                            section.id as keyof typeof selectedFilters
                          ] === "All"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => onFilterChange(section.id, "All")}
                      >
                        All
                      </button>
                      {section.items.map((item) => (
                        <button
                          key={item}
                          className={`filter-chip ${
                            selectedFilters[
                              section.id as keyof typeof selectedFilters
                            ] === item
                              ? "active"
                              : ""
                          }`}
                          onClick={() => onFilterChange(section.id, item)}
                        >
                          {section.id === "color" && (
                            <span
                              className="filter-color-dot"
                              style={{ backgroundColor: item.toLowerCase() }}
                            />
                          )}
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
          )}
        </div>

        <div className="filter-footer">
          {activeCount > 0 && (
            <button className="filter-clear-btn" onClick={onClearAll}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Clear All ({activeCount})
            </button>
          )}
          <button className="filter-apply-btn" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
