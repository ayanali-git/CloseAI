"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export interface UseModalThemeOptions {
  isGuest?: boolean;
  open?: boolean;
}

export function useModalTheme(
  isGuestPropOrOptions?: boolean | UseModalThemeOptions,
  isOpenProp?: boolean
) {
  const isGuestProp =
    typeof isGuestPropOrOptions === "object"
      ? isGuestPropOrOptions?.isGuest
      : isGuestPropOrOptions;
  const open =
    typeof isGuestPropOrOptions === "object"
      ? isGuestPropOrOptions?.open
      : isOpenProp;

  const pathname = usePathname();
  const { user } = useAuth();

  // Route-aware determination:
  const isChatRoute = Boolean(
    pathname && (pathname === "/c" || pathname.startsWith("/c/"))
  );
  const isGuestRoute = Boolean(
    pathname && (pathname === "/gc" || pathname.startsWith("/gc/"))
  );

  let liveIsGuest: boolean;
  if (isChatRoute) {
    liveIsGuest = false;
  } else if (isGuestRoute) {
    liveIsGuest = true;
  } else if (isGuestProp !== undefined) {
    liveIsGuest = isGuestProp;
  } else {
    liveIsGuest = !user;
  }

  // Freeze the resolved theme while the modal is open
  const frozenRef = useRef<boolean | null>(null);

  if (open) {
    if (frozenRef.current === null) {
      frozenRef.current = liveIsGuest;
    }
  } else {
    frozenRef.current = null;
  }

  const isGuest = frozenRef.current !== null ? frozenRef.current : liveIsGuest;

  return {
    isGuest,
    modalBgClass: isGuest
      ? "bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none"
      : "bg-card border border-border/80 dark:border-none",
    ringOffsetClass: isGuest
      ? "dark:focus-visible:ring-offset-[#1f1f1f]"
      : "dark:focus-visible:ring-offset-[#212121]",
  };
}
