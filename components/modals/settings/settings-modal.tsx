"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  Settings2,
  Sparkles,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { AnimatedSearchClose } from "@/components/ui/animated";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { LoginModal } from "@/components/modals/log-in-modal";
import { AccountPanel } from "@/components/modals/settings/account-panel";
import { DataPanel } from "@/components/modals/settings/data-panel";
import { GeneralPanel } from "@/components/modals/settings/general-panel";
import { NotificationsPanel } from "@/components/modals/settings/notifications-panel";
import { PasswordPanel } from "@/components/modals/settings/password-panel";
import { PersonalizationPanel } from "@/components/modals/settings/personalization-panel";
import { PlansPanel } from "@/components/modals/settings/plans-panel";
import { ProfilePanel } from "@/components/modals/settings/profile-panel";
import { useAuth } from "@/hooks/use-auth";
import {
  closeSettings,
  openSettings,
  parseSettingsHash,
  resolveVisibleSettingsSection,
  type SettingsSection,
} from "@/lib/settings-hash";
import { applyStoredAppearance } from "@/lib/user-preferences";
import { NativeDropdownMenu, type DropdownOption } from "@/components/ui/native-dropdown-menu";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/settings-panel";

const TITLES: Record<SettingsSection, string> = {
  general: "Settings",
  notifications: "Notifications",
  personalization: "Personalization",
  profile: "Profile",
  plans: "Plans",
  account: "Account",
  password: "Password",
  data: "Controls",
};

const PANE_MOTION =
  "transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none";

const DARK_HOVER_BG = {
  guest: "dark:hover:bg-[#383838]",
  auth: "dark:hover:bg-[#2f2f2f]",
} as const;

const DARK_SELECTED_BG = {
  guest: "dark:bg-[#383838]",
  auth: "dark:bg-[#2f2f2f]",
} as const;

