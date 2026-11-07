"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader, Pencil } from "lucide-react";
import { ProfileImageModal } from "@/components/modals/profile-image-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { supabase } from "@/lib/supabase";
import toast from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  AvatarShapeId,
  AvatarShapeDefs,
  getAvatarClipStyle,
} from "@/lib/avatar-shapes";

/* ==========================================================================
   Chat Activity Heatmap Types & Constants
   ========================================================================== */

type DayCell = {
  date: string;
  count: number;
  future: boolean;
};

type Granularity = "daily" | "weekly" | "monthly";

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly"];

const CELL_GAP_PX = 3;
const WEEK_COUNT = 53;
const DAY_COUNT = 7;
const MIN_CELL_SIZE = 10;
const PILL_HEIGHT_ESTIMATE = 30;
const FALLBACK_RADIUS_PX = "9999px";

const TONE_STEPS = [
  "bg-secondary dark:bg-neutral-800",
  "bg-foreground/25",
  "bg-foreground/40",
  "bg-foreground/60",
  "bg-foreground/85",
] as const;

const TONE_THRESHOLDS: Record<Granularity, [number, number, number]> = {
  daily: [1, 2, 4],
  weekly: [3, 7, 14],
  monthly: [10, 30, 60],
};

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toLocalDateKey(iso: string) {
  return localDateKey(new Date(iso));
}

