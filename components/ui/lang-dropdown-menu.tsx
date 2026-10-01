"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Globe, X, Check } from "lucide-react";
import { AnimatedSearchClose } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import languagesData from "@/data/languages.json";
import {
  getLanguagePref,
  setLanguagePref,
  PREFERENCE_EVENT,
} from "@/lib/user-preferences";

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
}

export interface LangDropdownMenuProps {
  children?: React.ReactNode;
  value?: string;
  onChange?: (code: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

// Global scroll-lock helper matching marketing header & bottom-sheet
let scrollLockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyPaddingRight = "";

function lockBodyScroll() {
  if (typeof window === "undefined") return;
  if (scrollLockCount === 0) {
    const sbWidth = window.innerWidth - document.documentElement.clientWidth;
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("modal-open-no-scroll");
    if (sbWidth > 0) {
      document.body.style.paddingRight = `${sbWidth}px`;
      document.documentElement.style.setProperty(
        "--scrollbar-compensation",
        `${sbWidth}px`
      );
    }
  }
  scrollLockCount++;
}

function unlockBodyScroll() {
  if (typeof window === "undefined") return;
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow =
      originalBodyOverflow === "hidden" ? "" : originalBodyOverflow;
    document.documentElement.style.overflow =
      originalHtmlOverflow === "hidden" ? "" : originalHtmlOverflow;
    document.body.classList.remove("modal-open-no-scroll");
    document.body.style.paddingRight = originalBodyPaddingRight;
    document.documentElement.style.removeProperty("--scrollbar-compensation");
  }
}

export function LangDropdownMenu({
  children,
  value: controlledValue,
  onChange,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  className,
}: LangDropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [currentLang, setCurrentLang] = React.useState("en-IN");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isTabFocused, setIsTabFocused] = React.useState(false);
  const isKeyboardNavRef = React.useRef(false);