export function SettingsModal({
  open,
  section,
}: {
  open: boolean;
  section: SettingsSection | "root";
}) {
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  // True once the section content has been scrolled away from the top.
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchTabFocused, setIsSearchTabFocused] = useState(false);
  const isSearchKeyboardNavRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [navEl, setNavEl] = useState<HTMLElement | null>(null);
  const [isNavOverflowing, setIsNavOverflowing] = useState(false);
  const visibleNav = NAV.filter((item) => !item.auth || user);
  const isGuest = !loading && !user;

  // The search bar is only for signed-in users. `Boolean(user)` (instead of
  // `!isGuest`) means it never flashes on screen while auth is still loading.
  const showSearch = Boolean(user);

  // Dark hover / selected bg, same rule as the native dropdown menu
  const darkHover = isGuest ? DARK_HOVER_BG.guest : DARK_HOVER_BG.auth;
  const darkSelected = isGuest ? DARK_SELECTED_BG.guest : DARK_SELECTED_BG.auth;

  // Search works on every screen size for signed-in users (same header on
  // mobile and desktop). Guests never filter, even if a stale query exists.
  const normalizedQuery = showSearch ? query.trim().toLowerCase() : "";
  const filteredNav = normalizedQuery
    ? visibleNav.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery)
      )
    : visibleNav;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1025);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track Tab navigation vs mouse click for search bar focus ring
  useEffect(() => {
    if (!open) {
      setIsSearchTabFocused(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isSearchKeyboardNavRef.current = true;
      }
    };
    const handleMouseDown = () => {
      isSearchKeyboardNavRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [open]);

  // Reset search whenever the modal closes or the search bar goes away
  // (e.g. the user signs out while the modal is open)
  useEffect(() => {
    if (!open || !showSearch) {
      setQuery("");
      setIsSearchTabFocused(false);
    }
  }, [open, showSearch]);

  const [lastSection, setLastSection] = useState<SettingsSection>("general");
  if (section !== "root" && section !== lastSection) {
    setLastSection(section);
  }

  const atRoot = section === "root";
  const active: SettingsSection =
    section !== "root" ? section : isMobile ? lastSection : "general";
  const showMobileNav = isMobile && atRoot;
  const navItem = NAV.find((item) => item.id === active);
  const needsAuth = Boolean(navItem?.auth) && !user && !loading;

  // Clear the search only after the list has finished sliding away, so the
  // items don't jump while the pane is still on screen.
  useEffect(() => {
    if (!isMobile || section === "root") return;
    const id = window.setTimeout(() => setQuery(""), 350);
    return () => window.clearTimeout(id);
  }, [isMobile, section]);

  // Switching to a different section starts at the top of its content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [active]);

  // The title bar stays pinned; its bottom border only appears once content
  // has actually scrolled underneath it.
  const showHeaderBorder = isOverflowing && scrolled;

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) {
      setIsOverflowing(false);
      return;
    }

    const check = () => {
      // +1px tolerance for subpixel rounding so borderline-fit content
      // doesn't flicker into a scroll state it doesn't need.
      setIsOverflowing(contentEl.scrollHeight > scrollEl.clientHeight + 1);
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(scrollEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [active, open, needsAuth]);

  useEffect(() => {
    if (!navEl) return;

    const check = () => {
      // +1px tolerance for subpixel rounding, same as the content area.
      setIsNavOverflowing(navEl.scrollHeight > navEl.clientHeight + 1);
    };

    check();

    // Nav box changes with the sheet / keyboard / rotation; the items change
    // with the search filter, so watch both.
    const observer = new ResizeObserver(check);
    observer.observe(navEl);
    Array.from(navEl.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [navEl, filteredNav.length, showMobileNav, isMobile]);

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) closeSettings();
        }}
        snapPoints={[0.92]}
        maxSnap={0.92}
        unpadded
        className={cn(
          "rounded-t-3xl min-[1025px]:rounded-3xl",
          isGuest
            ? "min-[1025px]:max-w-[1000px] min-[1025px]:h-[min(500px,90vh)]"
            : "min-[1025px]:max-w-[750px] min-[1025px]:h-[min(500px,90vh)]",
          // Guest chat pages (/gc, /gc/[id]): same surface as the guest chat input
          isGuest &&
            "bg-white dark:bg-[#2f2f2f] border border-border/80"
        )}
      >
        {/* Mobile: both panes are stacked and slide horizontally (like a native
            navigation stack). Desktop: normal side-by-side layout. */}
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden min-[1025px]:flex-row min-[1025px]:overflow-visible">
          <aside
            className={cn(
              "absolute inset-0 flex flex-col border-border/80",
              PANE_MOTION,
              // Open a section -> list slides out to the left.
              // Back -> list slides in from the left.
              atRoot ? "translate-x-0 visible" : "-translate-x-full invisible",
              // Desktop: static sidebar, never animated or hidden
              "min-[1025px]:static min-[1025px]:inset-auto min-[1025px]:w-[220px] min-[1025px]:shrink-0",
              "min-[1025px]:translate-x-0 min-[1025px]:visible min-[1025px]:transition-none",
              "min-[1025px]:border-r dark:min-[1025px]:border-white/10"
            )}
          >
            {/* Same header on every screen size: close button top-left, plus a
                rounded search bar for signed-in users only */}
            <div className="flex flex-col gap-3 px-3 pt-2 pb-3 min-[1025px]:pt-3">
              <button
                type="button"
                onClick={() => closeSettings()}
                className={cn(
                  "w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer transition-colors",
                  darkHover
                )}
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
              {showSearch ? (
                <div className="group relative">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (query) {
                        setQuery("");
                        searchInputRef.current?.focus();
                      } else {
                        searchInputRef.current?.focus();
                      }
                    }}
                    className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-10",
                      query
                        ? "text-foreground cursor-pointer hover:opacity-80"
                        : "text-muted-foreground group-focus-within:text-foreground cursor-text"
                    )}
                    aria-label={query ? "Clear search" : "Search"}
                  >
                    <AnimatedSearchClose
                      isOpen={Boolean(query.trim())}
                      size={16}
                    />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !isSearchTabFocused && !e.shiftKey) {
                        e.preventDefault();
                        setIsSearchTabFocused(true);
                        return;
                      }
                      if (e.key === "Escape" && query) {
                        e.stopPropagation();
                        setQuery("");
                      }
                    }}
                    onFocus={() => {
                      if (isSearchKeyboardNavRef.current) {
                        setIsSearchTabFocused(true);
                      }
                    }}
                    onBlur={() => {
                      setIsSearchTabFocused(false);
                    }}
                    onMouseDown={() => {
                      isSearchKeyboardNavRef.current = false;
                      setIsSearchTabFocused(false);
                    }}
                    placeholder="Search"
                    aria-label="Search"
                    // 16px on small screens so iOS Safari doesn't zoom the page on focus
                    className={cn(
                      "w-full h-10 rounded-full bg-transparent border border-border/80 dark:border-white/10 pl-10 pr-4 text-base min-[1025px]:text-[15px] focus:placeholder:text-foreground placeholder:text-muted-foreground outline-none focus:outline-none transition-colors",
                      isSearchTabFocused &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    )}
                  />
                </div>
              ) : null}
            </div>

            <nav
              ref={setNavEl}
              className={cn(
                // min-h-0 lets the list shrink to the sheet so overflow can be detected
                "flex-1 min-h-0 px-2 pt-1 pb-4",
                isNavOverflowing
                  ? "overflow-y-auto overscroll-contain"
                  : // Everything fits: no scrollbar, no touch drag, no rubber-band
                    "overflow-hidden touch-none"
              )}
            >
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const selected = !showMobileNav && active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    // The search is cleared by the effect above once the list
                    // has slid out of view, not here.
                    onClick={() => openSettings(item.id)}
                    className={cn(
                      "group relative w-full flex items-center gap-2.5 rounded-sm px-3 text-[15px] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:z-10 transition-colors",
                      isMobile
                        ? "py-3"
                        : "py-2",
                      selected
                        ? // Selected row: same lighter bg as the dropdown highlight
                          cn("bg-secondary text-foreground", darkSelected)
                        : // Hover row: same lighter bg as the dropdown highlight
                          cn("text-muted-foreground hover:bg-secondary", darkHover)
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 group-hover:text-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="w-5 h-5 min-[1025px]:hidden opacity-50 group-hover:text-foreground" />
                  </button>
                );
              })}
              {normalizedQuery && filteredNav.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No results found
                </p>
              ) : null}
            </nav>
          </aside>

          <section
            className={cn(
              "absolute inset-0 flex flex-col min-w-0 min-h-0",
              PANE_MOTION,
              // Open a section -> pane slides in from the right.
              // Back -> pane slides out to the right.
              atRoot ? "translate-x-full invisible" : "translate-x-0 visible",
              // Desktop: fills the space next to the sidebar, never animated
              "min-[1025px]:static min-[1025px]:inset-auto min-[1025px]:flex-1",
              "min-[1025px]:translate-x-0 min-[1025px]:visible min-[1025px]:transition-none"
            )}
          >
            <div
              className={cn(
                "shrink-0 flex items-center gap-2 px-3 min-[1025px]:px-6 pt-2 min-[1025px]:pt-4 pb-3 border-b transition-colors duration-200",
                showHeaderBorder ? "border-border/80 dark:border-white/10" : "border-transparent"
              )}
            >
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => openSettings("root")}
                  className={cn(
                    "w-10 h-10 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary cursor-pointer transition-colors",
                    darkHover
                  )}
                  aria-label="Back to settings"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : null}
              <h3 className="text-lg font-semibold tracking-tight text-foreground flex-1">
                {TITLES[active]}
              </h3>
              {/* Close button removed on large screens (moved to sidebar top-left) */}
            </div>
            <div
              ref={scrollRef}
              onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
              className={cn(
                "flex-1 min-h-0",
                isOverflowing
                  ? "overflow-y-auto overscroll-contain"
                  : "overflow-visible"
              )}
            >
              <div ref={contentRef}>
                <div className="px-4 min-[1025px]:px-6 pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] min-[1025px]:pb-6">
                  <SettingsSectionBody section={active} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}