function buildWeeks(dates: string[]): DayCell[][] {
  const counts = new Map<string, number>();
  dates.forEach((key) => {
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - 52 * 7);
  while (start.getDay() !== 0) {
    start.setDate(start.getDate() - 1);
  }

  const weeks: DayCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEK_COUNT; w += 1) {
    const week: DayCell[] = [];
    for (let d = 0; d < DAY_COUNT; d += 1) {
      const key = localDateKey(cursor);
      const future = cursor.getTime() > today.getTime();
      week.push({
        date: key,
        count: future ? 0 : counts.get(key) || 0,
        future,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (week.every((cell) => cell.future)) break;
  }
  return weeks;
}

function monthLabels(
  weeks: DayCell[][],
  minDaysToLabelFirstWeek = 4,
  minColumnGap = 3
) {
  const labels: string[] = new Array(weeks.length).fill("");
  let prevMonthKey: string | null = null;
  let lastLabeledIndex = -Infinity;

  weeks.forEach((week, index) => {
    const anchor = week[0];
    const anchorDate = new Date(`${anchor.date}T00:00:00`);
    const monthKey = `${anchorDate.getFullYear()}-${anchorDate.getMonth()}`;

    if (monthKey === prevMonthKey) return;
    prevMonthKey = monthKey;

    const visibleDays = week.filter((c) => !c.future).length;
    if (visibleDays === 0) return;

    const isTinyLeadingWeek = index === 0 && visibleDays < minDaysToLabelFirstWeek;
    if (isTinyLeadingWeek) return;

    if (index - lastLabeledIndex < minColumnGap) return;

    labels[index] = anchorDate.toLocaleString(undefined, { month: "short" });
    lastLabeledIndex = index;
  });

  return labels;
}

function toneIndexForCount(count: number, granularity: Granularity) {
  if (count <= 0) return 0;
  const [tier1Max, tier2Max, tier3Max] = TONE_THRESHOLDS[granularity];
  if (count <= tier1Max) return 1;
  if (count <= tier2Max) return 2;
  if (count <= tier3Max) return 3;
  return 4;
}

function cellTone(count: number, future: boolean, granularity: Granularity) {
  if (future) return "bg-secondary/50 dark:bg-neutral-800/50";
  return TONE_STEPS[toneIndexForCount(count, granularity)];
}

function bucketKeyFor(cell: DayCell, weekStart: string, granularity: Granularity) {
  if (granularity === "weekly") return weekStart;
  if (granularity === "monthly") return cell.date.slice(0, 7);
  return cell.date;
}

function applyGranularity(weeks: DayCell[][], granularity: Granularity): DayCell[][] {
  if (granularity === "daily") return weeks;

  const totals = new Map<string, number>();

  weeks.forEach((week) => {
    const weekStart = week[0].date;
    week.forEach((cell) => {
      if (cell.future) return;
      const key = bucketKeyFor(cell, weekStart, granularity);
      totals.set(key, (totals.get(key) || 0) + cell.count);
    });
  });

  return weeks.map((week) => {
    const weekStart = week[0].date;
    return week.map((cell) => {
      if (cell.future) return cell;
      const key = bucketKeyFor(cell, weekStart, granularity);
      return { ...cell, count: totals.get(key) || 0 };
    });
  });
}

function formatPill(cell: DayCell, granularity: Granularity, weekStart: string) {
  const noun = cell.count === 1 ? "chat" : "chats";

  if (granularity === "monthly") {
    const when = new Date(`${cell.date}T00:00:00`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    return `${cell.count} ${noun} in ${when}`;
  }

  if (granularity === "weekly") {
    const when = new Date(`${weekStart}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${cell.count} ${noun} on week of ${when}`;
  }

  const when = new Date(`${cell.date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${cell.count} ${noun} on ${when}`;
}

function circleRadius(size: number | null) {
  return FALLBACK_RADIUS_PX;
}

function ActivityTooltip({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const clampedX = Math.min(Math.max(x, 60), vw - 60);
  const showBelow = y < PILL_HEIGHT_ESTIMATE;
  const top = showBelow ? y + 8 : y - 8;

  return createPortal(
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none fixed z-[10000] -translate-x-1/2 rounded-full bg-secondary px-2.5 py-1 text-sm text-foreground border border-border/80 dark:border-none whitespace-nowrap",
        showBelow ? "translate-y-0" : "-translate-y-full"
      )}
      style={{ left: clampedX, top }}
    >
      {text}
    </div>,
    document.body
  );
}

export function ChatActivityHeatmap({ dates }: { dates: string[] }) {
  const weeks = useMemo(() => buildWeeks(dates), [dates]);
  const labels = useMemo(() => monthLabels(weeks), [weeks]);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clickMode, setClickMode] = useState(false);
  const [cellSize, setCellSize] = useState<number | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [active, setActive] = useState<{
    key: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const displayWeeks = useMemo(
    () => applyGranularity(weeks, granularity),
    [weeks, granularity]
  );

  useEffect(() => {
    const sync = () => {
      const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      setClickMode(coarse);
    };
    sync();
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    mq.addEventListener?.("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener?.("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      const totalGap = CELL_GAP_PX * (WEEK_COUNT - 1);
      const size = Math.floor((width - totalGap) / WEEK_COUNT);
      setCellSize(Math.max(size, MIN_CELL_SIZE));
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const close = (event: Event) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setActive(null);
    };
    const onScroll = () => setActive(null);
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active]);

  const showFor = (el: HTMLElement, cell: DayCell, weekStart: string) => {
    const rect = el.getBoundingClientRect();
    setActive({
      key: bucketKeyFor(cell, weekStart, granularity),
      text: formatPill(cell, granularity, weekStart),
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller && cellSize) {
      requestAnimationFrame(() => {
        scroller.scrollLeft = scroller.scrollWidth;
      });
    }
  }, [weeks.length, granularity, cellSize]);

  const radius = circleRadius(cellSize);

  return (
    <div ref={rootRef} className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">Chat activity</p>
        <div className="flex items-center gap-3">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGranularity(g);
                setActive(null);
              }}
              aria-pressed={granularity === g}
              className={cn(
                "text-xs capitalize transition-colors cursor-pointer",
                granularity === g
                  ? "text-foreground font-normal"
                  : "text-muted-foreground font-normal hover:text-foreground/80"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        data-activity-scroll
        className="w-full h-fit overflow-x-auto overflow-y-hidden pb-1.5 dark:[color-scheme:dark] [color-scheme:light]"
        aria-label="Chat activity heatmap"
      >
        <div className="w-max min-w-full">
          <div className="flex justify-between" style={{ gap: CELL_GAP_PX }}>
            {displayWeeks.map((week, weekIndex) => {
              const weekStart = week[0]?.date ?? "";
              return (
                <div
                  key={weekStart || weekIndex}
                  className="flex flex-col shrink-0"
                  style={{ gap: CELL_GAP_PX, width: cellSize ?? undefined }}
                >
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      disabled={cell.future}
                      aria-label={
                        cell.future ? undefined : formatPill(cell, granularity, weekStart)
                      }
                      onMouseEnter={(e) => {
                        if (clickMode || cell.future) return;
                        showFor(e.currentTarget, cell, weekStart);
                      }}
                      onMouseLeave={() => {
                        if (!clickMode) setActive(null);
                      }}
                      onFocus={(e) => {
                        if (cell.future) return;
                        showFor(e.currentTarget, cell, weekStart);
                      }}
                      onBlur={() => {
                        if (!clickMode) setActive(null);
                      }}
                      onClick={(e) => {
                        if (cell.future) return;
                        e.stopPropagation();
                        const key = bucketKeyFor(cell, weekStart, granularity);
                        if (active?.key === key) {
                          setActive(null);
                          return;
                        }
                        showFor(e.currentTarget, cell, weekStart);
                      }}
                      style={
                        cellSize
                          ? {
                              width: cellSize,
                              height: cellSize,
                              flexShrink: 0,
                              borderRadius: "9999px",
                            }
                          : {
                              aspectRatio: "1 / 1",
                              flex: "1 1 0%",
                              borderRadius: "9999px",
                            }
                      }
                      className={cn(
                        "!rounded-full aspect-square shrink-0",
                        cell.future ? "cursor-default" : "cursor-pointer",
                        cellTone(cell.count, cell.future, granularity)
                      )}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="relative mt-1.5 pointer-events-none" style={{ height: 14 }}>
            {labels.map((label, index) => {
              if (!label) return null;
              const left = cellSize
                ? index * (cellSize + CELL_GAP_PX)
                : (index / WEEK_COUNT) * 100 + "%";
              return (
                <span
                  key={`${label}-${index}`}
                  className="absolute top-0 whitespace-nowrap text-[10px] leading-none text-muted-foreground"
                  style={{ left }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      {active ? <ActivityTooltip x={active.x} y={active.y} text={active.text} /> : null}
    </div>
  );
}

/* ==========================================================================
   Profile Panel Component
   ========================================================================== */

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function streakFrom(dates: Set<string>) {
  let current = 0;
  let longest = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayKey = toLocalDateKey(cursor.toISOString());
  if (!dates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dates.has(toLocalDateKey(cursor.toISOString()))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const all = Array.from(dates).sort();
  let run = 0;
  let prev: Date | null = null;
  for (const key of all) {
    const day = new Date(`${key}T00:00:00`);
    if (prev && (day.getTime() - prev.getTime()) / 86400000 === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest };
}

export function ProfilePanel({
  onUsernameUpdated,
  onOpenEdit,
  className,
  isLoading: externalLoading = false,
}: {
  onUsernameUpdated?: (newUsername: string) => void;
  onOpenEdit?: () => void;
  className?: string;
  isLoading?: boolean;
} = {}) {
  const { user, loading, refreshSession } = useAuth();
  const { plan, usage, loading: subLoading } = useSubscription();

  const initialName = user?.user_metadata?.name || user?.user_metadata?.full_name || "";
  const initialUsername =
    user?.user_metadata?.username || user?.user_metadata?.user_name || user?.email?.split("@")[0] || "";
  const initialAvatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const [savedName, setSavedName] = useState(initialName);
  const [savedUsername, setSavedUsername] = useState(initialUsername);

  const [imageOpen, setImageOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activityDates, setActivityDates] = useState<string[] | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentName = user.user_metadata?.name || user.user_metadata?.full_name || "";
    const currentUsername =
      user.user_metadata?.username || user.user_metadata?.user_name || user.email?.split("@")[0] || "";
    const currentAvatar =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    setSavedName(currentName);
    setSavedUsername(currentUsername);
    setAvatarUrl(currentAvatar);
    if (!currentAvatar) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("chats")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = data || [];
      setChatCount(rows.length);
      setActivityDates(rows.map((row) => toLocalDateKey(row.created_at as string)));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const dateSet = useMemo(
    () => new Set(activityDates || []),
    [activityDates]
  );
  const streaks = useMemo(() => streakFrom(dateSet), [dateSet]);

  const activeSavedUsername = (savedUsername || initialUsername || user?.user_metadata?.user_name || user?.email?.split("@")[0] || "user").trim();
  const displayName = (savedName || initialName || activeSavedUsername).trim();
  const planLabel =
    plan === "ultra" ? "Ultra Pro" : plan === "pro" ? "Pro" : "Free";
  const usersubtitle = `@${activeSavedUsername} · ${planLabel}`;

  const avatarShape =
    (user?.user_metadata?.avatar_shape as AvatarShapeId) ||
    ((typeof window !== "undefined" &&
      (localStorage.getItem("closeai_avatar_shape") as AvatarShapeId)) ||
      "circle");
  const avatarClipStyle = getAvatarClipStyle(avatarShape);

  const isProfileLoading =
    externalLoading ||
    loading ||
    !user ||
    activityDates === null ||
    chatCount === null;

  return (
    <div className={cn("space-y-6", className)}>
      <AvatarShapeDefs />
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative group">
          {isProfileLoading ? (
            <div
              style={avatarClipStyle}
              className="w-28 h-28 sm:w-32 sm:h-32 bg-secondary/80 dark:bg-neutral-800/80 animate-pulse mx-auto shrink-0 border border-border/40 select-none overflow-hidden"
            />
          ) : avatarUrl ? (
            <div
              style={avatarClipStyle}
              className="relative w-28 h-28 sm:w-32 sm:h-32 overflow-hidden border border-border/80 dark:border-none select-none bg-secondary/80 dark:bg-neutral-800/80 shrink-0"
            >
              {!imageLoaded && !imageError && (
                <div
                  style={avatarClipStyle}
                  className="absolute inset-0 w-full h-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse"
                />
              )}
              <img
                src={avatarUrl}
                alt={displayName}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={cn(
                  "w-full h-full object-cover select-none transition-opacity duration-150 pointer-events-none",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="eager"
                decoding="sync"
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary text-foreground text-3xl sm:text-4xl font-semibold select-none">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <div
              style={avatarClipStyle}
              className="w-28 h-28 sm:w-32 sm:h-32 border border-border select-none bg-secondary text-foreground flex items-center justify-center text-3xl sm:text-4xl font-semibold select-none shrink-0 overflow-hidden"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isProfileLoading && !displayName ? (
          <div className="mt-3 h-6 w-36 rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        ) : (
          <h3 className="mt-3 text-lg font-medium text-foreground">{displayName}</h3>
        )}
        {isProfileLoading && !user ? (
          <div className="mt-1.5 h-4 w-28 rounded bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">{usersubtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl border border-border/80 dark:border-none overflow-hidden">
        {[
          {
            label: "Total messages",
            value: isProfileLoading || chatCount === null ? null : `${formatCompact(chatCount)} chats`,
          },
          {
            label: "Today messages",
            value: isProfileLoading || subLoading ? null : `${formatCompact(usage.messages.used)} chats`,
          },
          {
            label: "Longest streak",
            value: isProfileLoading || activityDates === null ? null : `${streaks.longest} days`,
          },
          {
            label: "Current streak",
            value: isProfileLoading || activityDates === null ? null : `${streaks.current} days`,
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "px-3 py-3 text-center border-border/80 dark:border-white/10",
              index === 0 && "border-r",
              index === 1 && "border-r-0 sm:border-r",
              index === 2 && "border-r",
              index === 3 && "border-r-0",
              index < 2 ? "border-b sm:border-b-0" : "border-b-0"
            )}
          >
            {stat.value === null ? (
              <div className="h-5 w-16 mx-auto rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
            ) : (
              <p className="text-[15px] font-medium text-foreground">{stat.value}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {isProfileLoading || activityDates === null ? (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Chat activity</p>
            <div className="flex items-center gap-3">
              {GRANULARITIES.map((g) => (
                <span
                  key={g}
                  className={cn(
                    "text-xs capitalize",
                    g === "daily"
                      ? "text-foreground font-normal"
                      : "text-muted-foreground font-normal"
                  )}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[120px] xl:h-[130px] w-full rounded-xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        </div>
      ) : (
        <ChatActivityHeatmap dates={activityDates} />
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Email</span>
          {isProfileLoading && !user?.email ? (
            <div className="h-4 w-40 rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
          ) : (
            <span className="text-foreground truncate ml-4">{user?.email}</span>
          )}
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Username</span>
          {isProfileLoading && !activeSavedUsername ? (
            <div className="h-4 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
          ) : (
            <span className="text-foreground">@{activeSavedUsername}</span>
          )}
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Plan</span>
          {isProfileLoading && subLoading ? (
            <div className="h-4 w-11 rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
          ) : (
            <span className="text-foreground">{planLabel}</span>
          )}
        </div>
      </div>

      <ProfileImageModal
        open={imageOpen}
        onOpenChange={setImageOpen}
        currentAvatarUrl={avatarUrl}
        userName={displayName}
        userEmail={user?.email}
        onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
      />
    </div>
  );
}

export default ProfilePanel;