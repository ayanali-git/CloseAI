"use client";

import React, { useState } from "react";
import {
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Copy, Check, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { useSubscription } from "@/components/subscription-provider";
import {
  AvatarShapeId,
  AvatarShapeDefs,
  getAvatarClipStyle,
} from "@/lib/avatar-shapes";
import { getProductionAppUrl, getProductionDomain } from "@/lib/url";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

export interface ShareProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  avatarShape?: AvatarShapeId;
  planLabel?: string;
  isGuest?: boolean;
}

function RedditLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-5 h-5 fill-current", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

export function ShareProfileModal({
  open,
  onOpenChange,
  username,
  displayName,
  avatarUrl,
  avatarShape = "circle",
  planLabel: planLabelProp,
  isGuest: isGuestProp,
}: ShareProfileModalProps) {
  const { isGuest, modalBgClass } = useModalTheme(isGuestProp, open);
  const { plan } = useSubscription();
  const [copied, setCopied] = useState(false);

  const derivedPlanLabel =
    planLabelProp ??
    (plan === "ultra" ? "Ultra Pro" : plan === "pro" ? "Pro" : "Free");

  const productionAppUrl = getProductionAppUrl();
  const productionDomain = getProductionDomain();

  const cleanUsername = username.replace(/^@/, "").trim();
  const profileUrl = `${productionAppUrl}/u/@${cleanUsername}`;
  const displayUrl = `${productionDomain}/u/@${cleanUsername}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy profile link");
    }
  };

  const shareText = `Check out ${displayName}'s profile on CloseAI`;

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      profileUrl
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      profileUrl
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(
      profileUrl
    )}&title=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const clipStyle = getAvatarClipStyle(avatarShape);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className={cn(
        "max-w-[600px]",
        modalBgClass
      )}
    >
      <AvatarShapeDefs />
      <div className="flex flex-col space-y-5 pt-1 pb-3">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground select-none">
            Share profile
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "hidden min-[1280px]:flex p-3 rounded-sm items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors cursor-pointer shrink-0",
              isGuest
                ? "hover:bg-[#303030] dark:focus-visible:ring-offset-[#202020]"
                : "hover:bg-secondary dark:focus-visible:ring-offset-card"
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Thumbnail Section — Displays Avatar, Name, Handle · Plan (matching profile page) */}
        <div className="space-y-2">
          <div className="relative w-full rounded-[25px] sm:rounded-3xl overflow-hidden bg-background border border-border/80 dark:border-none p-8 sm:p-10 flex flex-col items-center justify-center min-h-[240px] text-center select-none">
            {/* Profile Content — z-20 to ensure all image & texts show clearly and crisply above gradient */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center">
              {/* Avatar with selected shape */}
              <div
                style={clipStyle}
                className="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden border border-border/80 dark:border-none  bg-secondary flex items-center justify-center shrink-0 select-none"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <span className="text-3xl font-bold text-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name & Handle · Plan matching profile page (Image 4) */}
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground select-none">
                {displayName}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground select-none">
                @{cleanUsername} {derivedPlanLabel ? `· ${derivedPlanLabel}` : ""}
              </p>
            </div>

            {/* Bottom gradient overlay — 25% full fade across entire card width */}
            <div className="absolute bottom-0 left-0 right-0 h-[25%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent" />

            {/* CloseAI Watermark */}
            <div className="absolute right-5 sm:right-6 bottom-4 sm:bottom-5 z-20 pointer-events-none">
              <span className="text-2xl font-bold text-foreground tracking-tight select-none">
                CloseAI
              </span>
            </div>
          </div>
        </div>

        {/* Link Copy Bar — Entire bar is clickable & changes hover bg; themed for auth vs isGuest (like report-bug-modal); check icon is non-green */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-colors cursor-pointer select-none text-left outline-none focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
            isGuest
              ? "border-border/80 dark:border-white/10 dark:bg-[#202020] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#202020]"
              : "border-border/80 bg-white dark:bg-[#111111] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111111]"
          )}
          aria-label={ copied ? "Link copied" : "Copy link"}
          title={ copied ? "Link copied" : "Copy link"}
        >
          <span className="text-[13px] sm:text-sm text-foreground font-mono select-none break-all leading-normal flex-1 min-w-0">
            {displayUrl}
          </span>
          <div className="p-1.5 flex items-center justify-center shrink-0">
            {copied ? (
              <Check className="w-4 h-4 text-foreground" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </div>
        </button>

        {/* Social Share Buttons — matching copy bar background & hover styling */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleShareX}
            className={cn(
              "h-11 rounded-2xl border transition-all cursor-pointer outline-none focus:outline-none flex items-center justify-center text-foreground",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "border-border/80 dark:border-white/10 dark:bg-[#202020] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#202020]"
                : "border-border/80 bg-white dark:bg-[#111111] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111111]"
            )}
            aria-label="Share on X"
            title="Share on X"
          >
            <XLogoIcon className="w-5 h-5" />
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className={cn(
              "h-11 rounded-2xl border transition-all cursor-pointer outline-none focus:outline-none flex items-center justify-center text-foreground",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "border-border/80 dark:border-white/10 dark:bg-[#202020] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#202020]"
                : "border-border/80 bg-white dark:bg-[#111111] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111111]"
            )}
            aria-label="Share on LinkedIn"
            title="Share on LinkedIn"
          >
            <LinkedinLogoIcon className="w-5 h-5" />
          </button>

          {/* Reddit */}
          <button
            type="button"
            onClick={handleShareReddit}
            className={cn(
              "h-11 rounded-2xl border transition-all cursor-pointer outline-none focus:outline-none flex items-center justify-center text-foreground",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "border-border/80 dark:border-white/10 dark:bg-[#202020] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#202020]"
                : "border-border/80 bg-white dark:bg-[#111111] hover:bg-secondary dark:hover:bg-[#303030] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111111]"
            )}
            aria-label="Share on Reddit"
            title="Share on Reddit"
          >
            <RedditLogoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default ShareProfileModal;