function SettingsSectionBody({ section }: { section: SettingsSection }) {
  switch (section) {
    case "general":
      return <GeneralPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "personalization":
      return <PersonalizationPanel />;
    case "profile":
      return <ProfilePanel />;
    case "plans":
      return <PlansPanel />;
    case "account":
      return <AccountPanel />;
    case "password":
      return <PasswordPanel />;
    case "data":
      return <DataPanel />;
    default:
      return <GeneralPanel />;
  }
}

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/80 last:border-b-0">
      <div className="min-w-0 pr-3">
        <p className="text-[15px] text-foreground leading-snug">{label}</p>
        {description ? (
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const { user, loading } = useAuth();
  const isGuest = !loading && !user;

  return (
    <NativeDropdownMenu
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={ariaLabel}
      // Trigger hover (the "System v" button) uses the same dark hover bg as
      // the dropdown rows instead of the much darker bg-secondary.
      triggerClassName={isGuest ? DARK_HOVER_BG.guest : DARK_HOVER_BG.auth}
    />
  );
}

export function SettingsPanelSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="h-4 w-28 rounded-sm bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
      <div className="h-12 w-full rounded-sm bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
      <div className="h-12 w-full rounded-sm bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
      <div className="h-12 w-full rounded-sm bg-secondary/70 dark:bg-neutral-800/50 animate-pulse" />
    </div>
  );
}

export function SettingsHost() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection | "root">("root");

  useEffect(() => {
    applyStoredAppearance();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isSectionVisible = (s: SettingsSection) => {
      const navItem = NAV.find((item) => item.id === s);
      return !navItem?.auth || Boolean(user);
    };

    const sync = () => {
      const parsed = parseSettingsHash(window.location.hash);
      if (!parsed) {
        setOpen(false);
        return;
      }
      const resolved = resolveVisibleSettingsSection(parsed, isSectionVisible);
      if (!resolved) {
        setOpen(false);
        return;
      }
      setSection(resolved);
      setOpen(true);
    };

    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [user, loading]);

  return <SettingsModal open={open} section={section} />;
}