"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

export interface AnimatedArrowProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedArrow({
  open,
  isOpen,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 2,
  style,
  ...props
}: AnimatedArrowProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;

    const parentGroup =
      el.closest(".group") ||
      el.closest("button") ||
      el.closest("a") ||
      el.closest('[role="button"]') ||
      el;

    const onEnter = () => {
      if (!disableHover) setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
      setClicked(false);
    };
    const onClick = () => {
      setClicked((prev) => !prev);
    };

    try {
      if (
        typeof window !== "undefined" &&
        !disableHover &&
        parentGroup.matches(":hover")
      ) {
        setHovered(true);
      }
    } catch (e) {}

    parentGroup.addEventListener("mouseenter", onEnter);
    parentGroup.addEventListener("mouseleave", onLeave);
    parentGroup.addEventListener("click", onClick);
    if (parentGroup !== el) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("click", onClick);
    }

    return () => {
      parentGroup.removeEventListener("mouseenter", onEnter);
      parentGroup.removeEventListener("mouseleave", onLeave);
      parentGroup.removeEventListener("click", onClick);
      if (parentGroup !== el) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("click", onClick);
      }
    };
  }, [disableHover, isControlled]);

  const isActive = isControlled
    ? Boolean(open ?? isOpen)
    : (disableHover ? clicked : Boolean(clicked || hovered));

  const motionVal = useMotionValue(+!!isActive);
  const spring = useSpring(motionVal, { stiffness: 500, damping: 30 });

  useEffect(() => {
    motionVal.set(+!!isActive);
  }, [isActive, motionVal]);

  // Stem line (y=12): emerges from x=15 backward to x=5, while right end follows vertex from 15 to 19
  const p = useTransform(spring, [0, 1], [15, 5]);
  const h = useTransform(spring, [0, 1], [15, 19]);
  const m = useTransform(spring, [0, 0.08, 1], [0, 0.8, 1]);

  // Top arm of chevron: goes from (9, 6) to (15, 12) at rest -> (13, 6) to (19, 12) on hover
  const f = useTransform(spring, [0, 1], [9, 13]);
  const y = useTransform(spring, [0, 1], [15, 19]);

  // Bottom arm of chevron: goes from (9, 18) to (15, 12) at rest -> (13, 18) to (19, 12) on hover
  const v = useTransform(spring, [0, 1], [9, 13]);
  const g = useTransform(spring, [0, 1], [15, 19]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center shrink-0 ml-1.5 select-none pointer-events-none align-middle translate-y-[-0.5px]",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        <motion.line x1={p} y1={12} x2={h} y2={12} style={{ opacity: m }} />
        <motion.line x1={f} y1={6} x2={y} y2={12} />
        <motion.line x1={v} y1={18} x2={g} y2={12} />
      </svg>
    </span>
  );
}
export interface AnimatedArrowUpRightProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}
 
/** Arrow-up-right glyph, drawn once and reused by both copies */
const ArrowGlyph = () => (
  <>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7,7 17,7 17,17" />
  </>
);
 
/** Diagonal travel distance — far enough that a copy fully leaves the 24x24 box */
const D = 20;
 
