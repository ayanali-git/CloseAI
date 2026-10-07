"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/chat-service";

export function getTargetElement(id: string): HTMLElement | null {
  if (!id || typeof document === "undefined") return null;
  const cleanId = decodeURIComponent(id).replace(/^#/, "").trim();
  if (!cleanId) return null;

  return (
    document.getElementById(cleanId) ||
    (!cleanId.startsWith("m-") ? document.getElementById(`m-${cleanId}`) : null)
  );
}

export type Heading = {
  id: string;
  text: string;
  level?: number;
};

/** full TOC popup — shows all headings as a list with refined hover box */
/**
 * Auto-scrolling title on hover (exact consistent logic with sidebar.tsx)
 */
function TocTitleMarquee({
  title,
  isHovered,
  isSelected,
}: {
  title: string;
  isHovered: boolean;
  isSelected: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (textRef.current && containerRef.current) {
        const diff =
          textRef.current.scrollWidth - containerRef.current.clientWidth;
        setOverflowWidth(Math.max(diff, 0));
      }
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title]);

  const isScrolling = overflowWidth > 0 && isHovered;
  const duration = Math.max(3.2, overflowWidth / 35 + 1.8);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 overflow-hidden pr-1"
      style={{
        animation: isScrolling
          ? `chat-title-marquee-mask ${duration}s ease-in-out infinite`
          : undefined,
        maskImage:
          overflowWidth > 0
            ? isScrolling
              ? undefined
              : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)"
            : "none",

        WebkitMaskImage:
          overflowWidth > 0
            ? isScrolling
              ? undefined
              : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)"
            : "none",
      }}
    >
      {/* Heading title */}
      <span
        ref={textRef}
        style={
          {
            "--marquee-dist": `${overflowWidth}px`,
            animation: isScrolling
              ? `chat-title-marquee ${duration}s ease-in-out infinite`
              : "none",
            transform: isScrolling ? undefined : "translateX(0px)",
            transition: isScrolling ? "none" : "transform 0.25s ease-out",
          } as React.CSSProperties
        }
        className="inline-block whitespace-nowrap text-[15px] leading-snug select-none will-change-transform"
      >
        {title || "Prompt"}
      </span>
    </div>
  );
}

