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
import { Button } from "@/components/ui/button";
import { LogoutModal } from "@/components/modals/log-out-modal";
import { cn } from "@/lib/utils";
import { openSettings } from "@/lib/settings-hash";

type MegaMenuCategory =
  | "research"
  | "products"
  | "business"
  | "developers"
  | "company"
  | "account"
  | "login"
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
    id: "res-6",
    category: "Research",
    title: "GPT-6.1 Terra: The Next Paradigm in Multistep Deductive Inference",
    description:
      "Introducing the next generation of AI with enhanced reasoning capabilities and real-time multimodal processing.",
    url: "/research/overview",
    date: "Oct 2026",
    keywords: [
      "6",
      "GPT-6",
      "astra",
      "reasoning",
      "multimodal",
      "inference",
    ],
  },
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
    title: "CloseAI",
    description:
      "Interactive AI assistant for conversation, coding, analysis, content creation, and creative problem solving.",
    url: "/c",
    keywords: [
      "chat",
      "closeai",
      "assistant",
      "ui",
      "conversation",
      "app",
    ],
  },
  {
    id: "prod-codex",
    category: "Products",
    title: "Codex",
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
    title: "Subscription Plans",
    description:
      "Flexible plans for individuals, teams, and enterprises including Free, Pro, and Ultra Pro tiers.",
    url: "/product/plans",
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
      "Get native Apps for macOS, Windows, iOS, and Android for instant offline access.",
    url: "/product/docs",
    date: "Jun 2026",
    keywords: ["download", "app", "mobile", "ios", "android"],
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
    id: "comp-brand",
    category: "Company",
    title: "Brand Kit & Identity",
    description: "Official CloseAI brand kit with high-resolution logos, favicons, and vector downloads.",
    url: "/company/brand",
    keywords: ["brand", "logos", "assets", "identities", "download", "svgs", "pngs"],
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
  const { user, loading, signOut, openLoginModal } = useAuth();
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
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [focusedChevron, setFocusedChevron] = useState<MegaMenuCategory>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringLoginRef = useRef(false);
  const loginContainerRef = useRef<HTMLDivElement>(null);
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
    if (activeMenu || focusedChevron) {
      updateFoundationOffset();
    }
  }, [activeMenu, focusedChevron]);

  useEffect(() => {
    if (isSearchOpen || activeMenu || mobileNavOpen) {
      setLoginDropdownOpen(false);
    }
  }, [isSearchOpen, activeMenu, mobileNavOpen]);

  useEffect(() => {
    if (!loginDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        e.target instanceof Node &&
        loginContainerRef.current &&
        !loginContainerRef.current.contains(e.target)
      ) {
        isHoveringLoginRef.current = false;
        setLoginDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        isHoveringLoginRef.current = false;
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loginDropdownOpen]);

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    };
  }, []);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const isLocked = isSearchOpen || mobileNavOpen || loginDropdownOpen;

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

  const currentActiveNav = hoveredNav || activeMenu || focusedChevron;

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

  const handleLoginEnter = () => {
    isHoveringLoginRef.current = true;
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
    setHoveredNav(null);
    setLoginDropdownOpen(true);
  };

  const handleLoginLeave = (e?: React.MouseEvent) => {
    if (
      e?.relatedTarget instanceof Node &&
      loginContainerRef.current?.contains(e.relatedTarget)
    ) {
      return;
    }
    isHoveringLoginRef.current = false;
    if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    loginTimeoutRef.current = setTimeout(() => {
      if (!isHoveringLoginRef.current) {
        setLoginDropdownOpen(false);
      }
    }, 200);
  };

  const handleLoginMouseMove = () => {
    isHoveringLoginRef.current = true;
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setMounted(true);
    const sb = window.innerWidth - document.documentElement.clientWidth;
    if (sb > 0) {
      setScrollbarWidth(sb);
    }
  }, []);

  // Lock background scroll when search, mobile nav, or login dropdown is open.
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

  // Handle escape key to close menu/search/logout modal/login dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setHoveredNav(null);
        setFocusedChevron(null);
        setIsSearchOpen(false);
        setMobileNavOpen(false);
        setLogoutModalOpen(false);
        isHoveringLoginRef.current = false;
        setLoginDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile navigation drawer on resize to desktop & keep scrollbar width updated
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileNavOpen(false);
      }
      if (window.innerWidth < 1280) {
        isHoveringLoginRef.current = false;
        setLoginDropdownOpen(false);
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
      isHoveringLoginRef.current = false;
      setLoginDropdownOpen(false);
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
          "fixed inset-y-0 left-0 top-14 z-40 bg-background/80 pointer-events-none",
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
                  placeholder="Search anything"
                  className="w-full bg-transparent text-2xl sm:text-4xl font-normal text-foreground placeholder:text-muted-foreground outline-none border-none ring-0 py-2 leading-normal sm:leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className={cn(
                    "w-11 h-11 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0 ml-4 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ring-offset-background",
                    searchQuery.trim().length > 0
                      ? "bg-foreground text-background cursor-pointer hover:opacity-80 active:scale-[0.99]"
                      : "bg-neutral-300 dark:bg-[#2f2f2f] border border-border/80 dark:border-white/10 text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  aria-label="Submit search"
                >
                  <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </button>
              </div>
            </form>

            {/* Results Section (Shown ONLY when submitted via Enter or button click) */}
            {submittedQuery.trim().length > 0 && (
              <div className="space-y-10">
                {/* Your search Query Heading */}
                <div className="space-y-2 pb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Your search
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
                    {submittedQuery}
                  </p>
                </div>

                {/* Our sources (Shown ONLY when results exist) */}
                {searchResults.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border/80">
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
                            const targetUrl =
                              item.id === "prod-chat" || item.url === "/c"
                                ? user
                                  ? "/c"
                                  : "/gc"
                                : item.url;
                            router.push(targetUrl);
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
                      ? "pt-8"
                      : "pt-4 border-t border-border/80"
                  )}
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    We suggest
                  </p>

                  <div className="space-y-4 text-base sm:text-lg leading-relaxed max-w-3xl">
                    <p className="text-foreground">
                      It looks like your question goes beyond what we can assist
                      with here. Advanced search is designed to help you find
                      information on CloseAI, such as our products, research,
                      and updates.
                    </p>
                    <p className="text-muted-foreground">
                      At this time, it may not cover all topics, including some
                      chat-related ones we don't yet fully support. You can try
                      asking a different question related to chat-specific
                      content, or use CloseAI for broader topics or
                      creative prompts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Button
                      asChild
                      className="h-12 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-white/10 dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white flex items-center justify-center text-[15px] font-normal transition-all cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                    >
                      <Link
                        href={user ? "/c" : "/gc"}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-1.5"
                      >
                        <span>Ask CloseAI</span>
                      </Link>
                    </Button>

                    <Link
                      href="/product/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsSearchOpen(false)}
                      className="group rounded-full h-12 px-4 text-[15px] font-medium bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 transition-colors cursor-pointer inline-flex items-center gap-0.5 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                    >
                      <span>API Docs</span>
                      <AnimatedArrowUpRight className="w-5 h-5" />
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
          right: `max(${
            isLocked && scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px"
          }, var(--scrollbar-compensation, 0px))`,
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
              className="flex items-center gap-2 max-xl:-ml-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="font-medium text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80">
                CloseAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden xl:flex items-center gap-6"
              onMouseLeave={() => setHoveredNav(null)}
            >
              {/* Research */}
              <div className="relative flex items-center">
                <Link
                  href="/research/overview"
                  onMouseEnter={() => {
                    setHoveredNav("research");
                    handleMouseEnter("research");
                  }}
                  onClick={() => {
                    setActiveMenu(null);
                    setHoveredNav(null);
                    setIsSearchOpen(false);
                  }}
                  className={cn(
                    "text-[15px] transition-colors py-1 px-1.5 rounded-full cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center whitespace-nowrap",
                    getNavButtonColor("research")
                  )}
                >
                  <span>Research</span>
                </Link>
                <button
                  type="button"
                  aria-label={
                    activeMenu === "research"
                      ? "Close Research menu"
                      : "Open Research menu"
                  }
                  aria-expanded={activeMenu === "research"}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveMenu(activeMenu === "research" ? null : "research");
                  }}
                  onFocus={() => setFocusedChevron("research")}
                  onBlur={() =>
                    setFocusedChevron((prev) =>
                      prev === "research" ? null : prev
                    )
                  }
                  className={cn(
                    "cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-opacity",
                    "absolute left-full top-1/2 -translate-y-1/2 ml-0.5",
                    focusedChevron === "research"
                      ? "w-5 h-5 opacity-100 pointer-events-auto"
                      : "sr-only focus-visible:not-sr-only focus-visible:w-5 focus-visible:h-5 focus-visible:opacity-100 focus-visible:pointer-events-auto"
                  )}
                >
                  <AnimatedChevron
                    open={activeMenu === "research"}
                    size={14}
                  />
                </button>
              </div>

              {/* Products */}
              <div className="relative flex items-center">
                <Link
                  href={user ? "/c" : "/gc"}
                  onMouseEnter={() => {
                    setHoveredNav("products");
                    handleMouseEnter("products");
                  }}
                  onClick={() => {
                    setActiveMenu(null);
                    setHoveredNav(null);
                    setIsSearchOpen(false);
                  }}
                  className={cn(
                    "text-[15px] transition-colors py-1 px-1.5 rounded-full cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center whitespace-nowrap",
                    getNavButtonColor("products")
                  )}
                >
                  <span>Products</span>
                </Link>
                <button
                  type="button"
                  aria-label={
                    activeMenu === "products"
                      ? "Close Products menu"
                      : "Open Products menu"
                  }
                  aria-expanded={activeMenu === "products"}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveMenu(activeMenu === "products" ? null : "products");
                  }}
                  onFocus={() => setFocusedChevron("products")}
                  onBlur={() =>
                    setFocusedChevron((prev) =>
                      prev === "products" ? null : prev
                    )
                  }
                  className={cn(
                    "cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-opacity",
                    "absolute left-full top-1/2 -translate-y-1/2 ml-0.5",
                    focusedChevron === "products"
                      ? "w-5 h-5 opacity-100 pointer-events-auto"
                      : "sr-only focus-visible:not-sr-only focus-visible:w-5 focus-visible:h-5 focus-visible:opacity-100 focus-visible:pointer-events-auto"
                  )}
                >
                  <AnimatedChevron
                    open={activeMenu === "products"}
                    size={14}
                  />
                </button>
              </div>

              {/* Business */}
              <div className="relative flex items-center">
                <Link
                  href="/business/enterprise"
                  onMouseEnter={() => {
                    setHoveredNav("business");
                    handleMouseEnter("business");
                  }}
                  onClick={() => {
                    setActiveMenu(null);
                    setHoveredNav(null);
                    setIsSearchOpen(false);
                  }}
                  className={cn(
                    "text-[15px] transition-colors py-1 px-1.5 rounded-full cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center whitespace-nowrap",
                    getNavButtonColor("business")
                  )}
                >
                  <span>Business</span>
                </Link>
                <button
                  type="button"
                  aria-label={
                    activeMenu === "business"
                      ? "Close Business menu"
                      : "Open Business menu"
                  }
                  aria-expanded={activeMenu === "business"}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveMenu(activeMenu === "business" ? null : "business");
                  }}
                  onFocus={() => setFocusedChevron("business")}
                  onBlur={() =>
                    setFocusedChevron((prev) =>
                      prev === "business" ? null : prev
                    )
                  }
                  className={cn(
                    "cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-opacity",
                    "absolute left-full top-1/2 -translate-y-1/2 ml-0.5",
                    focusedChevron === "business"
                      ? "w-5 h-5 opacity-100 pointer-events-auto"
                      : "sr-only focus-visible:not-sr-only focus-visible:w-5 focus-visible:h-5 focus-visible:opacity-100 focus-visible:pointer-events-auto"
                  )}
                >
                  <AnimatedChevron
                    open={activeMenu === "business"}
                    size={14}
                  />
                </button>
              </div>

              {/* Developers */}
              <div className="relative flex items-center">
                <Link
                  href="/product/api-docs"
                  onMouseEnter={() => {
                    setHoveredNav("developers");
                    handleMouseEnter("developers");
                  }}
                  onClick={() => {
                    setActiveMenu(null);
                    setHoveredNav(null);
                    setIsSearchOpen(false);
                  }}
                  className={cn(
                    "text-[15px] transition-colors py-1 px-1.5 rounded-full cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center whitespace-nowrap",
                    getNavButtonColor("developers")
                  )}
                >
                  <span>Developers</span>
                </Link>
                <button
                  type="button"
                  aria-label={
                    activeMenu === "developers"
                      ? "Close Developers menu"
                      : "Open Developers menu"
                  }
                  aria-expanded={activeMenu === "developers"}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveMenu(
                      activeMenu === "developers" ? null : "developers"
                    );
                  }}
                  onFocus={() => setFocusedChevron("developers")}
                  onBlur={() =>
                    setFocusedChevron((prev) =>
                      prev === "developers" ? null : prev
                    )
                  }
                  className={cn(
                    "cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-opacity",
                    "absolute left-full top-1/2 -translate-y-1/2 ml-0.5",
                    focusedChevron === "developers"
                      ? "w-5 h-5 opacity-100 pointer-events-auto"
                      : "sr-only focus-visible:not-sr-only focus-visible:w-5 focus-visible:h-5 focus-visible:opacity-100 focus-visible:pointer-events-auto"
                  )}
                >
                  <AnimatedChevron
                    open={activeMenu === "developers"}
                    size={14}
                  />
                </button>
              </div>

              {/* Company */}
              <div className="relative flex items-center">
                <Link
                  href="/company/about"
                  onMouseEnter={() => {
                    setHoveredNav("company");
                    handleMouseEnter("company");
                  }}
                  onClick={() => {
                    setActiveMenu(null);
                    setHoveredNav(null);
                    setIsSearchOpen(false);
                  }}
                  className={cn(
                    "text-[15px] transition-colors py-1 px-1.5 rounded-full cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center whitespace-nowrap",
                    getNavButtonColor("company")
                  )}
                >
                  <span>Company</span>
                </Link>
                <button
                  type="button"
                  aria-label={
                    activeMenu === "company"
                      ? "Close Company menu"
                      : "Open Company menu"
                  }
                  aria-expanded={activeMenu === "company"}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setActiveMenu(activeMenu === "company" ? null : "company");
                  }}
                  onFocus={() => setFocusedChevron("company")}
                  onBlur={() =>
                    setFocusedChevron((prev) =>
                      prev === "company" ? null : prev
                    )
                  }
                  className={cn(
                    "cursor-pointer flex items-center justify-center rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-opacity",
                    "absolute left-full top-1/2 -translate-y-1/2 ml-0.5",
                    focusedChevron === "company"
                      ? "w-5 h-5 opacity-100 pointer-events-auto"
                      : "sr-only focus-visible:not-sr-only focus-visible:w-5 focus-visible:h-5 focus-visible:opacity-100 focus-visible:pointer-events-auto"
                  )}
                >
                  <AnimatedChevron
                    open={activeMenu === "company"}
                    size={14}
                  />
                </button>
              </div>

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
                  "text-[15px] transition-colors py-1 px-1.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  getNavButtonColor("foundation")
                )}
              >
                Foundation
              </Link>

              {/* Search / Close Toggle in Navigation */}
              <button
                onMouseEnter={() => {
                  setHoveredNav(null);
                  setActiveMenu(null);
                }}
                onClick={() => {
                  setActiveMenu(null);
                  setIsSearchOpen(!isSearchOpen);
                }}
                className="w-8 h-8 rounded-full transition-opacity hover:opacity-80 cursor-pointer flex items-center justify-center text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={isSearchOpen ? "Close search" : "Open search"}
              >
                <AnimatedSearchClose isOpen={isSearchOpen} size={20} />
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
                  className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-white/10 dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white flex items-center justify-center text-[15px] font-normal transition-colors cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  <span>Log Out</span>
                </button>

                <Link
                  href="/c"
                  className="group rounded-full h-11 px-4 text-[15px] font-medium bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 transition-colors cursor-pointer inline-flex items-center gap-0.5 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  <span>Open Chat</span>
                  <AnimatedArrow size={20} />
                </Link>
              </>
            ) : (
              <>
                <div
                  ref={loginContainerRef}
                  className="relative"
                  onMouseEnter={handleLoginEnter}
                  onMouseLeave={handleLoginLeave}
                  onMouseMove={handleLoginMouseMove}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu(null);
                      setHoveredNav(null);
                      setLoginDropdownOpen((prev) => {
                        const next = !prev;
                        isHoveringLoginRef.current = next;
                        return next;
                      });
                    }}
                    className={cn(
                      "h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-white/10 dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white flex items-center justify-center gap-1.5 text-[15px] font-normal transition-colors cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                      loginDropdownOpen && "bg-secondary dark:bg-[#2f2f2f]"
                    )}
                  >
                    <span>Log in</span>
                    <AnimatedChevron
                      open={loginDropdownOpen}
                      size={20}
                    />
                  </button>

                  {loginDropdownOpen && (
                    <div className="absolute top-full right-0 pt-1.5 z-50">
                      <div className="min-w-[200px] p-2 rounded-sm bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 space-y-0.5 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            isHoveringLoginRef.current = false;
                            setLoginDropdownOpen(false);
                            openLoginModal();
                          }}
                          className="w-full text-left relative flex cursor-pointer select-none items-center rounded-sm px-4 py-2 text-[15px] font-normal outline-none transition-colors duration-75 hover:bg-secondary dark:hover:bg-[#2f2f2f] focus:bg-secondary dark:focus:bg-[#2f2f2f] text-foreground"
                        >
                          <span>CloseAI Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => e.preventDefault()}
                          className="w-full text-left relative flex cursor-default select-none items-center rounded-sm px-4 py-2 text-[15px] font-normal outline-none transition-colors duration-75 hover:bg-secondary dark:hover:bg-[#2f2f2f] focus:bg-secondary dark:focus:bg-[#2f2f2f] text-foreground cursor-not-allowed opacity-50"
                        >
                          <AnimatedComingSoonText
                            label="API Platform"
                            comingSoonText="Coming soon"
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="rounded-full h-11 px-4 text-[15px] font-medium bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 transition-colors cursor-pointer inline-flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background select-none"
                >
                  <span>Sign up for free</span>
                </button>
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
              className="w-9 h-9 rounded-full text-foreground transition-colors flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={isSearchOpen ? "Close search" : "Search"}
            >
              <AnimatedSearchClose isOpen={isSearchOpen} size={20} />
            </button>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setActiveMenu(null);
                setMobileNavOpen(!mobileNavOpen);
                setMobileSubMenu(null);
              }}
              className="w-9 h-9 rounded-full text-foreground transition-colors flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              <AnimatedPanelToggle open={mobileNavOpen} size={20} />
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
            <div className="max-w-[1500px] mx-auto px-6 sm:px-8 py-10 nav-dropdown-group">
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Research
                    </p>
                    <ul className="space-y-4">
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
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Safety
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Latest Advancements
                    </p>
                    <ul className="space-y-3 text-base">
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-6.1 Terra
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/research/overview"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          GPT-6 Astra
                        </Link>
                      </li>
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Products
                    </p>
                    <ul className="space-y-4">
                      <li>
                        <Link
                          href={user ? "/c" : "/gc"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>CloseAI</span>
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/features"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Codex
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Products
                    </p>
                    <ul className="space-y-3 text-base">
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Business
                    </p>
                    <ul className="space-y-4">
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
                          href="/product/plans"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          Plans
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-base">
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
                          href="/business/enterprise"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Customer Stories
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/product/plans"
                          onClick={() => setActiveMenu(null)}
                          className="text-foreground transition-colors"
                        >
                          Academy & Guides
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Developers
                    </p>
                    <ul className="space-y-4">
                      <li>
                        <Link
                          href="/product/api-docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          APIs Platform
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
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
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>App SDKs</span>
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-base">
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
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Explore Company
                    </p>
                    <ul className="space-y-4">
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
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>Careers</span>
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
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
                      <li>
                        <Link
                          href="/company/brand"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenu(null)}
                          className="text-2xl font-medium text-foreground transition-colors"
                        >
                          <span>Brand</span>
                          <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-5">
                      Resources
                    </p>
                    <ul className="space-y-3 text-base">
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

                <div className="pt-8 border-t border-border/80 space-y-4 pb-4">
                  {user ? (
                    <>
                      <Link
                        href="/c"
                        onClick={() => setMobileNavOpen(false)}
                        className="block text-3xl sm:text-4xl font-medium text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        <span>Open Chat</span>
                        <AnimatedArrow size={26} />
                      </Link>

                      <button
                        onClick={() => {
                          setMobileNavOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="block text-3xl sm:text-4xl font-normal text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNavOpen(false);
                          openLoginModal();
                        }}
                        className="block text-3xl sm:text-4xl font-medium text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        Sign up for free
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileSubMenu("login")}
                        className="block text-3xl sm:text-4xl font-normal text-foreground hover:text-muted-foreground transition-colors py-1 text-left w-full cursor-pointer"
                      >
                        Log In
                      </button>
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
                    <ArrowLeft className="w-5 h-5 stroke-[2]" />
                    <span>Home</span>
                  </button>

                  {mobileSubMenu === "research" && (
                    <div className="space-y-6 nav-dropdown-group">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Research
                        </div>
                        <div className="space-y-3">
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
                            { label: "Safety",
                              href: "/research/safety",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              icon: <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                            },
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              target={item.target}
                              rel={item.rel}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                            >
                              {item.label}
                              {item.icon}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Latest Advancements
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { 
                              label: "GPT-6.1 Terra",
                              href: "/research/overview"
                            },
                            { 
                              label: "GPT-6 Astra",
                              href: "/research/overview"
                           },
                            { label: "GPT-5.6", href: "/research/overview" },
                            { label: "GPT-5.5", href: "/research/overview" },
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
                    <div className="space-y-6 nav-dropdown-group">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Products
                        </div>
                        <div className="space-y-3">
                          <Link
                            href={user ? "/c" : "/gc"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>CloseAI</span>
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                          </Link>
                          <Link
                            href="/product/features"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            Codex
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Products
                        </div>
                        <div className="space-y-2.5">
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
                    <div className="space-y-6 nav-dropdown-group">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Business
                        </div>
                        <div className="space-y-3">
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
                              label: "Plans",
                              href: "/product/plans",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              icon: <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />,
                            },
                            {
                              label: "Customer Stories",
                              href: "/business/enterprise",
                            },
                            {
                              label: "Contact Sales",
                              href: "/company/contact",
                            },
                          ].map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              target={item.target}
                              rel={item.rel}
                              onClick={() => setMobileNavOpen(false)}
                              className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                            >
                              {item.label}
                              {item.icon}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5">
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
                              label: "Academy & Guides",
                              href: "/product/plans",
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
                    <div className="space-y-6 nav-dropdown-group">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Developers
                        </div>
                        <div className="space-y-3">
                          <Link
                            href="/product/api-docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            APIs Platform
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
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
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>App SDKs</span>
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5">
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
                    <div className="space-y-6 nav-dropdown-group">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Explore Company
                        </div>
                        <div className="space-y-3">
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
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>Careers</span>
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
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
                          <Link
                            href="/company/brand"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileNavOpen(false)}
                            className="block text-2xl sm:text-3xl font-medium tracking-tight text-foreground transition-colors py-1"
                          >
                            <span>Brand</span>
                            <AnimatedArrowUpRight className="w-5 h-5 transition-colors" />
                          </Link>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/80">
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Resources
                        </div>
                        <div className="space-y-2.5">
                          {[
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

                  {mobileSubMenu === "login" && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-base uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                          Log In
                        </div>
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              setMobileNavOpen(false);
                              setMobileSubMenu(null);
                              openLoginModal();
                            }}
                            className="block text-left text-2xl sm:text-3xl font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity py-1 cursor-pointer w-full outline-none"
                          >
                            CloseAI Chat
                          </button>
                          <button
                            type="button"
                            className="block text-left text-2xl sm:text-3xl font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity py-1 cursor-not-allowed opacity-50 w-full outline-none"
                          >
                            <AnimatedComingSoonText
                              label="API Platform"
                              comingSoonText="Coming soon"
                            />
                          </button>
                        </div>
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

      {/* Spacer to preserve 56px (h-14) in document flow for fixed header */}
      <div className="h-14 w-full shrink-0" aria-hidden="true" />
    </>
  );
}

export default MarketingHeader;