  const isControlledOpen = controlledOpen !== undefined;
  const isOpen = isControlledOpen ? controlledOpen : internalOpen;

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = React.useState<{
    bottom: number;
    left: number;
    width: number;
    height: number;
    top: number;
  } | null>(null);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setTriggerRect({
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          top: rect.top,
        });
      }
      if (isControlledOpen) {
        setControlledOpen?.(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }
      if (!nextOpen) {
        setSearch("");
        setIsTabFocused(false);
      }
    },
    [isControlledOpen, setControlledOpen]
  );

  // Sync language with preferences and listen for updates; default to "en-IN"
  React.useEffect(() => {
    setMounted(true);
    const update = () => {
      const pref = getLanguagePref();
      if (!pref || pref === "auto" || pref === "en") {
        setCurrentLang("en-IN");
      } else {
        setCurrentLang(pref);
      }
    };
    update();
    window.addEventListener(PREFERENCE_EVENT, update);
    return () => window.removeEventListener(PREFERENCE_EVENT, update);
  }, []);

  // Lock scroll and prevent content shift when open
  React.useEffect(() => {
    if (!isOpen) {
      setIsTabFocused(false);
      return;
    }
    lockBodyScroll();

    // Focus search input on open
    const timer = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isKeyboardNavRef.current = true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleOpenChange(false);
      }
    };

    const handleMouseDown = () => {
      isKeyboardNavRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDown, true);

    return () => {
      clearTimeout(timer);
      unlockBodyScroll();
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [isOpen, handleOpenChange]);

  const rawActiveCode = controlledValue !== undefined ? controlledValue : currentLang;
  const activeCode =
    !rawActiveCode || rawActiveCode === "auto" || rawActiveCode === "en"
      ? "en-IN"
      : rawActiveCode;

  const currentLanguageObj = React.useMemo(() => {
    return (languagesData as LanguageItem[]).find((l) => l.code === activeCode);
  }, [activeCode]);

  // Labels for the outside trigger button
  const { displayName, nativeLabel } = React.useMemo(() => {
    if (!currentLanguageObj || currentLanguageObj.code === "en-IN") {
      return { displayName: "English", nativeLabel: "India" };
    }
    if (currentLanguageObj.code === "en-US") {
      return { displayName: "English", nativeLabel: "United States" };
    }
    return {
      displayName: currentLanguageObj.name,
      nativeLabel:
        currentLanguageObj.nativeName !== currentLanguageObj.name
          ? currentLanguageObj.nativeName
          : undefined,
    };
  }, [currentLanguageObj]);

  const filteredLanguages = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return languagesData as LanguageItem[];

    return (languagesData as LanguageItem[]).filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [search]);

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    setLanguagePref(code);
    onChange?.(code);
    handleOpenChange(false);
  };

  const trigger = children ? (
    React.cloneElement(children as React.ReactElement, {
      ref: (node: HTMLButtonElement) => {
        (triggerRef as any).current = node;
        const childRef = (children as any).ref;
        if (typeof childRef === "function") childRef(node);
        else if (childRef) childRef.current = node;
      },
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement).props.onClick?.(e);
        handleOpenChange(true);
      },
    })
  ) : (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => handleOpenChange(true)}
      className={cn(
        "group flex items-center text-base gap-2 px-4 py-3 rounded-full select-none",
        "bg-white dark:bg-[#2f2f2f] dark:hover:bg-[#383838] text-foreground",
        "whitespace-nowrap cursor-pointer border border-border/80 dark:border-none",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors",
        className
      )}
      aria-label="Select language"
    >
      <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
      <span className="font-medium text-foreground text-base">
        {mounted ? displayName : "English"}
      </span>
      {mounted && nativeLabel && (
        <span className="font-normal text-muted-foreground text-sm">
          {nativeLabel}
        </span>
      )}
    </button>
  );

  return (
    <>
      {trigger}

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] select-none">
            <div
              className="fixed inset-0 bg-background/80 cursor-default"
              onClick={() => handleOpenChange(false)}
            />

            {/* Bottom-anchored Container overlapping the trigger button */}
            <div
              className="fixed z-[101] flex flex-col items-center pointer-events-none px-4"
              style={{
                bottom: triggerRect
                  ? `${Math.max(12, Math.round(window.innerHeight - triggerRect.bottom - (48 - triggerRect.height) / 2))}px`
                  : "16px",
                left: triggerRect
                  ? `${Math.round(triggerRect.left + triggerRect.width / 2)}px`
                  : "50%",
                transform: "translateX(-50%)",
                width: "100%",
                maxWidth: "380px",
              }}
            >
              <div
                className="w-full flex flex-col pointer-events-auto space-y-2.5"
                role="dialog"
                aria-modal="true"
                aria-label="Select language"
              >
                {/* Top Box: Languages List Card */}
                <div
                  className={cn(
                    "flex flex-col rounded-3xl overflow-hidden",
                    "bg-[#2f2f2f] text-foreground",
                    "border border-border/80 dark:border-none",
                    filteredLanguages.length === 0
                      ? "h-auto"
                      : "h-[calc(100dvh-100px)] sm:h-[calc(100dvh-50px)] max-h-[1000px]"
                  )}
                  style={
                    filteredLanguages.length > 0 && triggerRect
                      ? {
                          maxHeight: `${Math.min(1000, Math.max(300, triggerRect.top - 15))}px`,
                        }
                      : undefined
                  }
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 dark:border-white/10 shrink-0">
                    <h2 className="text-xl font-semibold text-foreground">
                      Select language
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleOpenChange(false)}
                      className={cn(
                        "p-3 rounded-full flex items-center justify-center cursor-pointer transition-colors",
                        "text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838]",
                        "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                      aria-label="Close language selector"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Dynamic Content */}
                  {filteredLanguages.length === 0 ? (
                    <div className="py-12 px-4 text-center shrink-0">
                      <p className="text-base font-medium text-foreground">
                        No languages found
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 h-full overflow-y-auto px-1.5 py-1.5 scrollbar-thin">
                      <div className="space-y-0.5">
                        {filteredLanguages.map((lang) => {
                          const isSelected = activeCode === lang.code;

                          const itemTitle =
                            lang.code === "en-IN"
                              ? "English"
                              : lang.code === "en-US"
                              ? "English"
                              : lang.nativeName;

                          const itemSubtitle =
                            lang.code === "en-IN"
                              ? "English (India)"
                              : lang.code === "en-US"
                              ? "English (United States)"
                              : lang.name;

                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => handleSelectLanguage(lang.code)}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838] cursor-pointer transition-colors
                                focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <div className="flex flex-col min-w-0 pr-3">
                                <span className="text-base font-medium leading-snug truncate text-foreground">
                                  {itemTitle}
                                </span>
                                <span className="text-sm text-muted-foreground leading-snug truncate">
                                  {itemSubtitle}
                                </span>
                              </div>

                              {isSelected && (
                                <div className="p-2 rounded-full bg-background flex items-center justify-center shrink-0">
                                  <Check className="w-5 h-5 text-foreground" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Box: Search Bar with animated search/close button and tab-only focus line */}
                <div className="group relative w-full shrink-0">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (search) {
                        setSearch("");
                        inputRef.current?.focus();
                      } else {
                        inputRef.current?.focus();
                      }
                    }}
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-10",
                      search
                        ? "text-foreground cursor-pointer hover:opacity-90"
                        : "text-muted-foreground group-focus-within:text-foreground cursor-text"
                    )}
                    aria-label={search ? "Clear search" : "Search"}
                  >
                    <AnimatedSearchClose
                      isOpen={Boolean(search.trim())}
                      size={18}
                    />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !isTabFocused && !e.shiftKey) {
                        e.preventDefault();
                        setIsTabFocused(true);
                        return;
                      }
                      if (e.key === "Escape" && search) {
                        e.stopPropagation();
                        setSearch("");
                      }
                    }}
                    onFocus={() => {
                      if (isKeyboardNavRef.current) {
                        setIsTabFocused(true);
                      }
                    }}
                    onBlur={() => {
                      setIsTabFocused(false);
                    }}
                    onMouseDown={() => {
                      isKeyboardNavRef.current = false;
                      setIsTabFocused(false);
                    }}
                    placeholder="Search"
                    aria-label="Search"
                    className={cn(
                      "w-full h-12 rounded-full pl-12 pr-4 text-base placeholder:text-muted-foreground focus:placeholder:text-foreground",
                      "bg-[#2f2f2f] border border-border/80 dark:border-none",
                      "outline-none focus:outline-none",
                      isTabFocused &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-background",
                      "transition-colors"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default LangDropdownMenu;