export function AnimatedArrowUpRight({
  open,
  isOpen,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedArrowUpRightProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
 
  const isControlled = open !== undefined || isOpen !== undefined;
 
  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
 
    const parentGroup =
      el.closest(".group") ||
      el.closest("button") ||
      el.closest("a") ||
      el.closest('[role="button"]') ||
      el;
 
    const onEnter = () => {
      if (!disableHover) setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
      setClicked(false);
    };
    const onClick = () => {
      setClicked((prev) => !prev);
    };
 
    try {
      if (
        typeof window !== "undefined" &&
        !disableHover &&
        parentGroup.matches(":hover")
      ) {
        setHovered(true);
      }
    } catch (e) {}
 
    parentGroup.addEventListener("mouseenter", onEnter);
    parentGroup.addEventListener("mouseleave", onLeave);
    parentGroup.addEventListener("click", onClick);
    if (parentGroup !== el) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("click", onClick);
    }
 
    return () => {
      parentGroup.removeEventListener("mouseenter", onEnter);
      parentGroup.removeEventListener("mouseleave", onLeave);
      parentGroup.removeEventListener("click", onClick);
      if (parentGroup !== el) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("click", onClick);
      }
    };
  }, [disableHover, isControlled]);
 
  const isActive = isControlled
    ? Boolean(open ?? isOpen)
    : disableHover
      ? clicked
      : Boolean(clicked || hovered);
 
  const motionVal = useMotionValue(+!!isActive);
  const spring = useSpring(motionVal, {
    stiffness: 420,
    damping: 32,
    mass: 0.7,
  });
 
  useEffect(() => {
    motionVal.set(+!!isActive);
  }, [isActive, motionVal]);
 
  // Outgoing copy: rests dead centre, then flies out through the top-right corner
  const outX = useTransform(spring, [0, 1], [0, D]);
  const outY = useTransform(spring, [0, 1], [0, -D]);
  const outOpacity = useTransform(spring, [0, 0.85, 1], [1, 1, 0]);
 
  // Incoming copy: waits off-screen bottom-left, lands exactly where the first one was
  const inX = useTransform(spring, [0, 1], [-D, 0]);
  const inY = useTransform(spring, [0, 1], [D, 0]);
  const inOpacity = useTransform(spring, [0, 0.15, 1], [0, 1, 1]);
 
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center shrink-0 select-none pointer-events-none align-middle overflow-hidden",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <motion.g style={{ x: outX, y: outY, opacity: outOpacity }}>
          <ArrowGlyph />
        </motion.g>
        <motion.g style={{ x: inX, y: inY, opacity: inOpacity }}>
          <ArrowGlyph />
        </motion.g>
      </svg>
    </span>
  );
}
 
export { AnimatedArrowUpRight as AnimatedExternalLink };

export interface AnimatedChevronProps
  extends React.SVGAttributes<SVGSVGElement> {
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  orientation?: "up-down" | "right-down";
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedChevron({
  open,
  isOpen,
  disableHover = false,
  orientation = "up-down",
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedChevronProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
    const parentGroup =
      el.closest(".group") || el.closest("button") || el.closest("a") || el;
    const onEnter = () => {
      if (!disableHover) setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
      setClicked(false);
    };
    const onClick = () => {
      setClicked((prev) => !prev);
    };

    parentGroup.addEventListener("mouseenter", onEnter);
    parentGroup.addEventListener("mouseleave", onLeave);
    parentGroup.addEventListener("click", onClick);
    return () => {
      parentGroup.removeEventListener("mouseenter", onEnter);
      parentGroup.removeEventListener("mouseleave", onLeave);
      parentGroup.removeEventListener("click", onClick);
    };
  }, [disableHover, isControlled]);

  const isActive = isControlled
    ? Boolean(open ?? isOpen)
    : (disableHover ? clicked : Boolean(clicked || hovered));

  const motionVal = useMotionValue(+!!isActive);
  const spring = useSpring(motionVal, { stiffness: 400, damping: 30 });

  useEffect(() => {
    motionVal.set(+!!isActive);
  }, [isActive, motionVal]);

  const upDownVertexY = useTransform(spring, [0, 1], [10, 6]);
  const upDownArmsY = useTransform(spring, [0, 1], [6, 10]);

  const rdStartX = useTransform(spring, [0, 1], [6, 4]);
  const rdStartY = useTransform(spring, [0, 1], [4, 6]);
  const rdVertexX = useTransform(spring, [0, 1], [10, 8]);
  const rdVertexY = useTransform(spring, [0, 1], [8, 10]);
  const rdEndX = useTransform(spring, [0, 1], [6, 12]);
  const rdEndY = useTransform(spring, [0, 1], [12, 6]);

  const pointsUpDown = useTransform(
    [upDownArmsY, upDownVertexY],
    ([arms, vertex]) => `4,${arms} 8,${vertex} 12,${arms}`
  );

  const pointsRightDown = useTransform(
    [rdStartX, rdStartY, rdVertexX, rdVertexY, rdEndX, rdEndY],
    ([sx, sy, vx, vy, ex, ey]) => `${sx},${sy} ${vx},${vy} ${ex},${ey}`
  );

  const points = orientation === "right-down" ? pointsRightDown : pointsUpDown;

  return (
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "inline-block shrink-0 overflow-visible select-none pointer-events-none transition-colors",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <motion.polyline points={points} />
    </svg>
  );
}

