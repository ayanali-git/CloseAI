"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { AnimatedChevron } from "@/components/ui/animated";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  indicatorColor?: string;
}

export interface NativeDropdownMenuProps<T extends string = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange?: (value: T) => void;
  onValueChange?: (value: T) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  disabled?: boolean;
  alignItemWithTrigger?: boolean;
  /**
   * guest = solid bg (same surface as the guest settings modal / chat input),
   * logged-in = frosted glass.
   * When omitted, it is decided from the current auth state, so every
   * dropdown follows the same rule without each caller passing it.
   */
  isGuest?: boolean;
}

/** Small screens / touch devices: Base UI disables alignItemWithTrigger there. */
function useIsSmallOrTouch() {
  const [isSmall, setIsSmall] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isSmall;
}

const VIEWPORT_PAD = 8; // minimum gap between the popup and the screen edges
const POPUP_CHROME_GUESS = 14; // popup padding + border, only used for the first hidden frame
const MAX_FRAMES = 60; // safety limit before the popup is shown anyway (~1s)
const STABLE_FRAMES = 3; // frames the row must stay on the label before we reveal the popup
const WATCH_FRAMES = 60; // keep re-aligning for ~1s after reveal (late layout shifts)
const COOLDOWN_FRAMES = 3; // frames to wait after moving the popup, so Base UI can apply it
const LAYOUT_EPSILON = 1; // px tolerance when comparing two layouts
const RESIDUAL_EPSILON = 0.75; // px tolerance for "row is on the label"
const MAX_CORRECTIONS = 8; // feedback nudges per open

/** Flip to true to log the alignment loop in the console while debugging. */
const DEBUG_ALIGN = false;

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), Math.max(min, max));

/**
 * Height of the area `position: fixed` elements are laid out against.
 * `innerHeight` alone can under-report on some mobile browsers, which used to
 * squash the target line and push the popup above the trigger.
 */
const getViewportHeight = () =>
  Math.max(window.innerHeight, document.documentElement.clientHeight);

/**
 * Small/touch: Base UI must NOT flip or shift the popup vertically, otherwise it
 * fights our manual "selected row on the label" position. We only let it shift
 * horizontally so the popup can never overflow the left/right screen edges.
 */
const SMALL_SCREEN_COLLISION: React.ComponentProps<
  typeof SelectPrimitive.Positioner
>["collisionAvoidance"] = {
  side: "none",
  align: "shift",
  fallbackAxisSide: "none",
};

type Layout = {
  /** sideOffset for the Positioner (popup top = trigger bottom + offset) */
  offset: number;
  /** height of the scrollable list */
  maxHeight: number;
  /** scroll position that puts the selected row on the target line */
  scrollTop: number;
  /** viewport Y where the selected row's center must end up */
  target: number;
  /** horizontal alignment relative to the trigger */
  align: "start" | "end";
};

const layoutsDiffer = (a: Layout, b: Layout) =>
  a.align !== b.align ||
  Math.abs(a.offset - b.offset) > LAYOUT_EPSILON ||
  Math.abs(a.maxHeight - b.maxHeight) >= LAYOUT_EPSILON ||
  Math.abs(a.scrollTop - b.scrollTop) >= LAYOUT_EPSILON;

/**
 * Pure function of the LIVE geometry (trigger, popup chrome, list content).
 * It does not depend on where the popup currently is, so it can be re-run at
 * any time and always returns the same answer unless something really moved.
 */
function computeLayout(
  trigger: HTMLElement,
  popup: HTMLElement,
  list: HTMLElement,
  item: HTMLElement
): Layout {
  const vh = getViewportHeight();
  const t = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  // Popup padding + border around the list
  const chromeTop = listRect.top - popupRect.top;
  const chromeBottom = popupRect.bottom - listRect.bottom;

  const half = itemRect.height / 2;
  const contentHeight = list.scrollHeight;
  // Center of the selected row measured from the top of the FULL list content
  const itemCenter = itemRect.top - listRect.top + list.scrollTop + half;

  // Line the selected row should sit on. Normally the trigger label; only
  // clamped when the trigger is so close to a screen edge that the row
  // physically can't be centered there without going off-screen.
  const triggerCenter = t.top + t.height / 2;
  const target = clamp(
    triggerCenter,
    VIEWPORT_PAD + chromeTop + half,
    vh - VIEWPORT_PAD - chromeBottom - half
  );

  // Room the list can use above / below that line
  const roomAbove = target - VIEWPORT_PAD - chromeTop;
  const roomBelow = vh - VIEWPORT_PAD - chromeBottom - target;

  // Visible px above / below the selected row's center.
  // If the whole list fits these equal the full content, so nothing scrolls.
  const above = Math.min(itemCenter, roomAbove);
  const below = Math.min(contentHeight - itemCenter, roomBelow);

  return {
    offset: target - above - chromeTop - t.bottom,
    maxHeight: Math.ceil(above + below),
    scrollTop: itemCenter - above,
    target,
    align: t.left + t.width / 2 > window.innerWidth / 2 ? "end" : "start",
  };
}

