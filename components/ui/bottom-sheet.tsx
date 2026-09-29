"use client";

import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EASE_DRAWER } from "@/lib/ease";
import { PresenceGate } from "@/lib/presence-gate";
import { TOUCH_GESTURE_CONTENT_CLASS } from "@/lib/touch";
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
  dismissThreshold = 120,
  forceModal = false,
  scrollable = false,
  contentClassName,
  unpadded = false,
  maxSnap = 0.75,
}: BottomSheetProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const [mounted, setMounted] = useState(false);
  const [isMobileScreenRaw, setIsMobileScreenRaw] = useState(false);
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const heightRef = useRef(0);
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

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobileScreenRaw(window.innerWidth < 1025);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!isMobileScreen) return;
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 600 || offset > dismissThreshold) {
      const smaller = snapPoints.map((_, i) => i).filter((i) => i < snap);
      if (smaller.length && velocity < 800 && offset < dismissThreshold * 1.6) {
        setSnap(smaller[smaller.length - 1]);
      } else {
        onOpenChange(false);
      }
      return;
    }

    if (velocity < -500) {
      setSnap((current) => Math.min(snapPoints.length - 1, current + 1));
      return;
    }

    setSnap((current) => {
      if (offset > 80 && current > 0) return current - 1;
      if (offset < -80 && current < snapPoints.length - 1) return current + 1;
      return current;
    });
  };

  const snapValue = snapPoints[snap];
  const clampCap = Math.min(Math.max(maxSnap, 0.35), 0.98);
  const clampedSnap =
    typeof snapValue === "number" ? Math.min(snapValue, clampCap) : snapValue;
  const maxHeightCss = `${Math.round(clampCap * 100)}dvh`;
  const heightStyle = isMobileScreen
    ? clampedSnap === "auto"
      ? { maxHeight: maxHeightCss }
      : { height: `${clampedSnap * 100}dvh`, maxHeight: maxHeightCss }
    : {};

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setExitComplete(true)}>
      {open ? (
        <PresenceGate key="backdrop">
          {({ gate }) => (
            <motion.div
              initial={isBigScreen ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={isBigScreen ? { duration: 0 } : DRAWER}
              {...gate}
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
          )}
        </PresenceGate>
      ) : null}
      {open ? (
        <PresenceGate key="sheet">
          {({ gate }) => (
            <div
              className={cn(
                "fixed inset-0 z-[100] flex pointer-events-none cursor-default",
                isMobileScreen
                  ? "items-end justify-center"
                  : "items-center justify-center p-4"
              )}
            >
              <motion.div
                ref={sheetRef}
                drag={isMobileScreen ? "y" : false}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.02, bottom: 0.4 }}
                dragMomentum={false}
                onDragEnd={onDragEnd}
                initial={
                  isBigScreen
                    ? false
                    : reduce
                    ? { opacity: 0 }
                    : isMobileScreen
                    ? { y: "100%" }
                    : { opacity: 0, scale: 0.96, y: 8 }
                }
                animate={
                  reduce
                    ? { opacity: 1 }
                    : isMobileScreen
                    ? { y: 0 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                exit={
                  reduce
                    ? { opacity: 0 }
                    : isMobileScreen
                    ? { y: "100%" }
                    : { opacity: 0, scale: 0.96, y: 8 }
                }
                transition={
                  isBigScreen
                    ? { duration: 0 }
                    : reduce
                    ? { duration: 0.18, ease: EASE_DRAWER }
                    : DRAWER
                }
                onAnimationComplete={() => {
                  if (sheetRef.current)
                    heightRef.current = sheetRef.current.offsetHeight;
                }}
                {...gate}
                style={
                  isMobileScreen
                    ? { ...heightStyle, ...(gate.style as Record<string, any>) }
                    : { ...(gate.style as Record<string, any>) }
                }
                className={cn(
                  "pointer-events-auto flex flex-col overflow-hidden bg-card border border-border/90 dark:border-none will-change-transform",
                  isMobileScreen
                    ? "w-full max-w-2xl rounded-t-3xl"
                    : "w-full max-w-xl rounded-3xl max-h-[85vh]",
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
                  <div className="flex flex-col items-center px-6 pb-2 pt-4 shrink-0">
                    {/* Drag handle pill only on mobile */}
                    {isMobileScreen && (
                      <div
                        onPointerDown={(event) => dragControls.start(event)}
                        className={cn(
                          "flex cursor-grab touch-none items-center justify-center py-1 active:cursor-grabbing mb-1",
                          TOUCH_GESTURE_CONTENT_CLASS
                        )}
                      >
                        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
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
          )}
        </PresenceGate>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
