"use client";

import { Button } from "@/components/ui/button";
import { useI18n, type Locale } from "@/lib/i18n/client";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const locales: Locale[] = ["en", "fr"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  const localeLabels: Record<Locale, string> = {
    en: "English",
    fr: "Français",
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-2 gap-1"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm uppercase font-medium">{locale}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                l === locale ? "bg-accent font-medium" : ""
              }`}
            >
              <span className="uppercase font-bold mr-2">{l}</span>
              {localeLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