export { AnimatedChevron as AnimatedChevronDown };

export interface AnimatedPlusMinusProps
  extends React.SVGAttributes<SVGSVGElement> {
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedPlusMinus({
  open,
  isOpen,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedPlusMinusProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
    const parentGroup =
      el.closest(".group") || el.closest("button") || el.closest("a") || el;
    const onEnter = () => {
      if (!disableHover) setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
      setClicked(false);
    };
    const onClick = () => {
      setClicked((prev) => !prev);
    };

    parentGroup.addEventListener("mouseenter", onEnter);
    parentGroup.addEventListener("mouseleave", onLeave);
    parentGroup.addEventListener("click", onClick);
    return () => {
      parentGroup.removeEventListener("mouseenter", onEnter);
      parentGroup.removeEventListener("mouseleave", onLeave);
      parentGroup.removeEventListener("click", onClick);
    };
  }, [disableHover, isControlled]);

  const active = isControlled
    ? Boolean(open ?? isOpen)
    : (disableHover ? clicked : Boolean(clicked || hovered));

  const motionVal = useMotionValue(+active);
  const spring = useSpring(motionVal, {
    stiffness: 480,
    damping: 34,
    mass: 0.7,
  });

  useEffect(() => {
    motionVal.set(+active);
  }, [active, motionVal]);

  // Vertical bar collapses straight to center — no rotation, just y1/y2 spring to 8
  const vertY1 = useTransform(spring, [0, 1], [3.5, 8]);
  const vertY2 = useTransform(spring, [0, 1], [12.5, 8]);
  const vertOpacity = useTransform(spring, [0, 0.6, 1], [1, 0.4, 0]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "inline-block shrink-0 overflow-visible select-none pointer-events-none transition-colors",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <line x1="3.5" y1="8" x2="12.5" y2="8" />
      <motion.line
        x1="8"
        y1={vertY1}
        x2="8"
        y2={vertY2}
        style={{ opacity: vertOpacity }}
      />
    </svg>
  );
}

export {
  AnimatedPlusMinus as AnimatedPlus,
  AnimatedPlusMinus as AnimatedMinus,
};