export function NativeDropdownMenu<T extends string = string>({
  value,
  options,
  onChange,
  onValueChange,
  ariaLabel,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  itemClassName,
  disabled = false,
  alignItemWithTrigger = true,
  isGuest: isGuestProp,
}: NativeDropdownMenuProps<T>) {
  const [open, setOpen] = React.useState(false);
  const isSmallOrTouch = useIsSmallOrTouch();

  // Guest = solid surface (no backdrop blur). An explicit prop wins; otherwise
  // follow the auth state, same rule the settings modal uses for its surface.
  const { user, loading } = useAuth();
  const isGuest = isGuestProp ?? (!loading && !user);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Manual "selected row on the label" layout for small / touch screens
  const [layout, setLayout] = React.useState<Layout | null>(null);
  const layoutRef = React.useRef<Layout | null>(null);
  const [ready, setReady] = React.useState(false);

  /**
   * Whether the list content is taller than the list box.
   * - true  -> list scrolls normally (overflow-y-auto)
   * - false -> list is "fixed": no scrollbar, no touch pan, no wheel scroll,
   *            and it never drags the page behind it.
   * Starts as `true` on every open (safe fallback: everything stays reachable)
   * and flips to `false` as soon as we measure that all rows fit.
   */
  const [isScrollable, setIsScrollable] = React.useState(true);
  const isScrollableRef = React.useRef(true);

  const applyLayout = React.useCallback((next: Layout) => {
    layoutRef.current = next;
    setLayout(next);
  }, []);

  const updateScrollable = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    // 1px tolerance for sub-pixel rounding
    const next = list.scrollHeight - list.clientHeight > 1;
    isScrollableRef.current = next;
    setIsScrollable((prev) => (prev === next ? prev : next));
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  const currentLabel = selectedOption?.label ?? value ?? placeholder ?? "";
  const optionsKey = options.map((o) => o.value).join("\u0000");

  const handleValueChange = (val: string | null) => {
    if (val !== null && val !== undefined) {
      onChange?.(val as T);
      onValueChange?.(val as T);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Every open starts from the safe "scrollable" state, then we measure.
      isScrollableRef.current = true;
      setIsScrollable(true);
    }

    if (next && isSmallOrTouch) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        // First (hidden) frame: park the popup INSIDE the viewport so nothing
        // overflows off-screen while we measure it.
        applyLayout({
          offset: VIEWPORT_PAD - rect.bottom,
          maxHeight: Math.max(
            120,
            getViewportHeight() - VIEWPORT_PAD * 2 - POPUP_CHROME_GUESS
          ),
          scrollTop: 0,
          target: rect.top + rect.height / 2,
          align:
            rect.left + rect.width / 2 > window.innerWidth / 2
              ? "end"
              : "start",
        });
      }
      setReady(false);
    }
    setOpen(next);
  };

  /* ------------------------------------------------------------------ */
  /* Small / touch: manual "selected row on the label" positioning       */
  /*                                                                     */
  /* A real feedback loop, not "compute once and trust Base UI":         */
  /*  1. compute the ideal layout from the LIVE trigger/list geometry    */
  /*  2. apply it and give Base UI a few frames to move the popup        */
  /*  3. MEASURE where the selected row really is and nudge the popup by */
  /*     the error - whatever the reason for it (first-frame bias, lag,  */
  /*     clamping, late layout shifts). If a nudge does not move the row */
  /*     we undo it and stop, so we can never fight the positioner.      */
  /*  4. reveal the popup, then keep watching for ~1s.                   */
  /* The loop stops as soon as the user touches / scrolls the popup.     */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (!open || !isSmallOrTouch) return;

    let cancelled = false;
    let raf = 0;
    let frame = 0;
    let cooldown = 0;
    let stable = 0;
    let shownAt = -1;
    let correction = 0; // extra offset learned from the real placement
    let corrections = 0;
    let lastCorrection = 0;
    let lastAbsDelta = Infinity;
    let correctionsDisabled = false;
    let interacted = false;

    const getEls = () => {
      const trigger = triggerRef.current;
      const popup = popupRef.current;
      const list = listRef.current;
      const item = list?.querySelector<HTMLElement>(
        `[data-option-index="${selectedIndex}"]`
      );
      return trigger && popup && list && item
        ? { trigger, popup, list, item }
        : null;
    };

    // Decide scrollable vs fixed right before the popup becomes visible,
    // so the user never sees it change.
    const show = () => {
      if (shownAt >= 0) return;
      shownAt = frame;
      updateScrollable();
      setReady(true);
    };

    const accept = () => {
      stable += 1;
      if (stable >= STABLE_FRAMES) show();
    };

    const tick = () => {
      if (cancelled) return;
      frame += 1;

      if (cooldown > 0) {
        // Popup was just moved: let Base UI apply it before measuring again.
        cooldown -= 1;
      } else {
        const els = getEls();

        if (els && !interacted) {
          const { trigger, popup, list, item } = els;

          const desired = computeLayout(trigger, popup, list, item);
          const wanted: Layout = {
            ...desired,
            offset: desired.offset + correction,
          };
          const current = layoutRef.current;

          if (!current || layoutsDiffer(current, wanted)) {
            // Geometry changed (or first pass): push the new layout.
            applyLayout(wanted);
            cooldown = COOLDOWN_FRAMES;
            stable = 0;
          } else {
            list.scrollTop = wanted.scrollTop;

            // Where is the selected row REALLY, compared to where it must be?
            const i = item.getBoundingClientRect();
            const delta = desired.target - (i.top + i.height / 2);
            const absDelta = Math.abs(delta);

            if (DEBUG_ALIGN) {
              const p = popup.getBoundingClientRect();
              const t = trigger.getBoundingClientRect();
              // eslint-disable-next-line no-console
              console.log("[dropdown-align]", {
                frame,
                target: Math.round(desired.target),
                rowCenter: Math.round(i.top + i.height / 2),
                delta: Math.round(delta * 10) / 10,
                requestedTop: Math.round(t.bottom + wanted.offset),
                actualTop: Math.round(p.top),
                correction: Math.round(correction * 10) / 10,
                corrections,
                correctionsDisabled,
              });
            }

            if (absDelta <= RESIDUAL_EPSILON || correctionsDisabled) {
              accept();
            } else if (corrections > 0 && absDelta > lastAbsDelta * 0.7) {
              // The last nudge barely moved the row: the positioner is not
              // following our offset here. Undo it and stop fighting.
              correction -= lastCorrection;
              correctionsDisabled = true;
              applyLayout({ ...wanted, offset: wanted.offset - lastCorrection });
              cooldown = COOLDOWN_FRAMES;
            } else if (corrections < MAX_CORRECTIONS) {
              corrections += 1;
              lastAbsDelta = absDelta;
              lastCorrection = delta;
              correction += delta;
              applyLayout({ ...wanted, offset: wanted.offset + delta });
              cooldown = COOLDOWN_FRAMES;
              stable = 0;
            } else {
              accept();
            }
          }
        } else if (!els && frame >= 30) {
          show();
        }
      }

      if (frame >= MAX_FRAMES) show();

      const done =
        shownAt >= 0 && (interacted || frame - shownAt >= WATCH_FRAMES);
      if (!done) raf = requestAnimationFrame(tick);
    };

    // Once the user touches / scrolls the popup, stop moving things under them.
    const onInteract = (e: Event) => {
      const popup = popupRef.current;
      if (popup && e.target instanceof Node && popup.contains(e.target)) {
        interacted = true;
      }
    };

    document.addEventListener("pointerdown", onInteract, true);
    document.addEventListener("touchstart", onInteract, true);
    document.addEventListener("wheel", onInteract, true);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onInteract, true);
      document.removeEventListener("touchstart", onInteract, true);
      document.removeEventListener("wheel", onInteract, true);
    };
  }, [open, isSmallOrTouch, selectedIndex, applyLayout, updateScrollable]);

  /* ------------------------------------------------------------------ */
  /* Keep `isScrollable` in sync (desktop + after any size change)       */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (!open) return;

    let raf = 0;
    let tries = 0;
    let observer: ResizeObserver | null = null;

    // The list lives in a portal, so it may not exist on the first frame.
    const attach = () => {
      const list = listRef.current;
      if (!list) {
        if (tries++ < 30) raf = requestAnimationFrame(attach);
        return;
      }

      updateScrollable();

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => updateScrollable());
        observer.observe(list);
      }
    };

    raf = requestAnimationFrame(attach);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [open, optionsKey, updateScrollable]);

  /* ------------------------------------------------------------------ */
  /* Fixed ("sticky") behavior when nothing needs to scroll              */
  /* ------------------------------------------------------------------ */
  React.useEffect(() => {
    if (!open) return;

    const blockScrollIntent = (e: Event) => {
      if (!e.cancelable) return;

      const target = e.target as Node | null;
      if (!target) return;

      const list = listRef.current;
      const popup = popupRef.current;
      const insideList = !!list && list.contains(target);
      const insidePopup = !!popup && popup.contains(target);

      // Real scrolling list -> let the browser scroll it
      // (overscroll-contain keeps it from chaining to the page).
      if (insideList && isScrollableRef.current) return;

      // Non-scrollable popup (list or padding) -> nothing may scroll,
      // including the page behind it.
      if (insidePopup) {
        e.preventDefault();
        return;
      }

      // Small / touch: popup is `position: fixed`, so keep the page from
      // drifting under it while it is open.
      if (isSmallOrTouch) e.preventDefault();
    };

    const opts = { passive: false, capture: true } as const;
    document.addEventListener("wheel", blockScrollIntent, opts);
    document.addEventListener("touchmove", blockScrollIntent, opts);

    return () => {
      document.removeEventListener("wheel", blockScrollIntent, opts);
      document.removeEventListener("touchmove", blockScrollIntent, opts);
    };
  }, [open, isSmallOrTouch]);

  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      onValueChange={handleValueChange}
      open={open}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <SelectPrimitive.Trigger
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm px-3 py-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 select-none",
          // Dark mode: same lighter highlight as the dropdown rows
          // (instead of the much darker bg-secondary).
          isGuest ? "dark:hover:bg-[#383838]" : "dark:hover:bg-[#2f2f2f]",
          triggerClassName,
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {() => (
            <span className="inline-flex items-center gap-2">
              {selectedOption?.indicatorColor && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.indicatorColor }}
                />
              )}
              <span>{currentLabel}</span>
            </span>
          )}
        </SelectPrimitive.Value>
        <AnimatedChevron size={18} open={open} />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          // Desktop: Base UI native aligned mode (unchanged from your original).
          // Small/touch: we align the selected row on the label ourselves.
          alignItemWithTrigger={isSmallOrTouch ? false : alignItemWithTrigger}
          side="bottom"
          align={isSmallOrTouch ? layout?.align ?? "start" : undefined}
          sideOffset={isSmallOrTouch ? layout?.offset ?? 0 : 0}
          alignOffset={0}
          positionMethod={isSmallOrTouch ? "fixed" : undefined}
          collisionAvoidance={
            isSmallOrTouch ? SMALL_SCREEN_COLLISION : undefined
          }
          collisionPadding={VIEWPORT_PAD}
          className="z-[9999] select-none outline-none"
        >
          <SelectPrimitive.Popup
            ref={popupRef}
            className={cn(
              "min-w-[140px] overflow-hidden rounded-xl p-1.5 text-foreground outline-none",
              isSmallOrTouch && "min-w-[max(140px,var(--anchor-width))]",
              // Hidden while measuring / positioning (a few frames)
              isSmallOrTouch && !ready && "opacity-0 pointer-events-none",
              // Nothing to scroll -> the popup itself must not pan/drag either
              !isScrollable && "touch-none overscroll-none",
              isGuest
                ? // Guest: solid surface, exactly like the guest settings modal.
                  // No translucent bg and no backdrop blur.
                  "!bg-white dark:!bg-[#2f2f2f] !border !border-border/80 backdrop-blur-none"
                : // Logged-in: frosted glass
                  "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none",
              contentClassName
            )}
          >
            <SelectPrimitive.List
              ref={listRef}
              className={cn(
                "outline-none space-y-0.5",
                // Scrollable only when the rows really overflow.
                // Otherwise: no scrollbar, no touch pan, no wheel scroll.
                isScrollable
                  ? "overflow-y-auto overscroll-contain"
                  : "overflow-hidden touch-none overscroll-none",
                !isSmallOrTouch && "max-h-[300px]"
              )}
              style={
                isSmallOrTouch && layout
                  ? { maxHeight: layout.maxHeight }
                  : undefined
              }
            >
              {options.map((option, index) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  data-option-index={index}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-3 py-2 text-[15px] outline-none transition-colors",
                    "text-foreground/90 hover:bg-secondary hover:text-foreground",
                    "focus:bg-secondary focus:text-foreground",
                    "data-[highlighted]:bg-secondary data-[highlighted]:text-foreground",
                    isGuest
                      ? "dark:hover:bg-[#383838] dark:focus:bg-[#383838] dark:data-[highlighted]:bg-[#383838]"
                      : "dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] dark:data-[highlighted]:bg-[#2f2f2f]",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    itemClassName
                  )}
                >
                  <div className="inline-flex items-center gap-2 truncate">
                    {option.indicatorColor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.indicatorColor }}
                      />
                    )}
                    <SelectPrimitive.ItemText className="truncate">
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </div>
                  <SelectPrimitive.ItemIndicator className="ml-auto flex items-center justify-center">
                    <Check className="w-4 h-4 shrink-0 text-foreground" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { NativeDropdownMenu as SettingsSelect };

export default NativeDropdownMenu;