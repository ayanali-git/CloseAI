"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { AnimatedChevron } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import countriesData from "@/data/countries.json";

export interface CountryItem {
  name: string;
  code: string;
  code3: string;
  flag: string;
  dial_code: string;
}

export interface CountDropdownMenuProps {
  value: string;
  onChange: (country: CountryItem) => void;
  className?: string;
}

export function CountDropdownMenu({
  value,
  onChange,
  className,
}: CountDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const countries = React.useMemo(() => countriesData as CountryItem[], []);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCountry = React.useMemo(
    () => countries.find((c) => c.code === value) || countries[0],
    [countries, value]
  );

  const updateRect = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleToggle = React.useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      updateRect();
      setIsOpen(true);
    }
  }, [isOpen, updateRect]);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = React.useCallback(
    (country: CountryItem) => {
      onChange(country);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Scroll to selected item when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        selectedItemRef.current?.scrollIntoView({ block: "center" });
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle window resize and reposition
  React.useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updateRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isOpen, updateRect]);

  // Keyboard navigation: Escape to close, type-ahead to jump to country
  const searchBufferRef = React.useRef("");
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        triggerRef.current?.focus();
        return;
      }

      // Type-ahead jump
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchBufferRef.current += e.key.toLowerCase();
        searchTimeoutRef.current = setTimeout(() => {
          searchBufferRef.current = "";
        }, 500);

        const match = countries.find((c) =>
          c.name.toLowerCase().startsWith(searchBufferRef.current)
        );
        if (match) {
          const el = listRef.current?.querySelector(
            `[data-code="${match.code}"]`
          ) as HTMLElement;
          if (el) {
            el.scrollIntoView({ block: "nearest" });
            el.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [isOpen, countries, handleClose]);

  return (
    <>
      {/* Trigger Button (Row 1) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "w-full h-12 rounded-full bg-background border border-border/80 px-4",
          "flex items-center gap-3 text-left cursor-pointer select-none",
          "transition-colors",
          "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
          srcSet={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png 2x`}
          alt=""
          className="w-5 h-3.5 object-cover rounded-[2px] shrink-0"
          draggable={false}
        />
        <span className="flex-1 text-base text-foreground font-normal truncate">
          {selectedCountry.name} ({selectedCountry.dial_code})
        </span>
        <AnimatedChevron
          isOpen={isOpen}
          disableHover
          size={18}
          className="text-muted-foreground shrink-0"
        />
      </button>

      {/* Portal: Dropdown List positioned above trigger */}
      {mounted &&
        isOpen &&
        triggerRect &&
        createPortal(
          <div className="fixed inset-0 z-[105] select-none">
            {/* Click-away backdrop */}
            <div
              className="fixed inset-0 cursor-default"
              onClick={handleClose}
            />

            {/* Dropdown Box matching lang-dropdown-menu type with inner scrollbar */}
            <div
              className={cn(
                "fixed z-[106] flex flex-col rounded-3xl overflow-hidden",
                "bg-background",
                "border border-border/80"
              )}
              style={{
                bottom: `${Math.max(8, window.innerHeight - triggerRect.top + 6)}px`,
                left: `${triggerRect.left}px`,
                width: `${triggerRect.width}px`,
                maxHeight: `${Math.min(320, Math.max(160, triggerRect.top - 16))}px`,
              }}
            >
              <div
                ref={listRef}
                role="listbox"
                aria-label="Select country"
                className="flex-1 min-h-0 h-full overflow-y-auto px-1.5 py-1.5 scrollbar-thin"
              >
                <div className="space-y-0.5">
                  {countries.map((country) => {
                    const isSelected = country.code === value;
                    return (
                      <button
                        key={country.code}
                        data-code={country.code}
                        ref={isSelected ? selectedItemRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(country)}
                        className="relative w-full flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-secondary text-foreground text-left cursor-pointer transition-colors focus-visible:outline-none focus:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          srcSet={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded-[2px] shrink-0"
                          loading="lazy"
                          draggable={false}
                        />
                        <span className="flex-1 text-sm font-normal text-foreground truncate">
                          {country.name} ({country.dial_code})
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-foreground shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default CountDropdownMenu;
