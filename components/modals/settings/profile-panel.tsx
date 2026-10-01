"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageModal } from "@/components/modals/profile-image-modal";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { supabase } from "@/lib/supabase";
import toast from "@/lib/toast";
import { ChatActivityHeatmap, toLocalDateKey } from "@/components/modals/settings/chat-activity";

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
        <div className="mx-auto h-5 w-32 rounded-md bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
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
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none flex items-center justify-center cursor-pointer"
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
        ].map((stat) => (
          <div
            key={stat.label}
            className="px-3 py-3 text-center border-r border-b sm:border-b-0 border-border/80 dark:border-white/10 last:border-r-0"
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
          className="w-full h-11 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
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