function TocItemRow({
  heading,
  isActive,
  activeItemRef,
  onNavigate,
}: {
  heading: Heading;
  isActive: boolean;
  activeItemRef?: React.Ref<HTMLAnchorElement>;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      ref={activeItemRef}
      href={`#${heading.id}`}
      onClick={(event) => onNavigate(event, heading.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-selected={isActive ? "true" : undefined}
      title={heading.text}
      className={cn(
        "hover-box relative mx-1 rounded-xl px-3 py-2 text-[15px] leading-snug cursor-pointer transition-colors duration-150 flex items-center min-w-0 overflow-hidden text-left",
        isActive
          ? "bg-secondary dark:bg-[#2f2f2f] text-foreground"
          : "text-muted-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] active:bg-secondary dark:active:bg-[#2f2f2f]"
      )}
    >
      <TocTitleMarquee
        title={heading.text}
        isHovered={isHovered}
        isSelected={isActive}
      />
    </a>
  );
}

/** full TOC popup — shows all headings as a list with refined hover box */
function TocPopup({
  headings,
  scrollActiveSectionId,
  onNavigate,
}: {
  headings: Heading[];
  scrollActiveSectionId: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [scrollActiveSectionId]);

  return (
    <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none py-2">
      <nav className="flex flex-col max-h-[360px] overflow-y-auto p-1 scrollbar-thin">
        {headings.map((heading) => {
          const isActive = heading.id === scrollActiveSectionId;

          return (
            <TocItemRow
              key={heading.id}
              heading={heading}
              isActive={isActive}
              activeItemRef={isActive ? activeItemRef : undefined}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>
    </div>
  );
}

/** How far from the top of the viewport a heading counts as "currently reading". */
const READING_LINE_VIEWPORT_RATIO = 0.45;
const READING_LINE_MAX_PX = 220;

/** How close to the page bottom counts as "fully scrolled". */
const PAGE_BOTTOM_MIN_PX = 96;
const PAGE_BOTTOM_VIEWPORT_RATIO = 0.08;

/** Pill width scales: active → nearby → far. */
const PILL_SCALE = {
  active: 1,
  oneStepAway: 0.75,
  twoStepsAway: 0.50,
  resting: 0.25,
} as const;

type ScrollSectionState = {
  scrollActiveSectionId: string;
  readingSectionId: string;
};

function getReadingLinePx() {
  if (typeof window === "undefined") return 200;
  return Math.min(
    window.innerHeight * READING_LINE_VIEWPORT_RATIO,
    READING_LINE_MAX_PX
  );
}

function getPillScaleForIndex(pillIndex: number, focalIndex: number) {
  if (focalIndex < 0) return PILL_SCALE.resting;

  const stepsFromFocal = Math.abs(pillIndex - focalIndex);
  if (stepsFromFocal === 0) return PILL_SCALE.active;
  if (stepsFromFocal === 1) return PILL_SCALE.oneStepAway;
  if (stepsFromFocal === 2) return PILL_SCALE.twoStepsAway;
  return PILL_SCALE.resting;
}

function isPageFullyScrolled() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const maxScrollY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const pixelsFromBottom =
    document.documentElement.scrollHeight -
    (window.scrollY + window.innerHeight);
  const scrollProgress = maxScrollY > 0 ? window.scrollY / maxScrollY : 1;

  return (
    pixelsFromBottom <=
      Math.max(
        PAGE_BOTTOM_MIN_PX,
        window.innerHeight * PAGE_BOTTOM_VIEWPORT_RATIO
      ) ||
    window.scrollY >= maxScrollY - 12 ||
    scrollProgress >= 0.985
  );
}

function isPostFooterVisible() {
  if (typeof document === "undefined") return false;
  const postSection =
    document.querySelector("#posts") ?? document.querySelector("post");
  const sectionBottom = postSection?.getBoundingClientRect().bottom ?? Infinity;
  return sectionBottom <= window.innerHeight + 48;
}

function getScrollSectionState({
  headingElements,
  parsedHeadings,
}: {
  headingElements: Element[];
  parsedHeadings: Heading[];
  isScrolling?: boolean;
}): ScrollSectionState {
  const firstSectionId = parsedHeadings[0]?.id ?? "";
  const lastSectionId = parsedHeadings[parsedHeadings.length - 1]?.id ?? "";
  const readingLinePx = getReadingLinePx();

  // Pin the bottom tail when at the page end.
  const shouldHighlightBottomTail =
    (isPageFullyScrolled() || isPostFooterVisible()) && lastSectionId;

  if (shouldHighlightBottomTail) {
    return {
      scrollActiveSectionId: lastSectionId,
      readingSectionId: lastSectionId,
    };
  }

  let scrollActiveIndex = -1;

  for (let index = 0; index < headingElements.length; index++) {
    const headingTop = (
      headingElements[index] as HTMLElement
    ).getBoundingClientRect().top;
    if (headingTop <= readingLinePx) {
      scrollActiveIndex = index;
    }
  }

  const firstHeading = headingElements[0] as HTMLElement | undefined;
  const firstHeadingTop = firstHeading?.getBoundingClientRect().top ?? Infinity;
  const isBeforeFirstSection =
    scrollActiveIndex < 0 ||
    (typeof window !== "undefined" && window.scrollY <= 24 && firstHeadingTop > readingLinePx);

  if (isBeforeFirstSection) {
    return {
      scrollActiveSectionId: firstSectionId,
      readingSectionId: firstSectionId,
    };
  }

  const scrollActiveSectionId = parsedHeadings[scrollActiveIndex]?.id ?? firstSectionId;
  return {
    scrollActiveSectionId,
    readingSectionId: scrollActiveSectionId || firstSectionId,
  };
}

function PreviewRail({
  headings,
  scrollActiveSectionId,
  orientation = "vertical",
  showPreview = true,
  onNavigate,
  className,
}: {
  headings: Heading[];
  scrollActiveSectionId: string;
  orientation?: "vertical" | "horizontal";
  showPreview?: boolean;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
  className?: string;
}) {
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [isRailHovered, setIsRailHovered] = useState(false);
  const hoverLeaveTimer = useRef<number | null>(null);
  const isHorizontal = orientation === "horizontal";

  const validScrollActiveSectionId =
    scrollActiveSectionId &&
    headings.some((heading) => heading.id === scrollActiveSectionId)
      ? scrollActiveSectionId
      : headings[0]?.id ?? "";

  // Priority: hover → keyboard focus → live scroll position.
  const focalSectionId = focusedSectionId ?? validScrollActiveSectionId;

  const focalSectionIndex = headings.findIndex(
    (heading) => heading.id === focalSectionId
  );

  const showTocPopup =
    showPreview &&
    !isHorizontal &&
    (isRailHovered || focusedSectionId !== null);

  const gridTemplate = headings.length
    ? isHorizontal
      ? `repeat(${headings.length}, minmax(0.1rem, 1fr))`
      : `repeat(${headings.length}, minmax(0.55rem, 0.35rem))`
    : undefined;

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedSectionId(null);
        }
      }}
      className={cn(
        "relative flex overflow-visible pointer-events-none justify-end",
        isHorizontal
          ? "w-full min-h-48 flex-col items-center justify-center"
          : "h-fit w-fit",
        className
      )}
    >
      {/* Hover wrapper — covers only the nav rail area */}
      <div
        onPointerEnter={() => {
          if (hoverLeaveTimer.current) {
            window.clearTimeout(hoverLeaveTimer.current);
            hoverLeaveTimer.current = null;
          }
          setIsRailHovered(true);
        }}
        onPointerLeave={() => {
          hoverLeaveTimer.current = window.setTimeout(() => {
            setIsRailHovered(false);
            hoverLeaveTimer.current = null;
          }, 300);
        }}
        className={cn(
          "pointer-events-auto relative my-auto py-2",
          isHorizontal ? "w-full" : "ml-auto h-fit w-8 flex justify-end items-center"
        )}
      >
        <nav
          aria-label="ON THIS PAGE"
          style={
            isHorizontal
              ? { gridTemplateColumns: gridTemplate }
              : { gridTemplateRows: gridTemplate }
          }
          className={cn(
            "relative z-10 grid shrink-0",
            isHorizontal
              ? "h-12 w-full max-w-full justify-center"
              : "h-fit w-7 content-center justify-items-end"
          )}
        >
          {headings.map((heading, index) => {
            const isScrollActive = heading.id === validScrollActiveSectionId;
            const isFocalSection = heading.id === focalSectionId;

            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                aria-label={heading.text}
                aria-current={isScrollActive ? "location" : undefined}
                onFocus={(event) => {
                  if (event.currentTarget.matches(":focus-visible")) {
                    setFocusedSectionId(heading.id);
                  }
                }}
                onClick={(event) => onNavigate(event, heading.id)}
                className={cn(
                  "relative flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
                  isHorizontal
                    ? "h-13 w-full min-w-2 items-end justify-center"
                    : "h-5 w-5 items-center justify-end"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-full transition-colors duration-150",
                    isHorizontal
                      ? "h-8 w-0.5 origin-bottom"
                      : "h-[2px] w-7 origin-right",
                    isFocalSection
                      ? "bg-foreground"
                      : "bg-neutral-400/80 dark:bg-neutral-600 group-hover:bg-neutral-500"
                  )}
                />
              </a>
            );
          })}
        </nav>

        {/* TOC popup — opens directly aligned on top of the rail on hover */}
        {showTocPopup && (
          <div className="absolute top-1/2 right-0 z-50 -translate-y-1/2">
            <TocPopup
              headings={headings}
              scrollActiveSectionId={validScrollActiveSectionId}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export interface TocNavigatorProps {
  messages?: Message[];
  containerRef?: React.RefObject<HTMLDivElement>;
  customHeadings?: Heading[];
  minHeadings?: number;
  minMessages?: number;
  className?: string;
}

export function TocNavigator({
  messages,
  containerRef,
  customHeadings,
  minHeadings = 3,
  minMessages,
  className,
}: TocNavigatorProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [scrollActiveSectionId, setScrollActiveSectionId] =
    useState<string>("");

  const headingElementsRef = useRef<Element[]>([]);
  const parsedHeadingsRef = useRef<Heading[]>([]);
  const userClickedSectionIdRef = useRef<string | null>(null);
  const clickLockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (customHeadings && customHeadings.length > 0) {
      setHeadings(customHeadings);
      parsedHeadingsRef.current = customHeadings;
      setScrollActiveSectionId(customHeadings[0]?.id || "");
      return;
    }

    if (messages && messages.length > 0) {
      const userPrompts = messages
        .filter((m) => m.role === "user")
        .map((msg, index) => {
          const content = msg.content?.trim() || "";
          const firstLine = content.split("\n")[0].trim();
          let text = firstLine || content;
          if (!text && (msg as any).files?.length) {
            text = `Attachment (${(msg as any).files.length} file${(msg as any).files.length > 1 ? "s" : ""})`;
          }
          if (!text) {
            text = `Prompt #${index + 1}`;
          }
          const promptText = text.length > 300 ? text.substring(0, 300) : text;
          const mId = msg.id
            ? (msg.id.startsWith("m-") ? msg.id : `m-${msg.id}`)
            : `m-${index}`;

          return {
            id: mId,
            text: promptText,
            level: 2,
          };
        });
      setHeadings(userPrompts);
      parsedHeadingsRef.current = userPrompts;
      setScrollActiveSectionId((prev) => {
        if (!prev && userPrompts.length > 0) {
          return userPrompts[0].id;
        }
        if (prev && userPrompts.some((h) => h.id === prev)) {
          return prev;
        }
        return userPrompts.length > 0 ? userPrompts[userPrompts.length - 1].id : "";
      });
      return;
    }

    // Default DOM search for #posts or h2
    const post = document.querySelector("#posts") || document.querySelector("main");
    if (post) {
      const headingElements = Array.from(post.querySelectorAll("h2"));
      headingElementsRef.current = headingElements;
      const parsed = headingElements.map((el) => {
        if (!el.id) {
          el.id =
            el.textContent
              ?.toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/[\s_]+/g, "-") || "";
        }
        return {
          id: el.id,
          text: el.textContent || "",
          level: 2,
        };
      });
      setHeadings(parsed);
      parsedHeadingsRef.current = parsed;
      setScrollActiveSectionId((prev) => {
        if (!prev && parsed.length > 0) {
          return parsed[0].id;
        }
        if (prev && parsed.some((h) => h.id === prev)) {
          return prev;
        }
        return parsed.length > 0 ? parsed[0].id : "";
      });
    }
  }, [messages, customHeadings]);

  // Track scroll state in the container or window
  useEffect(() => {
    if (headings.length === 0) return;

    let rafId: number | null = null;

    const syncScrollState = () => {
      if (userClickedSectionIdRef.current) {
        setScrollActiveSectionId((prev) =>
          prev !== userClickedSectionIdRef.current
            ? (userClickedSectionIdRef.current as string)
            : prev
        );
        if (clickLockTimerRef.current) {
          window.clearTimeout(clickLockTimerRef.current);
        }
        clickLockTimerRef.current = window.setTimeout(() => {
          userClickedSectionIdRef.current = null;
        }, 250);
        return;
      }

      if (containerRef?.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        // Pin the bottom tail when at/near the container end
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight <= 100;
        if (isAtBottom && headings.length > 0) {
          const lastId = headings[headings.length - 1].id;
          setScrollActiveSectionId((prev) => (prev !== lastId ? lastId : prev));
          return;
        }

        const readingLinePx = Math.min(container.clientHeight * 0.4, 220);

        for (let i = headings.length - 1; i >= 0; i--) {
          const elem = getTargetElement(headings[i].id);
          if (elem) {
            const elemRect = elem.getBoundingClientRect();
            const relativeTop = elemRect.top - containerRect.top;
            if (relativeTop <= readingLinePx) {
              const targetId = headings[i].id;
              setScrollActiveSectionId((prev) => (prev !== targetId ? targetId : prev));
              return;
            }
          }
        }
        const firstId = headings[0]?.id || "";
        setScrollActiveSectionId((prev) => (prev !== firstId ? firstId : prev));
      } else {
        const {
          scrollActiveSectionId: nextScrollActiveSectionId,
        } = getScrollSectionState({
          headingElements: headingElementsRef.current,
          parsedHeadings: parsedHeadingsRef.current,
        });
        setScrollActiveSectionId((prev) =>
          prev !== nextScrollActiveSectionId ? nextScrollActiveSectionId : prev
        );
      }
    };

    const handleScrollPassive = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncScrollState();
      });
    };

    const target = containerRef?.current || window;
    target.addEventListener("scroll", handleScrollPassive, { passive: true });
    window.addEventListener("resize", handleScrollPassive, { passive: true });
    syncScrollState();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      target.removeEventListener("scroll", handleScrollPassive);
      window.removeEventListener("resize", handleScrollPassive);
    };
  }, [headings, containerRef]);

  // Handle browser URL hash change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const cleanId = decodeURIComponent(hash.replace(/^#/, "")).trim();
      if (!cleanId) return;

      const elem = getTargetElement(cleanId);
      if (!elem) return;

      userClickedSectionIdRef.current = cleanId;
      setScrollActiveSectionId(cleanId);

      if (clickLockTimerRef.current) {
        window.clearTimeout(clickLockTimerRef.current);
      }
      clickLockTimerRef.current = window.setTimeout(() => {
        userClickedSectionIdRef.current = null;
      }, 1200);

      if (containerRef?.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elemRect = elem.getBoundingClientRect();
        const targetScrollTop =
          container.scrollTop + (elemRect.top - containerRect.top) - 96;
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        const boundedTarget = Math.min(maxScroll, Math.max(0, targetScrollTop));

        container.scrollTo({
          top: boundedTarget,
          behavior: "smooth",
        });
      } else {
        const yOffset = -96;
        const y = Math.max(
          0,
          elem.getBoundingClientRect().top + window.scrollY + yOffset
        );
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [headings, containerRef]);

  if (headings.length === 0) return null;

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = getTargetElement(id);
    if (!elem) return;

    userClickedSectionIdRef.current = id;
    setScrollActiveSectionId(id);

    if (clickLockTimerRef.current) {
      window.clearTimeout(clickLockTimerRef.current);
    }
    clickLockTimerRef.current = window.setTimeout(() => {
      userClickedSectionIdRef.current = null;
    }, 1200);

    if (containerRef?.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const elemRect = elem.getBoundingClientRect();
      const targetScrollTop =
        container.scrollTop + (elemRect.top - containerRect.top) - 96;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const boundedTarget = Math.min(maxScroll, Math.max(0, targetScrollTop));

      container.scrollTo({
        top: boundedTarget,
        behavior: "smooth",
      });
    } else {
      const yOffset = -96;
      const y = Math.max(
        0,
        elem.getBoundingClientRect().top + window.scrollY + yOffset
      );
      window.scrollTo({ top: y, behavior: "smooth" });
    }

    window.history.pushState(null, "", `#${id}`);
  };

  // Only show TOC when there are at least minHeadings (default 3) headings / prompts
  if (headings.length < minHeadings) {
    return null;
  }

  if (minMessages !== undefined && (messages?.length ?? 0) < minMessages) {
    return null;
  }

  return (
    <aside className={cn("pointer-events-none absolute top-1/2 right-4 sm:right-5 z-30 hidden h-[min(460px,70vh)] w-fit -translate-y-1/2 select-none xl:block", className)}>
        <PreviewRail
          headings={headings}
          scrollActiveSectionId={scrollActiveSectionId}
          onNavigate={handleLinkClick}
          className="h-[min(460px,70vh)]"
        />
    </aside>
  );
}

export const OnThisPage = TocNavigator;
export default TocNavigator;