export interface AnimatedPlusCheckProps
  extends React.SVGAttributes<SVGSVGElement> {
  open?: boolean;
  isOpen?: boolean;
  checked?: boolean;
  isChecked?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedPlusCheck({
  open,
  isOpen,
  checked,
  isChecked,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedPlusCheckProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const isControlled =
    open !== undefined ||
    isOpen !== undefined ||
    checked !== undefined ||
    isChecked !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
    const parentGroup =
      el.closest(".group") || el.closest("button") || el.closest("a") || el;
    const onEnter = () => {
      if (!disableHover) setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
      setClicked(false);
    };
    const onClick = () => {
      setClicked((prev) => !prev);
    };

    parentGroup.addEventListener("mouseenter", onEnter);
    parentGroup.addEventListener("mouseleave", onLeave);
    parentGroup.addEventListener("click", onClick);
    return () => {
      parentGroup.removeEventListener("mouseenter", onEnter);
      parentGroup.removeEventListener("mouseleave", onLeave);
      parentGroup.removeEventListener("click", onClick);
    };
  }, [disableHover, isControlled]);

  const active = isControlled
    ? Boolean(open ?? isOpen ?? checked ?? isChecked)
    : (disableHover ? clicked : Boolean(clicked || hovered));

  const motionVal = useMotionValue(+active);
  const spring = useSpring(motionVal, {
    stiffness: 480,
    damping: 34,
    mass: 0.7,
  });

  useEffect(() => {
    motionVal.set(+active);
  }, [active, motionVal]);

  // Vertex and endpoints for the morphing horizontal line into a checkmark
  // At spring=0 (Plus): horizontal line "3.5,8 8,8 12.5,8"
  // At spring=1 (Check): standard checkmark "3.5,8.5 6.5,11.5 12.5,4.7" (matching AnimatedCheckbox)
  const p1Y = useTransform(spring, [0, 1], [8, 8.5]);
  const p2X = useTransform(spring, [0, 1], [8, 6.5]);
  const p2Y = useTransform(spring, [0, 1], [8, 11.5]);
  const p3Y = useTransform(spring, [0, 1], [8, 4.7]);

  const points = useTransform(
    [p1Y, p2X, p2Y, p3Y],
    ([y1, x2, y2, y3]) => `3.5,${y1} ${x2},${y2} 12.5,${y3}`
  );

  // Vertical bar of the plus collapses inward to (8, 8) and fades out
  const vertY1 = useTransform(spring, [0, 1], [3.5, 8]);
  const vertY2 = useTransform(spring, [0, 1], [12.5, 8]);
  const vertOpacity = useTransform(spring, [0, 0.4, 1], [1, 0, 0]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "inline-block shrink-0 overflow-visible select-none pointer-events-none transition-colors",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <motion.polyline points={points} />
      <motion.line
        x1="8"
        y1={vertY1}
        x2="8"
        y2={vertY2}
        style={{ opacity: vertOpacity }}
      />
    </svg>
  );
}

export {
  AnimatedPlusCheck as AnimatedPlusToCheck,
  AnimatedPlusCheck as AnimatedCheckPlus,
};


export interface AnimatedSearchCloseProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedSearchClose({
  open,
  isOpen,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedSearchCloseProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clicked, setClicked] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
    const parentGroup =
      el.closest(".group") || el.closest("button") || el.closest("a") || el;
    const onClick = () => setClicked((prev) => !prev);
    parentGroup.addEventListener("click", onClick);
    return () => parentGroup.removeEventListener("click", onClick);
  }, [isControlled]);

  const active = isControlled ? Boolean(open ?? isOpen) : clicked;
  const motionVal = useMotionValue(+active);
  const spring = useSpring(motionVal, {
    stiffness: 520,
    damping: 38,
    mass: 0.7,
  });

  useEffect(() => {
    motionVal.set(+active);
  }, [active, motionVal]);

  const lensRadius = useTransform(
    spring,
    [0, 0.45, 0.8, 1],
    [4.15, 4.15, 0.5, 0]
  );
  const lensOpacity = useTransform(spring, [0, 0.52, 0.8], [1, 1, 0]);

  const mainX1 = useTransform(spring, [0, 1], [10.1, 4.75]);
  const mainY1 = useTransform(spring, [0, 1], [10.1, 4.75]);
  const mainX2 = useTransform(spring, [0, 1], [13.1, 11.25]);
  const mainY2 = useTransform(spring, [0, 1], [13.1, 11.25]);

  const crossX1 = useTransform(spring, [0, 0.42, 1], [8, 8, 11.25]);
  const crossY1 = useTransform(spring, [0, 0.42, 1], [8, 8, 4.75]);
  const crossX2 = useTransform(spring, [0, 0.42, 1], [8, 8, 4.75]);
  const crossY2 = useTransform(spring, [0, 0.42, 1], [8, 8, 11.25]);
  const crossOpacity = useTransform(spring, [0, 0.35, 0.62], [0, 0, 1]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none pointer-events-none overflow-hidden",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <motion.svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 w-full h-full"
      >
        <motion.circle
          cx="6.95"
          cy="6.95"
          r={lensRadius}
          style={{ opacity: lensOpacity }}
        />
        <motion.line x1={mainX1} y1={mainY1} x2={mainX2} y2={mainY2} />
        <motion.line
          x1={crossX1}
          y1={crossY1}
          x2={crossX2}
          y2={crossY2}
          style={{ opacity: crossOpacity }}
        />
      </motion.svg>
    </span>
  );
}

