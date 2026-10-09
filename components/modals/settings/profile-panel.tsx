"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageModal } from "@/components/modals/profile-image-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { supabase } from "@/lib/supabase";
import toast from "@/lib/toast";
import { cn } from "@/lib/utils";

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
const FALLBACK_RADIUS_PX = 9999;

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
  if (!size) return FALLBACK_RADIUS_PX;
  return size / 4;
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
        "pointer-events-none fixed z-[10000] -translate-x-1/2 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground border border-border/80 dark:border-white/10 whitespace-nowrap",
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
                              borderRadius: radius,
                            }
                          : {
                              aspectRatio: "1 / 1",
                              flex: "1 1 0%",
                              borderRadius: radius,
                            }
                      }
                      className={cn(
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

export function ProfilePanel() {
  const { user, loading, refreshSession } = useAuth();
  const { plan, usage, loading: subLoading } = useSubscription();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const usersubtitle = `@${username} · ${plan}`;
  const [saving, setSaving] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activityDates, setActivityDates] = useState<string[] | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.user_metadata?.name || user.user_metadata?.full_name || "");
    setUsername(
      user.user_metadata?.username || user.email?.split("@")[0] || ""
    );
    setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
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

  const initialName = user?.user_metadata?.name || user?.user_metadata?.full_name || "";
  const initialUsername =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const handle = username.trim() || user?.email?.split("@")[0] || "user";
  const displayName = name.trim() || handle;
  const planLabel =
    plan === "ultra" ? "Ultra Pro" : plan === "pro" ? "Pro" : "Free";

  const nameChanged = name.trim() !== initialName.trim();
  const usernameChanged = username.trim() !== initialUsername.trim();
  const hasChanges = nameChanged || usernameChanged;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !hasChanges) return;
    setSaving(true);
    try {
      const trimmedName = name.trim();
      const trimmedUsername = username.trim();
      if (user?.id) {
        await supabase
          .from("profiles")
          .update({ name: trimmedName, username: trimmedUsername })
          .eq("id", user.id);
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          name: trimmedName,
          full_name: trimmedName,
          username: trimmedUsername,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        await refreshSession();
        toast.success("Profile updated");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="space-y-4 pt-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="mx-auto h-5 w-32 rounded-2xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="h-16 rounded-2xl bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
        <div className="h-24 rounded-2xl bg-secondary/70 dark:bg-neutral-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative group">
          <Avatar
            className="w-20 h-20 border border-border cursor-pointer"
            onClick={() => setImageOpen(true)}
          >
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xl font-medium">
              {displayName}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121] transition-all"
            aria-label="Update profile picture"
          >
            <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>
        <h3 className="mt-3 text-lg font-medium text-foreground">{displayName}</h3>
        <p className="text-sm text-muted-foreground">
          {usersubtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl border border-border/80 dark:border-none overflow-hidden">
        {[
          {
            label: "Lifetime chats",
            value: chatCount === null ? null : formatCompact(chatCount),
          },
          {
            label: "Messages today",
            value: subLoading ? null : formatCompact(usage.messages.used),
          },
          {
            label: "Current streak",
            value: activityDates === null ? null : `${streaks.current} days`,
          },
          {
            label: "Longest streak",
            value: activityDates === null ? null : `${streaks.longest} days`,
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
              <div className="h-5 w-10 mx-auto rounded bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
            ) : (
              <p className="text-[15px] font-medium text-foreground">{stat.value}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {activityDates === null ? (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Chat activity</p>
          <div className="h-[110px] rounded-xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        </div>
      ) : (
        <ChatActivityHeatmap dates={activityDates} />
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Email</span>
          <span className="text-foreground truncate ml-4">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Username</span>
          <span className="text-foreground">@{handle}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <span className="text-muted-foreground">Plan</span>
          <span className="text-foreground">{planLabel}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="text-muted-foreground focus-within:text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-username">Username</Label>
          <Input
            id="profile-username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.replace(/\s+/g, ""))
            }
            placeholder="username"
            className="text-muted-foreground focus-within:text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim() || !username.trim() || !hasChanges}
          className="w-full h-11 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all select-none"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : "Update profile"}
        </button>
      </form>

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