"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { AnimatedChevron, AnimatedSearchClose } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
  isGuest?: boolean;
}

export function CountDropdownMenu({
  value,
  onChange,
  className,
  isGuest: isGuestProp,
}: CountDropdownMenuProps) {
  const { user, loading: authLoading } = useAuth();
  const isGuest = isGuestProp !== undefined ? isGuestProp : (!authLoading && !user);
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState("");
  const [isListScrolled, setIsListScrolled] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const countries = React.useMemo(() => countriesData as CountryItem[], []);

  const filteredCountries = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    const cleanQ = q.startsWith("+") ? q.slice(1) : q;
    return countries.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const codeMatch =
        c.code.toLowerCase().includes(q) ||
        (c.code3 && c.code3.toLowerCase().includes(q));
      const dialClean = c.dial_code.replace("+", "");
      const dialMatch = c.dial_code.includes(q) || dialClean.startsWith(cleanQ);
      return nameMatch || codeMatch || dialMatch;
    });
  }, [countries, search]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Autofocus search input when dropdown opens, clear search on close, reset scroll to top
  React.useEffect(() => {
    if (isOpen) {
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
      setIsListScrolled(false);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      }, 40);
      return () => clearTimeout(timer);
    } else {
      setSearch("");
      setIsListScrolled(false);
    }
  }, [isOpen]);

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

  // Keyboard navigation: Escape to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Trigger Button (Row 1) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "group w-full h-12 rounded-full border border-border/80 px-4",
          "flex items-center gap-3 text-left cursor-pointer select-none",
          "transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
          isGuest
            ? "bg-white dark:bg-[#2f2f2f] dark:border-white/10"
            : "bg-background",
          className
        )}
        style={{ outline: "none" }}
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
          size={20}
          className="text-muted-foreground group-focus:text-foreground shrink-0"
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

            {/* Dropdown Box matching lang-dropdown-menu type with inner scrollbar and consistent height */}
            <div
              className={cn(
                "fixed z-[106] flex flex-col rounded-3xl overflow-hidden",
                isGuest
                  ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-white/10"
                  : "bg-background border border-border/80"
              )}
              style={{
                bottom: `${Math.max(8, window.innerHeight - triggerRect.top + 6)}px`,
                left: `${triggerRect.left}px`,
                width: `${triggerRect.width}px`,
                height: `${Math.min(388, Math.max(160, triggerRect.top - 16))}px`,
                maxHeight: `${Math.min(388, Math.max(160, triggerRect.top - 16))}px`,
              }}
            >
              {/* Search Bar Header styled same like phone number input field */}
              <div
                className={cn(
                  "p-2.5 pb-2 border-b shrink-0 transition-colors duration-200",
                  isListScrolled
                    ? "border-border/80 dark:border-white/10"
                    : "border-transparent"
                )}
              >
                <div
                  className={cn(
                    "h-12 rounded-full border px-4 flex items-center gap-3 transition-all w-full",
                    "border-border/80 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-white",
                    isGuest
                      ? "bg-white dark:bg-[#2f2f2f] dark:border-white/10 dark:ring-offset-[#2f2f2f] dark:focus-within:ring-offset-[#2f2f2f]"
                      : "bg-background dark:ring-offset-background dark:focus-within:ring-offset-background"
                  )}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (search) {
                        setSearch("");
                        setIsListScrolled(false);
                        searchInputRef.current?.focus();
                      } else {
                        searchInputRef.current?.focus();
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center transition-colors shrink-0",
                      search
                        ? "text-foreground cursor-pointer hover:opacity-80"
                        : "text-muted-foreground group-focus-within:text-foreground cursor-text"
                    )}
                    aria-label={search ? "Clear search" : "Search"}
                  >
                    <AnimatedSearchClose
                      isOpen={Boolean(search.trim())}
                      size={20}
                    />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setIsListScrolled(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        if (search) {
                          e.stopPropagation();
                          setSearch("");
                          setIsListScrolled(false);
                        } else {
                          handleClose();
                        }
                      } else if (e.key === "Enter" && filteredCountries.length > 0) {
                        e.preventDefault();
                        handleSelect(filteredCountries[0]);
                      }
                    }}
                    placeholder="Search countries"
                    aria-label="Search countries"
                    className="w-full h-full bg-transparent text-base placeholder:text-foreground outline-none border-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div
                ref={listRef}
                role="listbox"
                aria-label="Select country"
                onScroll={(e) => {
                  const isScrolled = e.currentTarget.scrollTop > 0;
                  if (isListScrolled !== isScrolled) {
                    setIsListScrolled(isScrolled);
                  }
                }}
                className={cn(
                  "flex-1 min-h-0 h-full overflow-y-auto px-1.5 py-1.5 scrollbar-thin",
                  filteredCountries.length === 0 && "flex flex-col items-center justify-center"
                )}
              >
                {filteredCountries.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center select-none">
                    <p className="text-base font-medium text-foreground">
                      No countries found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredCountries.map((country) => {
                      const isSelected = country.code === value;
                      return (
                        <button
                          key={country.code}
                          data-code={country.code}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(country)}
                          className={cn(
                            "relative w-full flex items-center gap-3 px-4 py-3 rounded-sm text-foreground text-left cursor-pointer transition-colors outline-none focus:outline-none",
                            isGuest
                              ? "hover:bg-secondary dark:hover:bg-[#383838] focus:bg-secondary dark:focus:bg-[#383838]"
                              : "hover:bg-secondary focus:bg-secondary"
                          )}
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
                            <Check className="w-5 h-5 text-foreground shrink-0 stroke-[2]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default CountDropdownMenu;
