"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowUp, ArrowLeft } from "lucide-react";
import { CloseAIIcon } from "@/components/brand/logo";
import {
  AnimatedArrow,
  AnimatedChevron,
  AnimatedSearchClose,
  AnimatedPanelToggle,
  AnimatedComingSoonText,
  AnimatedArrowUpRight,
} from "@/components/ui/animated";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogoutModal } from "@/components/modals/log-out-modal";
import { LoginModal } from "@/components/modals/log-in-modal";
import { cn } from "@/lib/utils";

type MegaMenuCategory =
  | "research"
  | "products"
  | "business"
  | "developers"
  | "company"
  | "account"
  | null;

interface SiteSearchItem {
  id: string;
  category: string;
  title: string;
  description: string;
  url: string;
  date?: string;
  keywords: string[];
}

const SITE_SEARCH_INDEX: SiteSearchItem[] = [
  {
    id: "res-56",
    category: "Research",
    title: "GPT-5.6 Frontier Model & Safety",
    description:
      "Our newest flagship model featuring enhanced multi-step reasoning, real-time multimodal processing, and breakthrough code synthesis capabilities.",
    url: "/research/overview",
    date: "Sep 2026",
    keywords: [
      "5.6",
      "GPT-5.6",
      "flagship",
      "model",
      "multimodal",
      "reasoning",
      "research",
    ],
  },
  {
    id: "res-55",
    category: "Research",
    title: "GPT-5.5 Deep Reasoning Architecture",
    description:
      "In-depth analysis of high-efficiency reasoning models with step-by-step chain of thought verification.",
    url: "/research/overview",
    date: "Aug 2026",
    keywords: [
      "5.5",
      "reasoning",
      "chain of thought",
      "overview",
      "benchmarks",
    ],
  },
  {
    id: "res-safety",
    category: "Security",
    title: "Safety Framework & Red Teaming",
    description:
      "Systematic evaluations, automated red teaming, and alignment protocols ensuring AI systems are safe, reliable, and beneficial.",
    url: "/research/safety",
    date: "Jul 2026",
    keywords: [
      "safety",
      "security",
      "red teaming",
      "alignment",
      "evaluations",
      "policy",
      "privacy",
    ],
  },
  {
    id: "res-residency",
    category: "Research",
    title: "Research Residency Program",
    description:
      "An intensive six-month program for researchers and engineers transitioning into frontier AI research.",
    url: "/research/overview",
    keywords: ["residency", "fellowship", "careers", "researchers", "program"],
  },
  {
    id: "prod-chat",
    category: "Products",
    title: "CloseAI Chat",
    description:
      "Interactive AI assistant for conversation, coding, analysis, content creation, and creative problem solving.",
    url: "/c",
    keywords: [
      "chat",
      "closeai chat",
      "assistant",
      "ui",
      "conversation",
      "app",
    ],
  },
  {
    id: "prod-codex",
    category: "Products",
    title: "Codex & Canvas",
    description:
      "Collaborative interactive workspace and advanced code editor powered by CloseAI for pair programming and document editing.",
    url: "/product/features",
    keywords: [
      "codex",
      "canvas",
      "features",
      "editor",
      "code",
      "pair programming",
      "workspace",
    ],
  },
  {
    id: "prod-pricing",
    category: "Products",
    title: "Pricing & Subscription Plans",
    description:
      "Flexible plans for individuals, teams, and enterprises including Free, Pro, and Ultra Pro tiers.",
    url: "/product/pricing",
    keywords: [
      "pricing",
      "pro",
      "ultra",
      "plans",
      "subscription",
      "cost",
      "billing",
      "upgrade",
    ],
  },
  {
    id: "prod-features",
    category: "Products",
    title: "Product Features & Capabilities",
    description:
      "Explore vision processing, real-time voice, code execution, web browsing, and custom instructions.",
    url: "/product/features",
    keywords: [
      "features",
      "capabilities",
      "vision",
      "voice",
      "browsing",
      "tools",
    ],
  },
  {
    id: "biz-enterprise",
    category: "Business",
    title: "Enterprise Solutions & Deployment",
    description:
      "Enterprise-grade AI with SOC 2 compliance, SAML SSO, dedicated infrastructure, and zero data retention guarantees.",
    url: "/business/enterprise",
    keywords: [
      "enterprise",
      "business",
      "solutions",
      "sso",
      "security",
      "teams",
      "compliance",
      "soc2",
    ],
  },
  {
    id: "biz-stories",
    category: "Partner",
    title: "Customer Stories & Case Studies",
    description:
      "See how leading global organizations transform workflows, engineering productivity, and customer support with CloseAI.",
    url: "/business/enterprise",
    keywords: [
      "customer stories",
      "case studies",
      "stories",
      "partners",
      "enterprise",
    ],
  },
  {
    id: "dev-api",
    category: "Developers",
    title: "API Platform & Documentation",
    description:
      "Build next-generation applications with CloseAI APIs for text completion, chat, embeddings, and vision.",
    url: "/product/api-docs",
    keywords: [
      "api",
      "docs",
      "documentation",
      "developers",
      "sdk",
      "endpoints",
      "integration",
      "rest",
    ],
  },
  {
    id: "dev-apps",
    category: "Page",
    title: "Download App",
    description:
      "Get native Apps for macOS, Windows, iOS, and Android for instant keyboard shortcuts and offline access.",
    url: "/product/docs",
    date: "Jun 2026",
    keywords: [
      "download",
      "app",
      "mobile",
      "ios",
      "android",
    ],
  },
  {
    id: "comp-about",
    category: "Company",
    title: "About CloseAI",
    description:
      "Our mission is to build safe, beneficial artificial general intelligence that elevates human potential.",
    url: "/company/about",
    keywords: ["about", "company", "mission", "values", "team", "story"],
  },
  {
    id: "comp-blog",
    category: "Page",
    title: "Release Notes & Blog",
    description:
      "Stay up to date with new features, model updates, research papers, and technical announcements.",
    url: "/company/blog",
    date: "Sep 2026",
    keywords: [
      "blog",
      "release notes",
      "news",
      "announcements",
      "updates",
      "changelog",
    ],
  },
  {
    id: "comp-careers",
    category: "Company",
    title: "Careers & Open Positions",
    description:
      "Join our team of researchers, engineers, and designers building the future of artificial intelligence.",
    url: "/company/careers",
    keywords: ["careers", "jobs", "hiring", "positions", "join", "team"],
  },
  {
    id: "comp-contact",
    category: "Company",
    title: "Contact Us & Bug Report",
    description:
      "Get in touch with sales, press, or submit technical bug reports and feature feedback.",
    url: "/company/contact",
    keywords: ["contact", "support", "bug", "report", "sales", "press"],
  },
  {
    id: "foundation",
    category: "Foundation",
    title: "Foundation & Safety Initiatives",
    description:
      "Non-profit research initiatives promoting responsible AI deployment and global educational access.",
    url: "/foundation",
    keywords: [
      "foundation",
      "non-profit",
      "safety",
      "initiatives",
      "grant",
      "education",
    ],
  },
  {
    id: "supp-help",
    category: "Support",
    title: "Help Center & Support Guides",
    description:
      "Find guides, troubleshooting steps, account management FAQs, and standard operational answers.",
    url: "/support/help",
    keywords: [
      "help",
      "support",
      "faqs",
      "help center",
      "articles",
      "guides",
      "troubleshooting",
    ],
  },
  {
    id: "supp-privacy",
    category: "Page",
    title: "Privacy Policy",
    description:
      "Learn how we handle user data, privacy protections, security practices, and data retention policies.",
    url: "/support/privacy",
    keywords: ["privacy", "policy", "data", "gdpr", "legal", "retention"],
  },
  {
    id: "supp-terms",
    category: "Page",
    title: "Terms of Use",
    description:
      "Terms and conditions governing the use of CloseAI services, websites, APIs, and subscriptions.",
    url: "/support/terms",
    date: "Jun 2026",
    keywords: ["terms", "service", "legal", "agreement", "conditions"],
  },
];

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function MarketingHeader() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MegaMenuCategory>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<MegaMenuCategory>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [tryMenuOpen, setTryMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const foundationRef = useRef<HTMLAnchorElement>(null);
  const [foundationOffset, setFoundationOffset] = useState<number | null>(null);

  const updateFoundationOffset = () => {
    if (logoRef.current && foundationRef.current) {
      const logoRect = logoRef.current.getBoundingClientRect();
      const foundationRect = foundationRef.current.getBoundingClientRect();
      const offset = foundationRect.left - logoRect.left;
      if (offset > 0) {
        setFoundationOffset(offset);
      }
    }
  };

  useEffect(() => {
    updateFoundationOffset();
    window.addEventListener("resize", updateFoundationOffset);
    return () => window.removeEventListener("resize", updateFoundationOffset);
  }, []);

  useEffect(() => {
    if (activeMenu) {
      updateFoundationOffset();
    }
  }, [activeMenu]);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);

  // Auto-open login modal from URL query params or OAuth callback errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get("auth");
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");

      if (auth === "signup" || auth === "login" || error || errorCode || errorDesc) {
        setLoginModalOpen(true);
        if (error || errorCode || errorDesc) {
          let message = "Unable to complete sign in. Please try again.";
          if (errorCode === "bad_oauth_state" || errorDesc?.toLowerCase().includes("state")) {
            message = "Your sign-in session expired or was interrupted. Please try signing in again.";
          } else if (errorCode === "access_denied" || error === "access_denied") {
            message = "Sign-in was cancelled. Please try again when ready.";
          } else if (errorDesc) {
            message = decodeURIComponent(errorDesc.replace(/\+/g, " "));
          }
          setAuthModalError(message);
        }
      }

      // Clean the address bar if auth or error params were present
      if (auth || error || errorCode || errorDesc) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const isLocked = isSearchOpen || mobileNavOpen;

  const searchResults = React.useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (!q) return [];
    return SITE_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) =>
        k.toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [submittedQuery]);

  const currentActiveNav = hoveredNav || activeMenu;

  const getNavButtonColor = (key: string) => {
    if (!currentActiveNav) return "text-foreground";
    return currentActiveNav === key
      ? "text-foreground"
      : "text-muted-foreground";
  };

  const handleAccountEnter = () => {
    if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
    setHoveredNav(null);
    setAccountMenuOpen(true);
  };

  const handleAccountLeave = () => {
    if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
    accountTimeoutRef.current = setTimeout(() => {
      setAccountMenuOpen(false);
    }, 200);
  };

  const handleTryEnter = () => {
    if (tryTimeoutRef.current) clearTimeout(tryTimeoutRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
    setHoveredNav(null);
    setTryMenuOpen(true);
  };

  const handleTryLeave = () => {
    if (tryTimeoutRef.current) clearTimeout(tryTimeoutRef.current);
    tryTimeoutRef.current = setTimeout(() => {
      setTryMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    setMounted(true);
    const sb = window.innerWidth - document.documentElement.clientWidth;
    if (sb > 0) {
      setScrollbarWidth(sb);
    }
  }, []);

  // Lock background scroll when search or mobile nav is open.
  // Runs synchronously before paint so the browser paints the exact compensation on frame 1.
  useIsomorphicLayoutEffect(() => {
    if (!isLocked) return;

    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const sbWidth =
      window.innerWidth - document.documentElement.clientWidth ||
      scrollbarWidth;
    if (sbWidth > 0 && sbWidth !== scrollbarWidth) {
      setScrollbarWidth(sbWidth);
    }

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPaddingRight = document.body.style.paddingRight;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (sbWidth > 0) {
      document.body.style.paddingRight = `${sbWidth}px`;
    }

    return () => {
      document.documentElement.style.overflow =
        prevHtmlOverflow === "hidden" ? "" : prevHtmlOverflow;
      document.body.style.overflow =
        prevBodyOverflow === "hidden" ? "" : prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isLocked, isSearchOpen]);

  // Handle escape key to close menu/search/logout modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setHoveredNav(null);
        setIsSearchOpen(false);
        setMobileNavOpen(false);
        setLogoutModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile navigation drawer on resize to desktop & keep scrollbar width updated
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1025) {
        setMobileNavOpen(false);
      }
      if (!isLocked) {
        const sb = window.innerWidth - document.documentElement.clientWidth;
        if (sb > 0) {
          setScrollbarWidth(sb);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLocked]);

  const handleMouseEnter = (category: MegaMenuCategory) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isSearchOpen) {
      setActiveMenu(category);
    }
  };

  const handleMouseLeave = () => {
    setHoveredNav(null);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSubmittedQuery(searchQuery.trim());
  };

  return (
    <>
      {/* Backdrop blur overlay when mega menu is active */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 top-14 z-40 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm pointer-events-none",
          activeMenu ? "opacity-100 pointer-events-auto" : "opacity-0"
        )}
        style={{
          right: isLocked && scrollbarWidth > 0 ? `${scrollbarWidth}px` : 0,
          width:
            isLocked && scrollbarWidth > 0
              ? `calc(100% - ${scrollbarWidth}px)`
              : "100%",
        }}
        onClick={() => setActiveMenu(null)}
      />

      {/* FULLSCREEN SEARCH OVERLAY */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 top-14 z-40 bg-background overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] px-6 sm:px-8 py-12 sm:py-16 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const rect = e.currentTarget.getBoundingClientRect();
              const isScrollbarClick =
                e.clientX >= rect.left + e.currentTarget.clientWidth;
              if (isScrollbarClick) return;

              setIsSearchOpen(false);
              setSearchQuery("");
              setSubmittedQuery("");
            }
          }}
        >
          <div className="w-full max-w-3xl mx-auto space-y-10">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="w-full flex items-center justify-between border-b border-border/80 pb-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setSubmittedQuery("");
                    }
                  }}
                  placeholder="Search about anything"
                  className="w-full bg-transparent text-2xl sm:text-4xl font-normal text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground outline-none border-none ring-0 py-2 leading-normal sm:leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0 ml-4",
                    searchQuery.trim().length > 0
                      ? "bg-foreground text-background cursor-pointer hover:opacity-90 active:scale-95"
                      : "bg-neutral-300 dark:bg-[#383838] text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  aria-label="Submit search"
                >
                  <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* Results Section (Shown ONLY when submitted via Enter or button click) */}
            {submittedQuery.trim().length > 0 && (
              <div className="space-y-10">
                {/* Your search Query Heading */}
                <div className="space-y-2 pb-6 border-b border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Your search
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
                    {submittedQuery}
                  </p>
                </div>

                {/* Our sources (Shown ONLY when results exist) */}
                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Our sources
                    </p>

                    <div className="flex flex-col">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            setSubmittedQuery("");
                            router.push(item.url);
                          }}
                          className="py-5 border-b border-border/80 hover:border-foreground/40 dark:hover:border-neutral-400 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1">
                            <span>{item.category}</span>
                            {item.date && (
                              <>
                                <span>•</span>
                                <span className="font-normal normal-case text-muted-foreground">
                                  {item.date}
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="text-xl sm:text-2xl font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                            {item.title}
                          </h3>

                          <p className="text-base text-muted-foreground/80 group-hover:text-muted-foreground mt-1.5 leading-relaxed max-w-2xl transition-colors">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* We suggest Section */}
                <div
                  className={cn(
                    "pb-4 space-y-6",
                    searchResults.length > 0
                      ? "pt-8 border-t border-border/60"
                      : "pt-2"
                  )}
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    We suggest
                  </p>

                  <div className="space-y-4 text-base sm:text-lg leading-relaxed max-w-3xl">
                    <p className="text-foreground">
                      It looks like your question goes beyond what we can assist
                      with here. Advanced search is designed to help you find
                      information on closeAI, such as our products, research,
                      and updates.
                    </p>
                    <p className="text-muted-foreground">
                      At this time, it may not cover all topics, including some
                      GPT-related ones we don't yet fully support. You can try
                      asking a different question related to GPT-specific
                      content, or use closeAI chat for broader topics or
                      creative prompts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Button
                      asChild
                      className="group rounded-full px-5 h-10 text-[15px] font-normal bg-white/50 dark:bg-[#212121]/50 hover:bg-secondary dark:hover:bg-[#2f2f2f] border border-border/80 dark:border-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Link
                        href={user ? "/c" : "/gc"}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-1.5"
                      >
                        <span>Ask CloseAI</span>
                        <AnimatedArrowUpRight className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Link
                      href="/product/api-docs"
                      onClick={() => setIsSearchOpen(false)}
                      className="inline-flex items-center gap-1.5 text-md font-normal text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                    >
                      <span>API Docs</span>
                      <AnimatedArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header
        ref={headerRef}
        className="fixed top-0 left-0 z-50 w-full bg-background select-none transition-colors duration-200"
        style={{
          right: `max(${isLocked && scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px"}, var(--scrollbar-compensation, 0px))`,
          width:
            isLocked && scrollbarWidth > 0
              ? `calc(100% - ${scrollbarWidth}px)`
              : `calc(100% - var(--scrollbar-compensation, 0px))`,
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-[1500px] mx-auto px-6 sm:px-8 h-14 flex items-center justify-between relative">
          {/* Left Brand Logo & Main Nav Items */}
          <div className="flex items-center gap-8">
            <Link
              ref={logoRef}
              href="/"
              onMouseEnter={() => {
                setActiveMenu(null);
                setHoveredNav(null);
              }}
              onClick={() => {
                setActiveMenu(null);
                setHoveredNav(null);
                setIsSearchOpen(false);
              }}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <span className="font-bold text-xl tracking-tight text-foreground">
                CloseAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden xl:flex items-center gap-6"
              onMouseLeave={() => setHoveredNav(null)}
            >
              {/* Research */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("research");
                  handleMouseEnter("research");
                }}
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(activeMenu === "research" ? null : "research");
                }}
                className={cn(
                  "group text-[15px] transition-colors py-1 cursor-pointer flex items-center gap-1",
                  getNavButtonColor("research")
                )}
              >
                <span>Research</span>
                <AnimatedChevron
                  open={activeMenu === "research"}
                  size={18}
                  className={cn(
                    getNavButtonColor("research"),
                    "transition-colors"
                  )}
                />
              </button>

              {/* Products */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("products");
                  handleMouseEnter("products");
                }}
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(activeMenu === "products" ? null : "products");
                }}
                className={cn(
                  "group text-[15px] transition-colors py-1 cursor-pointer flex items-center gap-1",
                  getNavButtonColor("products")
                )}
              >
                <span>Products</span>
                <AnimatedChevron
                  open={activeMenu === "products"}
                  size={18}
                  className={cn(
                    getNavButtonColor("products"),
                    "transition-colors"
                  )}
                />
              </button>

              {/* Business */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("business");
                  handleMouseEnter("business");
                }}
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(activeMenu === "business" ? null : "business");
                }}
                className={cn(
                  "group text-[15px] transition-colors py-1 cursor-pointer flex items-center gap-1",
                  getNavButtonColor("business")
                )}
              >
                <span>Business</span>
                <AnimatedChevron
                  open={activeMenu === "business"}
                  size={18}
                  className={cn(
                    getNavButtonColor("business"),
                    "transition-colors"
                  )}
                />
              </button>

              {/* Developers */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("developers");
                  handleMouseEnter("developers");
                }}
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(
                    activeMenu === "developers" ? null : "developers"
                  );
                }}
                className={cn(
                  "group text-[15px] transition-colors py-1 cursor-pointer flex items-center gap-1",
                  getNavButtonColor("developers")
                )}
              >
                <span>Developers</span>
                <AnimatedChevron
                  open={activeMenu === "developers"}
                  size={18}
                  className={cn(
                    getNavButtonColor("developers"),
                    "transition-colors"
                  )}
                />
              </button>

              {/* Company */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("company");
                  handleMouseEnter("company");
                }}
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(activeMenu === "company" ? null : "company");
                }}
                className={cn(
                  "group text-[15px] transition-colors py-1 cursor-pointer flex items-center gap-1",
                  getNavButtonColor("company")
                )}
              >
                <span>Company</span>
                <AnimatedChevron
                  open={activeMenu === "company"}
                  size={18}
                  className={cn(
                    getNavButtonColor("company"),
                    "transition-colors"
                  )}
                />
              </button>

              {/* Foundation (Non-dropdown link: closes menu immediately on hover) */}
              <Link
                ref={foundationRef}
                href="/foundation"
                onMouseEnter={() => {
                  setHoveredNav("foundation");
                  setActiveMenu(null);
                }}
                onClick={() => {
                  setActiveMenu(null);
                  setHoveredNav(null);
                  setIsSearchOpen(false);
                }}
                className={cn(
                  "text-[15px] transition-colors py-1",
                  getNavButtonColor("foundation")
                )}
              >
                Foundation
              </Link>

              {/* Search / Close Toggle in Navigation */}
              <button
                onMouseEnter={() => {
                  setHoveredNav("search");
                  setActiveMenu(null);
                }}
                onClick={() => {
                  setActiveMenu(null);
                  setIsSearchOpen(!isSearchOpen);
                }}
                className={cn(
                  "p-1 pt-2 transition-colors cursor-pointer flex items-center justify-center",
                  getNavButtonColor("search")
                )}
                aria-label={isSearchOpen ? "Close search" : "Open search"}
              >
                <AnimatedSearchClose isOpen={isSearchOpen} size={18} />
              </button>
            </nav>
          </div>

          {/* Right CTA Actions */}
          <div
            className="hidden xl:flex items-center gap-3"
            onMouseEnter={() => {
              setActiveMenu(null);
              setHoveredNav(null);
            }}
          >
            {loading ? (
              <>
                <div className="w-[111px] h-[38px] rounded-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse shrink-0 hidden sm:block" />
                <div className="w-[121px] h-[36px] rounded-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse shrink-0 hidden sm:block" />
              </>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white flex items-center justify-center text-[15px] font-normal transition-all cursor-pointer outline-none select-none"
                >
                  <span>Log Out</span>
                </button>

                <Button
                  asChild
                  className="group rounded-full h-10 px-4 text-[15px] font-medium bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Link href="/c" className="flex items-center">
                    <span>Open Chat</span>
                    <AnimatedArrow size={18} strokeWidth={2} />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white flex items-center justify-center text-[15px] font-normal transition-all cursor-pointer outline-none select-none"
                >
                  <span>Log In</span>
                </button>

                <Link
                  href="/gc"
                  className="group rounded-full h-10 px-4 text-[15px] font-medium bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>Try CloseAI</span>
                  <AnimatedArrowUpRight size={18} strokeWidth={2} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle (Panel icon + Search) */}
          <div className="flex items-center gap-1 sm:gap-2 xl:hidden -mr-2">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setMobileNavOpen(false);
              }}
              className="p-2 text-foreground transition-colors flex items-center justify-center"
              aria-label={isSearchOpen ? "Close search" : "Search"}
            >
              <AnimatedSearchClose isOpen={isSearchOpen} size={18} />
            </button>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setActiveMenu(null);
                setMobileNavOpen(!mobileNavOpen);
                setMobileSubMenu(null);
              }}
              className="p-2 text-foreground transition-colors flex items-center justify-center"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              <AnimatedPanelToggle open={mobileNavOpen} size={18} />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MEGA MENU DROPDOWNS (Desktop Floating Overlay)            */}
        {/* ---------------------------------------------------------------- */}
        {activeMenu && (
          <div
            className="hidden xl:block absolute top-14 left-0 w-full bg-background z-50"
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1500px] mx-auto px-6 sm:px-8 py-10">
              {/* RESEARCH MEGA MENU */}
              {activeMenu === "research" && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: foundationOffset
                      ? `${foundationOffset}px 1fr`
                      : "minmax(280px, 1fr) 1fr",
                  }}
                >
                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Research
                    </p>
                    <ul className="space-y-4 nav-dropdown-group">
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Research Index
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Research Overview
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Research Residency
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/safety"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Safety
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Latest Advancements
                    </p>
                    <ul className="space-y-3 text-md nav-dropdown-group">
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-5.6
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-5.5
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-5.4
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-5.3 Instant
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-5.3-Codex
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* PRODUCTS MEGA MENU (Matching Screenshot 1) */}
              {activeMenu === "products" && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: foundationOffset
                      ? `${foundationOffset}px 1fr`
                      : "minmax(280px, 1fr) 1fr",
                  }}
                >
                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Products
                    </p>
                    <ul className="space-y-4 nav-dropdown-group">
                      <li>
                        <Link
                          href={user ? "/c" : "/gc"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="group inline-flex items-center text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>CloseAI Chat</span>
                          <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/features"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Codex & Canvas
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Products
                    </p>
                    <ul className="space-y-3 text-md nav-dropdown-group">
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          CloseAI Work & Teams
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Codex Enterprise
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          CloseAI Frontier
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          CloseAI Presence
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* BUSINESS MEGA MENU (Matching Screenshot 2) */}
              {activeMenu === "business" && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: foundationOffset
                      ? `${foundationOffset}px 1fr`
                      : "minmax(280px, 1fr) 1fr",
                  }}
                >
                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Business
                    </p>
                    <ul className="space-y-4 nav-dropdown-group">
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Overview
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Solutions
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Resources
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Customer Stories
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/pricing"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Pricing
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/contact"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Contact Sales
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-md nav-dropdown-group">
                      <li>
                        <Link
                          href="/company/blog"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Release Notes
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          API Platform
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/pricing"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          CloseAI Academy & Guides
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* DEVELOPERS MEGA MENU (Matching Screenshot 3) */}
              {activeMenu === "developers" && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: foundationOffset
                      ? `${foundationOffset}px 1fr`
                      : "minmax(280px, 1fr) 1fr",
                  }}
                >
                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Developers
                    </p>
                    <ul className="space-y-4 nav-dropdown-group">
                      <li>
                        <Link
                          href="/product/features"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Codex
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          API Platform
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="group inline-flex items-center text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>Autonomous Agents</span>
                          <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Open Models
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="group inline-flex items-center text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>Apps SDK</span>
                          <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-md nav-dropdown-group">
                      <li>
                        <Link
                          href="/product/api-docs"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Docs</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Codex Use Cases</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/api-docs"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Cookbook & Recipes</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/blog"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Developer Showcase</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/blog"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Developer Blog</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/about"
                          onClick={() => setActiveMenu(null)}
                          className="inline-flex items-center text-foreground transition-colors"
                        >
                          <span>Community & Discord</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* COMPANY MEGA MENU (Matching Screenshot 4) */}
              {activeMenu === "company" && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: foundationOffset
                      ? `${foundationOffset}px 1fr`
                      : "minmax(280px, 1fr) 1fr",
                  }}
                >
                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Company
                    </p>
                    <ul className="space-y-4 nav-dropdown-group">
                      <li>
                        <Link
                          href="/company/about"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          About Us
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/careers"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="group inline-flex items-center text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>Careers</span>
                          <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/blog"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          News
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/company/contact"
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Contact Us
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-md nav-dropdown-group">
                      <li>
                        <Link
                          href="/company/about"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Brand Guidelines
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/support/privacy"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Public Policy & Governance
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/support/terms"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Terms of Use
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/support/privacy"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MOBILE NAVIGATION DRAWER                            */}
        {/* ---------------------------------------------------------------- */}
        {mobileNavOpen && (
          <div
            className="xl:hidden fixed inset-y-0 left-0 top-14 bg-background border-b border-border p-6 flex flex-col justify-between overflow-y-auto overscroll-contain scrollbar-none z-50 select-none"
            style={{
              right: scrollbarWidth > 0 ? `${scrollbarWidth}px` : 0,
              width:
                scrollbarWidth > 0
                  ? `calc(100% - ${scrollbarWidth}px)`
                  : "100%",
            }}
          >
            {mobileSubMenu === null ? (
              /* LEVEL 1: MAIN NAVIGATION LIST (Image 3) */
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-4 pt-2 nav-dropdown-group">
                  <button
                    onClick={() => setMobileSubMenu("research")}
                    className="w-full text-left text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors flex items-center justify-between py-1.5"
                  >
                    <span>Research</span>
                  </button>
                  <button
                    onClick={() => setMobileSubMenu("products")}
                    className="w-full text-left text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors flex items-center justify-between py-1.5"
                  >
                    <span>Products</span>
                  </button>
                  <button
                    onClick={() => setMobileSubMenu("business")}
                    className="w-full text-left text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors flex items-center justify-between py-1.5"
                  >
                    <span>Business</span>
                  </button>
                  <button
                    onClick={() => setMobileSubMenu("developers")}
                    className="w-full text-left text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors flex items-center justify-between py-1.5"
                  >
                    <span>Developers</span>
                  </button>
                  <button
                    onClick={() => setMobileSubMenu("company")}
                    className="w-full text-left text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors flex items-center justify-between py-1.5"
                  >
                    <span>Company</span>
                  </button>
                  <Link
                    href="/foundation"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-1.5 text-3xl sm:text-4xl font-medium tracking-tight text-foreground transition-colors py-1.5"
                  >
                    <span>Foundation</span>
                  </Link>
                </div>

                <div className="pt-8 border-t border-border/50 space-y-4 pb-4">
                  {user ? (
                    <>
                      <button
                        onClick={() => {
                          setMobileNavOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="block text-3xl sm:text-4xl font-medium text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        Log Out
                      </button>
                      <Link
                        href="/c"
                        onClick={() => setMobileNavOpen(false)}
                        className="block text-3xl sm:text-4xl font-medium text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        <span>Open Chat</span>
                        <AnimatedArrow size={26} strokeWidth={2.5} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMobileNavOpen(false);
                          setLoginModalOpen(true);
                        }}
                        className="block text-3xl sm:text-4xl font-normal text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        Log In
                      </button>
                      <Link
                        href="/gc"
                        onClick={() => setMobileNavOpen(false)}
                        className="block text-3xl sm:text-4xl font-medium text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        <span>Try CloseAI</span>
                        <AnimatedArrowUpRight size={26} strokeWidth={2.5} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* LEVEL 2: CATEGORY SUBMENU (Image 5) */
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-6">
                  {/* Top Back Navigation Button */}
                  <button
                    onClick={() => setMobileSubMenu(null)}
                    className="flex items-center gap-2 text-base font-medium text-foreground hover:opacity-80 transition-opacity cursor-pointer mb-6"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Home</span>
                  </button>

                  {mobileSubMenu === "research" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Research
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          {[
                            {
                              label: "Research Index",
                              href: "/research/overview",
                            },
                            {
                              label: "Research Overview",
                              href: "/research/overview",
                            },
                            {
                              label: "Research Residency",
                              href: "/research/overview",
                            },
                            { label: "Safety", href: "/research/safety" },
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Latest Advancements
                        </div>
                        <div className="space-y-2.5 nav-dropdown-group">
                          {[
                            { label: "GPT-5.6", href: "/research/overview" },
                            { label: "GPT-5.5", href: "/research/overview" },
                            { label: "GPT-5.4", href: "/research/overview" },
                            {
                              label: "GPT-5.3 Instant",
                              href: "/research/overview",
                            },
                            {
                              label: "GPT-5.3-Codex",
                              href: "/research/overview",
                            },
                          ].map((adv, i) => (
                            <Link
                              key={i}
                              href={adv.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-base font-medium text-foreground transition-colors"
                            >
                              {adv.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileSubMenu === "products" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Products
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          <Link
                            href={user ? "/c" : "/gc"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="group inline-flex items-center text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>CloseAI Chat</span>
                            <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                          </Link>
                          <Link
                            href="/product/features"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            Codex & Canvas
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Products
                        </div>
                        <div className="space-y-2.5 nav-dropdown-group">
                          {[
                            {
                              label: "CloseAI Work & Teams",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Codex Enterprise",
                              href: "/business/enterprise",
                            },
                            {
                              label: "CloseAI Frontier",
                              href: "/business/enterprise",
                            },
                            {
                              label: "CloseAI Presence",
                              href: "/business/enterprise",
                            },
                          ].map((adv, i) => (
                            <Link
                              key={i}
                              href={adv.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-base font-medium text-foreground transition-colors"
                            >
                              {adv.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileSubMenu === "business" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Business
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          {[
                            {
                              label: "Overview",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Solutions",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Resources",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Customer Stories",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Pricing",
                              href: "/product/pricing",
                            },
                            {
                              label: "Contact Sales",
                              href: "/company/contact",
                            },
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5 nav-dropdown-group">
                          {[
                            {
                              label: "Release Notes",
                              href: "/company/blog",
                            },
                            {
                              label: "API Platform",
                              href: "/product/api-docs",
                            },
                            {
                              label: "CloseAI Academy & Guides",
                              href: "/product/pricing",
                            },
                          ].map((adv, i) => (
                            <Link
                              key={i}
                              href={adv.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-base font-medium text-foreground transition-colors"
                            >
                              {adv.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileSubMenu === "developers" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Developers
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          <Link
                            href="/product/features"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            Codex
                          </Link>
                          <Link
                            href="/product/api-docs"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            API Platform
                          </Link>
                          <Link
                            href="/product/api-docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="group inline-flex items-center text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>Autonomous Agents</span>
                            <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                          </Link>
                          <Link
                            href="/research/overview"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            Open Models
                          </Link>
                          <Link
                            href="/product/api-docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="group inline-flex items-center text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>Apps SDK</span>
                            <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5 nav-dropdown-group">
                          {[
                            { label: "Docs", href: "/product/api-docs" },
                            {
                              label: "Codex Use Cases",
                              href: "/product/api-docs",
                            },
                            {
                              label: "Cookbook & Recipes",
                              href: "/product/api-docs",
                            },
                            {
                              label: "Developer Showcase",
                              href: "/company/blog",
                            },
                            {
                              label: "Developer Blog",
                              href: "/company/blog",
                            },
                            {
                              label: "Community & Discord",
                              href: "/company/about",
                            },
                          ].map((adv, i) => (
                            <Link
                              key={i}
                              href={adv.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-base font-medium text-foreground transition-colors"
                            >
                              {adv.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileSubMenu === "company" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Company
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          <Link
                            href="/company/about"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            About Us
                          </Link>
                          <Link
                            href="/company/careers"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="group inline-flex items-center text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>Careers</span>
                            <AnimatedArrowUpRight className="w-4 h-4 ml-1.5 transition-colors" />
                          </Link>
                          <Link
                            href="/company/blog"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            News
                          </Link>
                          <Link
                            href="/company/contact"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            Contact Us
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5 nav-dropdown-group">
                          {[
                            {
                              label: "Brand Guidelines",
                              href: "/company/about",
                            },
                            {
                              label: "Public Policy & Governance",
                              href: "/support/privacy",
                            },
                            {
                              label: "Terms of Use",
                              href: "/support/terms",
                            },
                            {
                              label: "Privacy Policy",
                              href: "/support/privacy",
                            },
                          ].map((adv, i) => (
                            <Link
                              key={i}
                              href={adv.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-base font-medium text-foreground transition-colors"
                            >
                              {adv.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileSubMenu === "account" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-md uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Account
                        </div>
                        <div className="space-y-3 nav-dropdown-group">
                          {[
                            { label: "Open Chat", href: "/c" },
                            { label: "Settings & Profile", href: "/settings" },
                            { label: "Upgrade Plan", href: "/upgrade" },
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileNavOpen(false);
                            setLogoutModalOpen(true);
                          }}
                          className="block text-xl font-medium text-red-500 hover:opacity-80 transition-opacity py-1 cursor-pointer"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onConfirm={async () => {
          await signOut("/");
        }}
        userName={
          user?.user_metadata?.name ||
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0]
        }
        userEmail={user?.email}
        userAvatar={user?.user_metadata?.avatar_url}
        variant="auth"
      />

      {/* Login Modal (Unified Auth) */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={(isOpen) => {
          setLoginModalOpen(isOpen);
          if (!isOpen) setAuthModalError(null);
        }}
        initialError={authModalError}
      />

      {/* Spacer to preserve 56px (h-14) in document flow for fixed header */}
      <div className="h-14 w-full shrink-0" aria-hidden="true" />
    </>
  );
}

export default MarketingHeader;
