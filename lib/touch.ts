"use client";

import { animate, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { EASE_DRAWER } from "@/lib/ease";

export const SWIPE_SETTLE = { duration: 0.16, ease: EASE_DRAWER };

export const TOUCH_GESTURE_CONTENT_CLASS = "touch-none";

const mobilePanelQuery = "(max-width: 1279px)";

function subscribeToPanelLayout(update: () => void) {
  const media = window.matchMedia(mobilePanelQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export function useMobilePanelLayout() {
  return useSyncExternalStore(
    subscribeToPanelLayout,
    () => window.matchMedia(mobilePanelQuery).matches,
    () => false
  );
}

interface SwipeOptions {
  direction: "up" | "down" | "left" | "right";
  enabled: boolean;
  panelRef: RefObject<HTMLElement>;
  dismissThreshold?: number;
  onRelease: (swipe: { distance: number; velocity: number; shouldDismiss: boolean }) => void;
}

interface Point {
  position: number;
  time: number;
}

interface Swipe {
  id: number;
  start: number;
  crossStart: number;
  size: number;
  from: number;
  dragging: boolean;
  samples: Point[];
}

const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useSwipeDismiss({
  direction,
  enabled,
  panelRef,
  dismissThreshold,
  onRelease,
}: SwipeOptions) {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  const offset = useMotionValue("0%");
  const backdropOpacity = useTransform(offset, (value) =>
    Math.max(0, 1 - Math.abs(parseFloat(value)) / 100)
  );
  const reduceMotion = useReducedMotion();
  const swipe = useRef<Swipe | null>(null);
  const active = useRef(enabled);
  const suppressClick = useRef(false);
  const recoveryFrame = useRef(0);

  useClientLayoutEffect(() => {
    active.current = enabled;
    return () => {
      active.current = false;
      swipe.current = null;
      cancelAnimationFrame(recoveryFrame.current);
    };
  }, [enabled, direction]);

  function returnToOpen() {
    if (!active.current) return;
    if (reduceMotion) offset.jump("0%");
    else animate(offset, "0%", SWIPE_SETTLE);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!active.current || !event.isPrimary || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element) || !event.currentTarget.contains(target)) return;
    suppressClick.current = false;
    if (target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return;
    const panel = panelRef.current;
    if (!panel) return;
    const size = horizontal ? panel.offsetWidth : panel.offsetHeight;
    if (!size) return;

    const start = horizontal ? event.clientX : event.clientY;
    swipe.current = {
      id: event.pointerId,
      start,
      crossStart: horizontal ? event.clientY : event.clientX,
      size,
      from: 0,
      dragging: false,
      samples: [{ position: start, time: event.timeStamp }],
    };
    // Capture on the actual target so tapping a child button still activates it.
    target.setPointerCapture(event.pointerId);
  }

  function track(event: PointerEvent<HTMLElement>, current: Swipe) {
    const position = horizontal ? event.clientX : event.clientY;
    const cross = horizontal ? event.clientY : event.clientX;
    const distance = sign * (position - current.start);
    if (!current.dragging) {
      if (Math.max(Math.abs(distance), Math.abs(cross - current.crossStart)) < 4) return;
      if (Math.abs(cross - current.crossStart) > Math.abs(distance)) {
        swipe.current = null;
        return;
      }
      current.dragging = true;
      cancelAnimationFrame(recoveryFrame.current);
      offset.stop();
      current.from = sign * parseFloat(offset.get());
    }

    // Work directly in the panel's transform, including when a swipe interrupts settling.
    const percent = Math.min(100, Math.max(0, current.from + (100 * distance) / current.size));
    offset.set(`${sign * percent}%`);
    const samples = current.samples;
    samples.push({ position, time: event.timeStamp });
    while (samples.length > 1 && samples[0].time < event.timeStamp - 90) samples.shift();
    return distance;
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = swipe.current;
    if (current?.id === event.pointerId) track(event, current);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const current = swipe.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = track(event, current);
    swipe.current = null;
    if (distance === undefined) return;
    suppressClick.current = true;
    const first = current.samples[0];
    const last = current.samples[current.samples.length - 1];
    const elapsed = last.time - first.time;
    const velocity = elapsed > 0 ? sign * (last.position - first.position) * 1000 / elapsed : 0;
    const threshold = dismissThreshold ?? Math.min(72, current.size * 0.25);
    const shouldDismiss = (distance >= threshold && velocity > -450) || (distance >= 12 && velocity >= 450);
    onRelease({ distance, velocity, shouldDismiss });
    // Give a controlled panel's close update the frame. If it stays open (e.g.
    // an upload is in progress), settle it back from the release position.
    recoveryFrame.current = requestAnimationFrame(returnToOpen);
  }

  function onPointerCancel(event: PointerEvent<HTMLElement>) {
    const current = swipe.current;
    if (!current || current.id !== event.pointerId) return;
    swipe.current = null;
    if (current.dragging) returnToOpen();
  }

  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (suppressClick.current && event.detail > 0 && event.currentTarget.contains(event.target as Node)) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
  }

  return {
    offset,
    backdropOpacity,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: onPointerCancel,
      onClickCapture,
    },
  };
}