export { AnimatedSearchClose as AnimatedSearchIcon };

export interface AnimatedPanelToggleProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** true = "panel open" state (rail/filled column on the right), false = "panel closed" state (rail/filled column on the left) */
  open?: boolean;
  isOpen?: boolean;
  disableHover?: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedPanelToggle({
  open,
  isOpen,
  disableHover = false,
  className,
  size = 18,
  strokeWidth = 1.25,
  style,
  ...props
}: AnimatedPanelToggleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clicked, setClicked] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const el = ref.current;
    if (!el) return;
    const parentGroup =
      el.closest(".group") || el.closest("button") || el.closest("a") || el;
    const onClick = () => setClicked((prev) => !prev);
    parentGroup.addEventListener("click", onClick);
    return () => parentGroup.removeEventListener("click", onClick);
  }, [isControlled]);

  const active = isControlled ? Boolean(open ?? isOpen) : clicked;
  const motionVal = useMotionValue(+active);
  const spring = useSpring(motionVal, {
    stiffness: 480,
    damping: 34,
    mass: 0.7,
  });

  useEffect(() => {
    motionVal.set(+active);
  }, [active, motionVal]);

  // Divider line slides from x=9 (closed / panel-left) to x=15 (open / panel-right) —
  // same simple two-column glyph as lucide's PanelLeft / PanelRight, just animated.
  const railX = useTransform(spring, [0, 1], [9, 15]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none pointer-events-none",
        className
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth * 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Outer frame, fixed */}
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        {/* Divider line that slides between the left-third and right-third position */}
        <motion.line x1={railX} y1="4" x2={railX} y2="20" />
      </motion.svg>
    </span>
  );
}

export interface AnimatedComingSoonTextProps {
  label: string;
  comingSoonText?: string;
  align?: "start" | "center";
  className?: string;
  isHovered?: boolean;
}

