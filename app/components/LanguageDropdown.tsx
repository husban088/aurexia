// app/components/LanguageDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { SupportedLanguage } from "@/lib/translations";

const LANG_FLAGS: Record<SupportedLanguage, string> = {
  en: "🇬🇧",
  ar: "🇦🇪",
  de: "🇩🇪",
};

interface LanguageDropdownProps {
  className?: string;
}

export default function LanguageDropdown({
  className = "",
}: LanguageDropdownProps) {
  const {
    language,
    setLanguage,
    showLanguageDropdown,
    availableLanguages,
    t,
    isRTLMode,
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!showLanguageDropdown || availableLanguages.length === 0) return null;

  const currentLang = availableLanguages.find((l) => l.code === language);

  return (
    <div ref={dropdownRef} className={`language-dropdown-wrapper ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="lang-trigger"
        aria-label={t.common.selectLanguage}
        aria-expanded={isOpen}
      >
        <span className="lang-flag">{LANG_FLAGS[language]}</span>
        <span className="lang-name">
          {currentLang?.nativeName || "English"}
        </span>
        <svg
          className={`lang-chevron ${isOpen ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="lang-menu" role="listbox">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={language === lang.code}
              className={`lang-option ${language === lang.code ? "active" : ""}`}
              onClick={() => {
                setLanguage(lang.code as SupportedLanguage);
                setIsOpen(false);
              }}
            >
              <span className="lang-flag">{LANG_FLAGS[lang.code]}</span>
              <div className="lang-texts">
                <span className="lang-native">{lang.nativeName}</span>
                <span className="lang-english">{lang.name}</span>
              </div>
              {language === lang.code && (
                <svg
                  className="lang-check"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M2 7L5.5 10.5L12 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .language-dropdown-wrapper {
          position: relative;
        }

        .lang-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(218, 165, 32, 0.08);
          border: 1px solid rgba(218, 165, 32, 0.25);
          border-radius: 40px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .lang-trigger:hover {
          background: rgba(218, 165, 32, 0.15);
          border-color: rgba(218, 165, 32, 0.5);
          transform: translateY(-1px);
        }

        .lang-flag {
          font-size: 16px;
          line-height: 1;
        }

        .lang-name {
          font-size: 12px;
          font-weight: 600;
        }

        .lang-chevron {
          transition: transform 0.2s ease;
          opacity: 0.6;
        }

        .lang-chevron.open {
          transform: rotate(180deg);
        }

        .lang-menu {
          position: absolute;
          top: calc(100% + 12px);
          ${isRTLMode ? "left: 0;" : "right: 0;"}
          background: white;
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          z-index: 1000;
          min-width: 200px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: ${isRTLMode ? "right" : "left"};
          transition: background 0.15s ease;
        }

        .lang-option:hover {
          background: rgba(218, 165, 32, 0.07);
        }

        .lang-option.active {
          background: rgba(218, 165, 32, 0.1);
        }

        .lang-texts {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }

        ${isRTLMode &&
        `
          .lang-texts {
            align-items: flex-end;
          }
        `}

        .lang-native {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .lang-english {
          font-size: 10px;
          color: #888;
        }

        .lang-check {
          color: #daa520;
          flex-shrink: 0;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .lang-name {
            display: none;
          }

          .lang-trigger {
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  );
}
