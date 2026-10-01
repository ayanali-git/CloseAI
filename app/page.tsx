"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/header";
import { Footer } from "@/components/ui/footer";
import {
  AnimatedArrow,
  AnimatedComingSoonText,
} from "@/components/ui/animated";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ArrowUp,
  Search,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [heroPrompt, setHeroPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // "More" pill state: when clicked, converts to "Search with CloseAI" (like API platform type)
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  // Hover-dims-siblings state, one per grid section
  const [hoveredSpotlight, setHoveredSpotlight] = useState<number | null>(null);
  const [hoveredNews, setHoveredNews] = useState<number | null>(null);
  const [hoveredResearch, setHoveredResearch] = useState<number | null>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<number | null>(null);

  // Dynamic bottom offset to ensure bottom of left card part (image) aligns horizontally with Item 3 card part at max scroll
  const [spotlightBottomOffset, setSpotlightBottomOffset] =
    useState<number>(16);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftCardImgRef = useRef<HTMLDivElement>(null);
  const item3Ref = useRef<HTMLAnchorElement>(null);
  const rightCardImgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSpotlightOffset = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 768) {
        setSpotlightBottomOffset(0);
        return;
      }
      if (
        leftColRef.current &&
        leftCardImgRef.current &&
        item3Ref.current &&
        rightCardImgRef.current
      ) {
        const leftDistance =
          leftColRef.current.getBoundingClientRect().bottom -
          leftCardImgRef.current.getBoundingClientRect().bottom;
        const rightDistance =
          item3Ref.current.getBoundingClientRect().bottom -
          rightCardImgRef.current.getBoundingClientRect().bottom;
        const diff = Math.max(0, Math.round(leftDistance - rightDistance));
        setSpotlightBottomOffset(diff);
      }
    };

    updateSpotlightOffset();
    window.addEventListener("resize", updateSpotlightOffset);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(updateSpotlightOffset);
    }
    return () => window.removeEventListener("resize", updateSpotlightOffset);
  }, []);

  const getCardColor = (hoveredIndex: number | null, i: number) => {
    if (hoveredIndex === null) return "text-foreground";
    return hoveredIndex === i ? "text-foreground" : "text-muted-foreground";
  };

  const getOpacity = (hoveredIndex: number | null, i: number) => {
    if (hoveredIndex === null) return "opacity-100";
    return hoveredIndex === i ? "opacity-100" : "opacity-50";
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = heroPrompt.trim();
    if (!prompt || isSubmitting) return;

    setIsSubmitting(true);
    const targetUrl = user
      ? `/c?q=${encodeURIComponent(prompt)}`
      : `/gc?q=${encodeURIComponent(prompt)}`;
    router.push(targetUrl);
  };

  const handlePillClick = (prompt: string) => {
    setHeroPrompt(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
  };

  const quickPills = [
    {
      id: "talk",
      label: "Talk with CloseAI",
      prompt:
        "Explain the latest frontier AI models and reasoning capabilities",
    },
    {
      id: "research",
      label: "Research",
      prompt: "Summarize recent breakthrough papers in AI alignment and safety",
    },
    {
      id: "api",
      label: "API Platform",
      prompt: "How do I get started with the API and developer platform?",
      // disabled: true,
      // hoverText: "Coming soon",
    },
    {
      id: "business",
      label: "Business",
      prompt: "How does closeAI help enterprises with secure AI solutions?",
    },
    isMoreExpanded
      ? {
          id: "more",
          label: "Search with CloseAI",
          prompt:
            "Explore all closeAI features, enterprise solutions, and tools",
          disabled: true,
          hoverText: "Coming soon",
        }
      : {
          id: "more",
          label: "More",
          prompt:
            "Explore all closeAI features, enterprise solutions, and tools",
        },
  ];

  // DiceBear glass avatars
  const glassAvatar = (seed: string) =>
    `https://api.dicebear.com/10.x/glass/svg?tags=animation&seed=${encodeURIComponent(
      seed
    )}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none antialiased">
      <MarketingHeader />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        {/* HERO PROMPT DOCK */}
        {/* ---------------------------------------------------------------- */}
        <section className="min-h-[calc(100svh-180px)] sm:min-h-[calc(100svh-300px)] lg:min-h-[calc(100vh-350px)] flex flex-col items-center justify-center pt-8 pb-4 px-6 sm:px-8 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-8">
            What can I help with?
          </h1>

          {/* Hero Input Card */}
          <form
            onSubmit={handleHeroSubmit}
            className="relative w-full max-w-3xl mx-auto mb-6"
          >
            <div
              onClick={() =>
                textareaRef.current?.focus({ preventScroll: true })
              }
              className="relative w-full rounded-3xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-4 min-h-[100px] flex flex-col justify-between transition-all cursor-text"
            >
              <textarea
                ref={textareaRef}
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleHeroSubmit(e);
                  }
                }}
                autoFocus
                placeholder="Ask about anything"
                rows={3}
                disabled={isSubmitting}
                className="w-full bg-transparent resize-none text-[17px] font-normal placeholder:text-muted-foreground transition-colors outline-none border-none ring-0 leading-relaxed"
              />
              <div
                className="flex items-center justify-end pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="submit"
                  disabled={!heroPrompt.trim() || isSubmitting}
                  className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0",
                    heroPrompt.trim().length > 0 && !isSubmitting
                      ? "bg-foreground text-background cursor-pointer hover:opacity-90 active:scale-95"
                      : "bg-neutral-300 dark:bg-[#383838] text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  aria-label="Send prompt"
                >
                  {isSubmitting ? (
                    <Loader className="w-5 h-5 animate-spin text-foreground" />
                  ) : (
                    <ArrowUp className="w-5 h-5 stroke-[3]" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Suggestion Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {quickPills.map((pill) => {
              const isSelected =
                !pill.disabled &&
                pill.id !== "talk" &&
                pill.id !== "more" &&
                heroPrompt.trim() === pill.prompt;

              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={(e) => {
                    if (pill.id === "talk") {
                      const dest = user ? "/c" : "/gc";
                      if (e.metaKey || e.ctrlKey) {
                        window.open(dest, "_blank");
                      } else {
                        router.push(dest);
                      }
                      return;
                    }
                    if (pill.id === "more" && !isMoreExpanded) {
                      setIsMoreExpanded(true);
                      return;
                    }
                    if (pill.disabled) return;
                    handlePillClick(pill.prompt);
                  }}
                  className={cn(
                    "h-12 px-4 rounded-full text-md sm:text-[15px] font-normal transition-colors outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ring-0 border border-border/80 dark:border-none",
                    pill.disabled
                      ? "cursor-not-allowed select-none bg-white hover:bg-secondary/60 text-muted-foreground dark:bg-[#2f2f2f] dark:hover:bg-[#2f2f2f]/60"
                      : isSelected
                      ? "cursor-pointer bg-secondary text-black dark:bg-[#383838] dark:text-white"
                      : "cursor-pointer bg-white hover:bg-secondary text-muted-foreground dark:bg-[#2f2f2f] dark:hover:bg-[#383838]"
                  )}
                >
                  {pill.disabled ? (
                    <AnimatedComingSoonText
                      label={pill.label}
                      comingSoonText={pill.hoverText || "Coming soon"}
                      align="center"
                    />
                  ) : (
                    pill.label
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FEATURED SPOTLIGHT (Sticky Left + Scrolling Right on Medium & Large Screens, Stacked on Mobile) */}
        {/* ---------------------------------------------------------------- */}
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto mt-9 sm:mt-12 pb-20 lg:pb-28">
          <div
            className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-10 lg:gap-12 xl:gap-14"
            onMouseLeave={() => setHoveredSpotlight(null)}
          >
            {/* STICKY LEFT COLUMN TRACK: Astra GPT-6 Spotlight */}
            <div
              ref={leftColRef}
              className="w-full md:w-[56%] lg:w-[58%] xl:w-[75%] relative md:sticky md:top-24 md:self-start"
            >
              <Link
                href="/research/overview"
                onMouseEnter={() => setHoveredSpotlight(0)}
                onMouseLeave={() => setHoveredSpotlight(null)}
                className={cn(
                  "block transition-opacity duration-200",
                  getOpacity(hoveredSpotlight, 0)
                )}
              >
                {/* Big Card */}
                <div
                  ref={leftCardImgRef}
                  className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-sm overflow-hidden bg-black transition-all duration-300"
                >
                  <Image
                    src="/assets/images/gpt-6.png"
                    alt="GPT-6 Astra"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Left Title & Tag Below Card */}
                <div className="mt-4 flex flex-col gap-5 max-w-3xl">
                  <h2
                    className={cn(
                      "2xl:whitespace-nowrap text-4xl sm:text-5xl font-bold tracking-tight leading-snug transition-colors",
                      getCardColor(hoveredSpotlight, 0)
                    )}
                  >
                    GPT-6 Astra: A New Generation of Intelligence
                  </h2>
                  <div className="flex items-center gap-2 text-sm xl:text-md text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Research
                    </span>
                    <span>·</span>
                    <span>Jan 05, 2026</span>
                    <span>·</span>
                    <span>18 min read</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* SCROLLING RIGHT COLUMN: 3 Items Stream (one by one) */}
            <div
              className="w-full md:w-[36%] lg:w-[38%] xl:w-[25%] flex flex-col gap-8 lg:gap-10"
              style={
                spotlightBottomOffset > 0
                  ? { paddingBottom: `${spotlightBottomOffset}px` }
                  : undefined
              }
            >
              {/* Item 1 */}
              <Link
                href="/product/features"
                onMouseEnter={() => setHoveredSpotlight(3)}
                onMouseLeave={() => setHoveredSpotlight(null)}
                className={cn(
                  "flex flex-col transition-opacity duration-200",
                  getOpacity(hoveredSpotlight, 3)
                )}
              >
                <div className="relative w-full aspect-[2/1] md:aspect-[4/3] rounded-sm overflow-hidden bg-black">
                  <Image
                    src="/assets/images/sol-and-luna.png"
                    alt="Introducing GPT-6 Sol and Luna"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 md:mt-4 flex flex-col gap-5">
                  <h3
                    className={cn(
                      "whitespace-nowrap text-base xl:text-2xl font-semibold leading-snug transition-colors",
                      getCardColor(hoveredSpotlight, 3)
                    )}
                  >
                    Introducing GPT-6 Sol and Luna
                  </h3>
                  <div className="flex items-center gap-2 text-sm sm:text-md text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Product
                    </span>
                    <span>·</span>
                    <span>Apr 20, 2026</span>
                    <span>·</span>
                    <span>7 min read</span>
                  </div>
                </div>
              </Link>

              {/* Item 2 */}
              <Link
                href="/company/blog"
                onMouseEnter={() => setHoveredSpotlight(2)}
                onMouseLeave={() => setHoveredSpotlight(null)}
                className={cn(
                  "flex flex-col transition-opacity duration-200",
                  getOpacity(hoveredSpotlight, 2)
                )}
              >
                <div className="relative w-full aspect-[2/1] md:aspect-[4/3] rounded-sm overflow-hidden bg-black">
                  <Image
                    src="/assets/images/images-black-2.5.png"
                    alt="Introducing CloseAI images 2.5"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 md:mt-4 flex flex-col gap-5">
                  <h3
                    className={cn(
                      "whitespace-nowrap text-base xl:text-2xl font-semibold leading-snug transition-colors",
                      getCardColor(hoveredSpotlight, 2)
                    )}
                  >
                    Introducing CloseAI Images 2.5
                  </h3>
                  <div className="flex items-center gap-2 text-sm sm:text-md text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Product
                    </span>
                    <span>·</span>
                    <span>Feb 10, 2026</span>
                    <span>·</span>
                    <span>8 min read</span>
                  </div>
                </div>
              </Link>

              {/* Item 3 */}
              <Link
                ref={item3Ref}
                href="/product/features"
                onMouseEnter={() => setHoveredSpotlight(1)}
                onMouseLeave={() => setHoveredSpotlight(null)}
                className={cn(
                  "flex flex-col transition-opacity duration-200",
                  getOpacity(hoveredSpotlight, 1)
                )}
              >
                <div
                  ref={rightCardImgRef}
                  className="relative w-full aspect-[2/1] md:aspect-[4/3] rounded-sm overflow-hidden bg-background"
                >
                  <Image
                    src="/assets/images/system-card.png"
                    alt="GPT-6 Astra System Cards"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 md:mt-4 flex flex-col gap-5">
                  <h3
                    className={cn(
                      "whitespace-nowrap text-base xl:text-2xl font-semibold leading-snug transition-colors",
                      getCardColor(hoveredSpotlight, 1)
                    )}
                  >
                    GPT-6 Astra: System Cards
                  </h3>
                  <div className="flex items-center gap-2 text-sm sm:text-md text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Publication
                    </span>
                    <span>·</span>
                    <span>Mar 15, 2026</span>
                    <span>·</span>
                    <span>5 min read</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* LATEST NEWS & UPDATES (2-column horizontal card layout) */}
        {/* ---------------------------------------------------------------- */}
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto py-12 border-t border-border/80">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Recent News
            </h2>
            <Link
              href="/company/blog"
              className="group inline-flex items-center text-md font-semibold text-foreground tracking-tight"
            >
              <span>View more</span>
              <AnimatedArrow size={18} />
            </Link>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-8 sm:gap-y-10"
            onMouseLeave={() => setHoveredNews(null)}
          >
            {[
              {
                title:
                  "New benchmark records on SWE-bench and Olympiad mathematics",
                category: "Research",
                date: "Jul 15, 2026",
                seed: "New benchmark records on SWE-bench and Olympiad mathematics",
              },
              {
                title:
                  "Global partnership for frontier AI research infrastructure",
                category: "Company",
                date: "May 05, 2026",
                seed: "Global partnership for frontier AI research infrastructure",
              },
              {
                title:
                  "Frontier safety commitments and verifiable alignment benchmarks",
                category: "Research",
                date: "Jun 10, 2026",
                seed: "Frontier safety commitments and verifiable alignment benchmarks",
              },
              {
                title:
                  "Advancements in live audio synthesis and spatial perception",
                category: "Product",
                date: "Aug 20, 2026",
                seed: "Advancements in live audio synthesis and spatial perception",
              },
              {
                title: "Expanding developer grants for open frontier research",
                category: "Foundation",
                date: "Nov 30, 2026",
                seed: "Expanding developer grants for open frontier research",
              },
              {
                title:
                  "Enterprise privacy safeguards with zero unauthorized retention",
                category: "Company",
                date: "Sep 25, 2026",
                seed: "Enterprise privacy safeguards with zero unauthorized retention",
              },
            ].map((news, i) => (
              <Link
                key={i}
                href="/company/blog"
                onMouseEnter={() => setHoveredNews(i)}
                onMouseLeave={() => setHoveredNews(null)}
                className={cn(
                  "group flex items-center gap-4 sm:gap-6 transition-opacity duration-200 cursor-pointer",
                  getOpacity(hoveredNews, i)
                )}
              >
                {/* Visual Thumbnail: DiceBear glass avatar */}
                <div className="relative w-[30%] md:w-[36%] lg:w-[38%] xl:w-[40%] aspect-square rounded-sm overflow-hidden bg-muted/20 shrink-0">
                  <img
                    src={glassAvatar(news.seed)}
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3
                    className={cn(
                      "text-base sm:text-lg font-medium leading-snug tracking-tight text-foreground transition-colors",
                      getCardColor(hoveredNews, i)
                    )}
                  >
                    {news.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">
                      {news.category}
                    </span>
                    <span>{news.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FRONTIER RESEARCH SHOWCASE (3-column square cards)  */}
        {/* ---------------------------------------------------------------- */}
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto py-12 border-t border-border/80">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Latest Research
            </h2>
            <Link
              href="/research/overview"
              className="group inline-flex items-center text-md font-semibold text-foreground tracking-tight"
            >
              <span>View all</span>
              <AnimatedArrow size={18} />
            </Link>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8"
            onMouseLeave={() => setHoveredResearch(null)}
          >
            {[
              {
                title:
                  "The next generation model architecture and self-verifying chain",
                category: "Research",
                date: "Sep 08, 2026",
                seed: "The next generation model architecture and self-verifying chain",
              },
              {
                title:
                  "Unit Distance Problem & Discrete Mathematics Optimization",
                category: "Research",
                date: "Sep 06, 2026",
                seed: "Unit Distance Problem & Discrete Mathematics Optimization",
              },
              {
                title:
                  "Introducing closeAI-Rosalind for Molecular Biology & Therapeutic",
                category: "Publication",
                date: "Aug 01, 2026",
                seed: "Introducing closeAI-Rosalind for Molecular Biology & Therapeutic",
              },
            ].map((paper, i) => (
              <Link
                key={i}
                href="/research/overview"
                onMouseEnter={() => setHoveredResearch(i)}
                onMouseLeave={() => setHoveredResearch(null)}
                className={cn(
                  "group flex flex-col transition-opacity duration-200 cursor-pointer",
                  getOpacity(hoveredResearch, i)
                )}
              >
                {/* Visual Thumbnail: DiceBear glass avatar */}
                <div className="relative w-full aspect-square rounded-sm overflow-hidden bg-muted/20">
                  <img
                    src={glassAvatar(paper.seed)}
                    alt={paper.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <h3
                    className={cn(
                      "text-base sm:text-lg font-medium leading-snug tracking-tight text-foreground transition-colors",
                      getCardColor(hoveredResearch, i)
                    )}
                  >
                    {paper.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {paper.category}
                    </span>
                    <span>{paper.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* BUSINESS & ENTERPRISE PARTNERS (3-column square cards) */}
        {/* ---------------------------------------------------------------- */}
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto py-12 border-t border-border/80">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              CloseAI for Business
            </h2>
            <Link
              href="/business/enterprise"
              className="group inline-flex items-center text-md font-semibold text-foreground tracking-tight"
            >
              <span>View all</span>
              <AnimatedArrow size={18} />
            </Link>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            onMouseLeave={() => setHoveredBusiness(null)}
          >
            {[
              {
                title:
                  "Accelerating deep learning experimentation with closeAI infrastructure",
                category: "Startup",
                date: "Aug 10, 2026",
                seed: "Accelerating deep learning experimentation with closeAI infrastructure",
              },
              {
                title:
                  "Scaling private institutional financial analysis with frontier security",
                category: "Enterprise",
                date: "Aug 10, 2026",
                seed: "Scaling private institutional financial analysis with frontier security",
              },
              {
                title:
                  "Empowering millions with autonomous multi-agent task execution",
                category: "Case study",
                date: "Aug 10, 2026",
                seed: "Empowering millions with autonomous multi-agent task execution",
              },
            ].map((study, i) => (
              <Link
                key={i}
                href="/business/enterprise"
                onMouseEnter={() => setHoveredBusiness(i)}
                onMouseLeave={() => setHoveredBusiness(null)}
                className={cn(
                  "group flex flex-col transition-opacity duration-200 cursor-pointer",
                  getOpacity(hoveredBusiness, i)
                )}
              >
                {/* Visual Thumbnail: DiceBear glass avatar */}
                <div className="relative w-full aspect-square rounded-sm overflow-hidden bg-muted/20">
                  <img
                    src={glassAvatar(study.seed)}
                    alt={study.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <p
                    className={cn(
                      "text-base sm:text-lg font-medium leading-snug tracking-tight text-foreground transition-colors",
                      getCardColor(hoveredBusiness, i)
                    )}
                  >
                    {study.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {study.category}
                    </span>
                    <span>{study.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* BOTTOM CALL TO ACTION BANNER */}
        {/* ---------------------------------------------------------------- */}
        <section className="px-6 sm:px-8 max-w-[1500px] mx-auto py-16">
          <div className="rounded-sm bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-10 sm:p-20 text-center flex flex-col items-center justify-center space-y-6">
            <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-foreground">
              Get started with CloseAI
            </h2>
            <p className="text-muted-foreground text-sm xl:text-xl max-w-md">
              Experience the frontier intelligence designed to think, create,
              and build alongside you.
            </p>
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="group rounded-full px-4 h-12 text-md font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-opacity cursor-pointer"
              >
                <Link href={user ? "/c" : "/gc"} className="flex items-center">
                  <span>Explore Now</span>
                  <AnimatedArrow size={18} />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
