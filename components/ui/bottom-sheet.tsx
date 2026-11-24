"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Fragment, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SWIPE_SETTLE, useMobilePanelLayout, useSwipeDismiss } from "@/lib/touch";
import { EASE_DRAWER } from "@/lib/ease";
import { cn } from "@/lib/utils";

const DRAWER = { duration: 0.35, ease: EASE_DRAWER } as const;

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heights (0-1 = fraction of viewport, or "auto"). First entry is default. */
  snapPoints?: (number | "auto")[];
  defaultSnap?: number;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Min drag distance (px) past current snap to dismiss. */
  dismissThreshold?: number;
  /** When true, always render as a centered modal (never bottom sheet), even on mobile. */
  forceModal?: boolean;
  /** Whether the modal body should be scrollable internally. Defaults to false so content cannot scroll off-screen. */
  scrollable?: boolean;
  /** Extra classes for the inner content wrapper. */
  contentClassName?: string;
  /** Remove default content padding so children can control layout (e.g. split-pane modals). */
  unpadded?: boolean;
  /** Max fraction of viewport height for numeric snap points on mobile. Defaults to 0.75. */
  maxSnap?: number;
}

// Global scroll-lock reference counter to avoid race conditions when switching between modals
let scrollLockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyPaddingRight = "";

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    const sbWidth = window.innerWidth - document.documentElement.clientWidth;
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("modal-open-no-scroll");
    if (sbWidth > 0) {
      document.body.style.paddingRight = `${sbWidth}px`;
      // Expose scrollbar width for fixed-position elements (e.g. header)
      document.documentElement.style.setProperty(
        "--scrollbar-compensation",
        `${sbWidth}px`
      );
    }
  }
  scrollLockCount++;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow =
      originalBodyOverflow === "hidden" ? "" : originalBodyOverflow;
    document.documentElement.style.overflow =
      originalHtmlOverflow === "hidden" ? "" : originalHtmlOverflow;
    document.body.classList.remove("modal-open-no-scroll");
    document.body.style.paddingRight = originalBodyPaddingRight;
    document.documentElement.style.removeProperty("--scrollbar-compensation");
  }
}

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  title,
  description,
  children,
  className,
  dismissThreshold,
  forceModal = false,
  scrollable = false,
  contentClassName,
  unpadded = false,
  maxSnap = 0.75,
}: BottomSheetProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const [mounted, setMounted] = useState(false);
  const isMobileScreenRaw = useMobilePanelLayout();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const uid = useId();
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;
  /** Stays false while the exit animation is playing so scroll stays locked. */
  const [exitComplete, setExitComplete] = useState(true);

  // When forceModal is true, always use centered modal layout (never bottom sheet)
  const isMobileScreen = forceModal ? false : isMobileScreenRaw;
  const showTopBar =
    (isMobileScreen && !forceModal) || Boolean(title || description);
  const isBigScreen = !isMobileScreenRaw;
  const { offset, backdropOpacity, bind } = useSwipeDismiss({
    direction: "down",
    enabled: open && isMobileScreen,
    panelRef: sheetRef,
    dismissThreshold,
    onRelease: ({ distance, velocity, shouldDismiss }) => {
      if (shouldDismiss) {
        if (snap > 0 && velocity < 800 && distance < 130) {
          setSnap(snap - 1);
        } else {
          onOpenChange(false);
        }
      } else if (distance < -80 || velocity < -500) {
        setSnap((current) => Math.min(snapPoints.length - 1, current + 1));
      }
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [open, defaultSnap]);

  // Mark exit animation as pending when open goes from true → false
  useEffect(() => {
    if (open) setExitComplete(false);
  }, [open]);

  // Keep scroll locked for the full visual lifetime (including exit animation).
  // Also compensate for scrollbar width so the background content doesn't shift.
  const shouldLockScroll = open || !exitComplete;

  useEffect(() => {
    if (!shouldLockScroll) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [shouldLockScroll]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const sheets = document.querySelectorAll("[data-bottom-sheet='true']");
      const top = sheets[sheets.length - 1];
      if (sheetRef.current !== top) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  const snapValue = snapPoints[snap];
  const clampCap = Math.min(Math.max(maxSnap, 0.35), 0.98);
  const clampedSnap =
    typeof snapValue === "number" ? Math.min(snapValue, clampCap) : snapValue;
  const maxHeightCss =
    clampedSnap === "auto"
      ? `${Math.round(Math.max(clampCap, 0.95) * 100)}dvh`
      : `${Math.round(clampCap * 100)}dvh`;
  const heightStyle = isMobileScreen
    ? clampedSnap === "auto"
      ? { maxHeight: maxHeightCss }
      : { height: `${clampedSnap * 100}dvh`, maxHeight: maxHeightCss }
    : {};
  const trackBackdrop = isMobileScreen && !reduce;
  const transition = isBigScreen
    ? { duration: 0 }
    : reduce
    ? { duration: 0.12 }
    : isMobileScreen
    ? SWIPE_SETTLE
    : DRAWER;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setExitComplete(true)}>
      {open ? (
        <Fragment key="sheet">
          <motion.div
            style={trackBackdrop ? { opacity: backdropOpacity } : undefined}
            initial={trackBackdrop || isBigScreen ? false : { opacity: 0 }}
            animate={trackBackdrop ? undefined : { opacity: 1 }}
            exit={trackBackdrop ? undefined : { opacity: 0 }}
            transition={transition}
            data-bottom-sheet-backdrop="true"
            className="pointer-events-auto fixed inset-0 z-[100] bg-background/80 cursor-default"
            onClick={() => {
              const sheets = document.querySelectorAll(
                "[data-bottom-sheet='true']"
              );
              const top = sheets[sheets.length - 1];
              if (sheetRef.current !== top) return;
              onOpenChange(false);
            }}
          />
          <div
            className={cn(
              "fixed inset-0 z-[100] flex pointer-events-none cursor-default pb-1",
              isMobileScreen
                ? "items-end justify-center"
                : "items-center justify-center p-4"
            )}
          >
            <motion.div
              ref={sheetRef}
              initial={
                isBigScreen
                  ? false
                  : reduce
                  ? { opacity: 0, y: "0%" }
                  : isMobileScreen
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.96, y: 8 }
              }
              animate={
                reduce
                  ? { opacity: 1, y: "0%" }
                  : isMobileScreen
                  ? { y: "0%" }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                reduce
                  ? { opacity: 0 }
                  : isMobileScreen
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.96, y: 8 }
              }
              transition={transition}
              style={isMobileScreen ? { ...heightStyle, y: offset } : undefined}
              className={cn(
                "pointer-events-auto flex flex-col overflow-hidden bg-card border border-border/80 dark:border-none will-change-transform",
                isMobileScreen
                  ? "w-full max-w-2xl rounded-t-[75px] rounded-b-[25px]"
                  : "w-full max-w-2xl rounded-3xl max-h-[85vh]",
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              aria-label={title ? undefined : "Modal dialog"}
              data-bottom-sheet="true"
            >
              {showTopBar && (
                <div
                  {...(isMobileScreen ? bind : {})}
                  className={cn(
                    "flex flex-col items-center px-6 pb-2 pt-4 shrink-0",
                    isMobileScreen && "cursor-grab active:cursor-grabbing touch-none select-none"
                  )}
                >
                  {/* Drag handle pill only on mobile */}
                  {isMobileScreen && (
                    <div className="flex items-center justify-center py-1 mb-1 pointer-events-none">
                      <div className="h-1 w-10 rounded-full bg-muted-foreground" />
                    </div>
                  )}
                  {title || description ? (
                    <div className="mt-1 w-full text-left">
                      {title ? (
                        <h2
                          id={titleId}
                          className="text-lg font-semibold text-foreground tracking-tight"
                        >
                          {title}
                        </h2>
                      ) : null}
                      {description ? (
                        <p
                          id={descriptionId}
                          className="mt-1 text-sm text-muted-foreground leading-relaxed"
                        >
                          {description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
              <div
                className={cn(
                  "flex-1 min-h-0 bottom-sheet-content",
                  !unpadded && "px-6",
                  !unpadded && !showTopBar && "pt-6",
                  scrollable
                    ? "overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    : unpadded
                    ? "overflow-hidden"
                    : "overflow-visible",
                  contentClassName
                )}
                style={{
                  paddingBottom: unpadded
                    ? 0
                    : isMobileScreen
                    ? "max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))"
                    : "1.5rem",
                }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </Fragment>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