export function AnimatedComingSoonText({
  label = "API Platform",
  comingSoonText = "Coming soon",
  align = "start",
  className,
  isHovered,
}: AnimatedComingSoonTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent =
      el.closest("button") ||
      el.closest('[role="button"]') ||
      el.closest("a") ||
      el.parentElement ||
      el;

    const onEnter = () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(hover: hover)").matches
      ) {
        setHovered(true);
      }
    };
    const onLeave = () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(hover: hover)").matches
      ) {
        setHovered(false);
        setClicked(false);
      }
    };

    const onClick = () => {
      setClicked(true);
    };

    // Check if parent or element is already hovered upon mount
    const checkHover = () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(hover: hover)").matches &&
          (parent.matches(":hover") || el.matches(":hover"))
        ) {
          setHovered(true);
        }
      } catch (e) {}
    };

    checkHover();
    const rafId = requestAnimationFrame(checkHover);
    const timerId = setTimeout(checkHover, 40);

    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);
    parent.addEventListener("mousemove", onEnter);
    parent.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
      parent.removeEventListener("mousemove", onEnter);
      parent.removeEventListener("click", onClick);
    };
  }, []);

  // Listen for clicks on any other side (outside parent) to revert state
  useEffect(() => {
    if (!clicked) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (!target) return;

      const parent =
        el.closest("button") ||
        el.closest('[role="button"]') ||
        el.closest("a") ||
        el.parentElement ||
        el;

      if (!parent.contains(target)) {
        setClicked(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick, true);
      document.addEventListener("touchstart", handleOutsideClick, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick, true);
      document.removeEventListener("touchstart", handleOutsideClick, true);
    };
  }, [clicked]);

  const isActive = isHovered !== undefined ? isHovered : (hovered || clicked);
  const motionVal = useMotionValue(+!!isActive);
  const spring = useSpring(motionVal, { stiffness: 450, damping: 28 });

  useEffect(() => {
    motionVal.set(+!!isActive);
  }, [isActive, motionVal]);

  const labelY = useTransform(spring, [0, 1], ["0%", "-120%"]);
  const labelOpacity = useTransform(spring, [0, 0.6, 1], [1, 0.2, 0]);

  const comingY = useTransform(spring, [0, 1], ["120%", "0%"]);
  const comingOpacity = useTransform(spring, [0, 0.4, 1], [0, 0.8, 1]);

  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-grid grid-cols-1 grid-rows-1 overflow-hidden select-none align-middle py-0.5",
        align === "center" ? "px-1" : "pl-0 pr-1",
        className
      )}
    >
      {/* Invisible sizers: guarantees container is wide & tall enough for whichever text is larger */}
      <span
        className="col-start-1 row-start-1 invisible pointer-events-none select-none whitespace-nowrap"
        aria-hidden="true"
      >
        {label}
      </span>
      <span
        className="col-start-1 row-start-1 invisible pointer-events-none select-none whitespace-nowrap"
        aria-hidden="true"
      >
        {comingSoonText}
      </span>

      {/* Label layer */}
      <motion.span
        style={{ y: labelY, opacity: labelOpacity }}
        className={cn(
          "col-start-1 row-start-1 flex items-center whitespace-nowrap",
          align === "center" ? "justify-center" : "justify-start"
        )}
      >
        {label}
      </motion.span>

      {/* Coming soon layer */}
      <motion.span
        style={{ y: comingY, opacity: comingOpacity }}
        className={cn(
          "col-start-1 row-start-1 flex items-center whitespace-nowrap text-muted-foreground/90",
          align === "center" ? "justify-center" : "justify-start"
        )}
      >
        {comingSoonText}
      </motion.span>
    </span>
  );
}

export interface AnimatedCheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: number;
  strokeWidth?: number;
}

export const AnimatedCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  AnimatedCheckboxProps
>(({ className, size = 18, strokeWidth = 2, checked, ...props }, ref) => {
  const active = Boolean(checked);
  const motionVal = useMotionValue(+active);
  const spring = useSpring(motionVal, {
    stiffness: 500,
    damping: 32,
    mass: 0.6,
  });

  useEffect(() => {
    motionVal.set(+active);
  }, [active, motionVal]);

  // Box scale: slight overshoot settle, matching the snappy spring feel of the other icons
  const boxScale = useTransform(spring, [0, 0.6, 1], [0.85, 1.04, 1]);
  const shortLen = 6;
  const longLen = 11.3;
  const shortOffset = useTransform(
    spring,
    [0, 0.5, 1],
    [shortLen, shortLen, 0]
  );
  const longOffset = useTransform(spring, [0, 0.5, 1], [longLen, longLen, 0]);
  const checkOpacity = useTransform(spring, [0, 0.15, 1], [0, 1, 1]);

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer shrink-0 rounded-[5px] border border-border bg-secondary ring-offset-background focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:border-foreground transition-colors cursor-pointer overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        forceMount
        className="flex items-center justify-center text-current w-full h-full"
      >
        <motion.svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ scale: boxScale }}
          className="w-3.5 h-3.5 overflow-visible"
        >
          <motion.polyline
            points="3.5,8.5 6.5,11.5"
            style={{
              opacity: checkOpacity,
              strokeDasharray: shortLen,
              strokeDashoffset: shortOffset,
            }}
          />
          <motion.polyline
            points="6.5,11.5 12.5,4.7"
            style={{
              opacity: checkOpacity,
              strokeDasharray: longLen,
              strokeDashoffset: longOffset,
            }}
          />
        </motion.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
AnimatedCheckbox.displayName = "AnimatedCheckbox";

export default AnimatedArrow;
