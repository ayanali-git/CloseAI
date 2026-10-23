"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, Loader } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { cn } from "@/lib/utils";

export interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  /** Force guest or authenticated styling variant. If omitted, deduced from auth state */
  isGuest?: boolean;
  /** When true, always render as centered modal (not bottom sheet on mobile) */
  forceModal?: boolean;
  /** "default" keeps the original /c pages design; "auth" matches login/signup modals for the header */
  variant?: "default" | "auth";
}

export function LogoutModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Log out",
  description = "To end with CloseAI.",
  userEmail,
  userName,
  userAvatar,
  forceModal,
  variant = "default",
  isGuest: isGuestProp,
}: LogoutModalProps) {
  const isAuthVariant = variant === "auth";
  const { user } = useAuth();
  const { isGuest, modalBgClass } = useModalTheme(isGuestProp, open);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Freeze user information while open/logging out so it does not vanish when auth state resets
  const cachedUserRef = useRef({
    userName: userName || user?.user_metadata?.full_name || user?.user_metadata?.name || undefined,
    userEmail: userEmail || user?.email || undefined,
    userAvatar: userAvatar || user?.user_metadata?.avatar_url || undefined,
    hasUser: Boolean(
      (userName && userName !== "User") ||
        (userEmail && userEmail !== "Not signed in") ||
        user
    ),
  });

  if (open) {
    if (!cachedUserRef.current.hasUser && (userName || userEmail || user)) {
      cachedUserRef.current = {
        userName: userName || user?.user_metadata?.full_name || user?.user_metadata?.name || undefined,
        userEmail: userEmail || user?.email || undefined,
        userAvatar: userAvatar || user?.user_metadata?.avatar_url || undefined,
        hasUser: true,
      };
    }
  } else {
    cachedUserRef.current = {
      userName: userName || user?.user_metadata?.full_name || user?.user_metadata?.name || undefined,
      userEmail: userEmail || user?.email || undefined,
      userAvatar: userAvatar || user?.user_metadata?.avatar_url || undefined,
      hasUser: Boolean(
        (userName && userName !== "User") ||
          (userEmail && userEmail !== "Not signed in") ||
          user
      ),
    };
  }

  const effectiveUserName = cachedUserRef.current.userName || userName;
  const effectiveUserEmail = cachedUserRef.current.userEmail || userEmail;
  const effectiveUserAvatar = cachedUserRef.current.userAvatar || userAvatar;
  const hasUser = cachedUserRef.current.hasUser;

  useEffect(() => {
    if (!open) {
      setIsLoggingOut(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error("Logout failed:", e);
      setIsLoggingOut(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      maxSnap={0.96}
      className={cn(
        "max-w-[440px]",
        modalBgClass
      )}
      forceModal={forceModal}
    >
      {isAuthVariant ? (
        /* Header / Marketing Auth Variant — Matches Login & Signup Modals */
        <div className="flex flex-col space-y-5 pt-1 pb-2 relative">
          {/* Top-Right Close Button - only on desktop/large screens */}
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => onOpenChange(false)}
            className={cn(
              "hidden min-[1280px]:flex absolute top-0 right-0 p-3 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none focus:outline-none active:outline-none focus:ring-0 active:ring-0 disabled:opacity-50 disabled:pointer-events-none",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "rounded-full hover:bg-secondary dark:hover:bg-[#383838] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                : "rounded-sm hover:bg-secondary dark:hover:bg-[#2f2f2f] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
            )}
            style={{ outline: "none" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-normal tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-base text-muted-foreground mt-1.5">
              {description}
            </p>
          </div>

          {/* User Card */}
          {hasUser && (
            <div className="flex items-center gap-3.5 p-3 rounded-full bg-background border border-border/80 dark:border-none select-none">
              <Avatar className="w-11 h-11 rounded-full border border-border/80 shrink-0">
                <AvatarImage src={effectiveUserAvatar} />
                <AvatarFallback className="text-base font-semibold bg-secondary text-foreground">
                  {effectiveUserName || effectiveUserEmail?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                {effectiveUserName && (
                  <p className="text-base font-semibold text-foreground truncate leading-snug">
                    {effectiveUserName}
                  </p>
                )}
                {effectiveUserEmail && (
                  <p className="text-sm text-muted-foreground truncate leading-tight mt-0.5">
                    {effectiveUserEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning / Info Box */}
          <div className="w-full flex items-start gap-2.5 p-3 rounded-full bg-secondary/50 text-left text-xs text-muted-foreground">
            <AlertTriangle className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
            <span className="leading-relaxed">
              This will log you out across all CloseAI platforms.
            </span>
          </div>

          {/* Action Button — Single Full-Width Pill matching Login/Signup */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleConfirm}
              className={cn(
                "w-full h-11 rounded-full bg-foreground text-background font-medium text-base flex items-center justify-center hover:opacity-80 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none border border-transparent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 transition-all cursor-pointer select-none gap-2",
                isGuest
                  ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                  : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
              )}
            >
              {isLoggingOut ? (
                <Loader className="w-5 h-5 animate-spin text-background" />
              ) : (
                "Log out"
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Original /c Chat Pages Variant — Untouched Design */
        <div className="flex flex-col space-y-4 pt-1 pb-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Log out?
            </h2>
          </div>

          {/* User Card */}
          {hasUser && (
            <div className="relative w-full rounded-[25px] sm:rounded-3xl overflow-hidden bg-background border border-border/80 dark:border-none">
              <div className="absolute bottom-0 left-0 right-0 h-[28%] min-h-[48px] max-h-[60px] z-10 pointer-events-none" />

              <div
                className={cn(
                  "relative z-0 max-h-[200px] min-h-[160px] flex items-center justify-center p-5 sm:p-6 overflow-hidden select-text"
                )}
              >
                <div className="flex items-center gap-3.5 select-none">
                  <Avatar className="w-20 h-20 rounded-full border border-border/80 shrink-0">
                    <AvatarImage src={effectiveUserAvatar} />
                    <AvatarFallback className="text-sm font-semibold bg-secondary text-foreground">
                      {effectiveUserName || effectiveUserEmail?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    {effectiveUserName && (
                      <p className="text-[20px] font-semibold text-foreground truncate leading-snug">
                        {effectiveUserName}
                      </p>
                    )}
                    {effectiveUserEmail && (
                      <p className="text-base text-muted-foreground truncate leading-tight mt-0.5">
                        {effectiveUserEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning / Info Box */}
          <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
            <AlertTriangle className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
            <span className="leading-normal">
              This will log you out across all CloseAI platforms.
            </span>
          </div>

          {/* Action Buttons — Stacked Full-Width Pills */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleConfirm}
              className={cn(
                "w-full h-11 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer select-none flex items-center justify-center",
                isGuest
                  ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                  : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
              )}
            >
              {isLoggingOut ? (
                <Loader className="w-5 h-5 animate-spin text-background" />
              ) : (
                "Log out"
              )}
            </button>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer select-none",
                isGuest
                  ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                  : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
