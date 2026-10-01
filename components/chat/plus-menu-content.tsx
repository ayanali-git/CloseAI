"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  Package,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Image as ImageIcon,
  FilePlus,
  Sparkles,
  Files,
  Images,
} from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AnimatedComingSoonText } from "@/components/ui/animated";

export interface PlusMenuContentProps {
  onAddFiles: () => void;
  onAddPhotos?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  selectedTier?: number;
  onTierChange?: (tier: number) => void;
  isOpen?: boolean;
  disableAttach?: boolean;
  isGuest?: boolean;
  onOpenLoginModal?: () => void;
  onOpenWebSearchModal?: () => void;
  onOpenAdvancedFeaturesModal?: () => void;
}

const TIERS = [
  { key: "Light", label: "Light — fastest" },
  { key: "Medium", label: "Medium — balanced" },
  { key: "High", label: "High — smarter" },
  { key: "Extra High", label: "Extra High — much smarter" },
  { key: "Ultra", label: "Ultra — smartest, consumes usage limits faster" },
];

const SPEED_OPTIONS = [
  { key: "Low", label: "Low — Slow speed" },
  { key: "Standard", label: "Standard — normal speed" },
  { key: "Fast", label: "Fast — faster & optimized responses" },
];

const MODEL_OPTIONS = [
  { key: "gemini-3.8 flash", label: "gemini-3.8 flash" },
  { key: "GPT-5.4", label: "GPT-5.4" },
  { key: "GPT-4o", label: "GPT-4o" },
  { key: "GPT-4o mini", label: "GPT-4o mini" },
];

/**
 * Smooth auto-scrolling label on hover (matching sidebar chat list marquee)
 */
function TierMarqueeText({
  text,
  isHovered,
  className,
}: {
  text: string;
  isHovered: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  const measure = useCallback(() => {
    if (textRef.current && containerRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflowWidth(diff > 0 ? Math.ceil(diff) : 0);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text, measure]);

  useEffect(() => {
    if (isHovered) {
      measure();
    }
  }, [isHovered, measure]);

  const duration = Math.max(1.8, overflowWidth / 22);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex-1 overflow-hidden min-w-0 pr-1.5 text-left", className)}
      style={{
        maskImage:
          overflowWidth > 0 && !isHovered
            ? "linear-gradient(to right, black calc(100% - 18px), transparent 100%)"
            : "none",
        WebkitMaskImage:
          overflowWidth > 0 && !isHovered
            ? "linear-gradient(to right, black calc(100% - 18px), transparent 100%)"
            : "none",
      }}
    >
      <span
        ref={textRef}
        style={{
          transform:
            isHovered && overflowWidth > 0
              ? `translateX(-${overflowWidth + 8}px)`
              : "translateX(0px)",
          transition:
            isHovered && overflowWidth > 0
              ? `transform ${duration}s linear 0.15s`
              : "transform 0.25s ease-out",
        }}
        className="inline-block whitespace-nowrap text-[15px] select-none text-left"
      >
        {text}
      </span>
    </div>
  );
}

/**
 * Auto-scrolling model name on hover (e.g. gemini-3.8-flash, GPT-5.4 Thinking)
 * Matching the effort type tier slider marquee animation
 */
function ModelMarqueeText({
  text,
  isHovered,
  className,
}: {
  text: string;
  isHovered: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  const measure = useCallback(() => {
    if (textRef.current && containerRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflowWidth(diff > 0 ? Math.ceil(diff) : 0);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text, measure]);

  useEffect(() => {
    if (isHovered) {
      measure();
    }
  }, [isHovered, measure]);

  const duration = Math.max(1.8, overflowWidth / 22);

  return (
    <div
      ref={containerRef}
      style={{
        maskImage:
          overflowWidth > 0 && !isHovered
            ? "linear-gradient(to right, black calc(100% - 5px), transparent 100%)"
            : "none",
        WebkitMaskImage:
          overflowWidth > 0 && !isHovered
            ? "linear-gradient(to right, black calc(100% - 5px), transparent 100%)"
            : "none",
      }}
      className={cn(
        "relative flex-1 min-w-0 overflow-hidden text-muted-foreground font-normal",
        overflowWidth === 0 ? "text-right" : "text-left",
        className
      )}
    >
      <span
        ref={textRef}
        style={{
          transform:
            isHovered && overflowWidth > 0
              ? `translateX(-${overflowWidth + 1}px)`
              : "translateX(0px)",
          transition:
            isHovered && overflowWidth > 0
              ? `transform ${duration}s linear 0.15s`
              : "transform 0.25s ease-out",
        }}
        className="inline-block whitespace-nowrap text-[12.5px] sm:text-[15px] select-none text-inherit font-inherit"
      >
        {text}
      </span>
    </div>
  );
}

// ==========================================
// ModelSliderCard: Self-contained slider card
// ==========================================
function ModelSliderCard({
  tierIndex: externalTierIndex,
  onTierChange,
}: {
  tierIndex: number;
  onTierChange: (tier: number) => void;
}) {
  const [localTier, setLocalTier] = useState(externalTierIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);
  const [trackWidth, setTrackWidth] = useState(236);

  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Sync external changes when not actively interacting
  useEffect(() => {
    if (!isPointerDownRef.current) {
      setLocalTier(externalTierIndex);
    }
  }, [externalTierIndex]);

  const sparklesCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const particlesRef = useRef<
    Array<{ x: number; y: number; r: number; flow: number; twinkle: number; phase: number }>
  >([]);
  const confettiPartsRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      ttl: number;
      color: string;
    }>
  >([]);

  const sparklesRafRef = useRef<number>(0);
  const confettiRafRef = useRef<number>(0);
  const lastSparkleTimeRef = useRef<number>(0);
  const lastConfettiTimeRef = useRef<number>(0);

  // Measure track width accurately
  useEffect(() => {
    if (sliderTrackRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 50) {
            setTrackWidth(entry.contentRect.width);
          }
        }
      });
      observer.observe(sliderTrackRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Initialize sparkles
  useEffect(() => {
    const w = trackWidth || 236;
    const h = 28;
    const count = 18;
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * w,
        y: 4 + Math.random() * (h - 8),
        r: 0.8 + Math.random() * 0.9,
        flow: 85 + Math.random() * 50,
        twinkle: 2.5 + Math.random() * 4.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = parts;

    const tickSparkles = (t: number) => {
      const canvas = sparklesCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(0.032, Math.max(0, (t - (lastSparkleTimeRef.current || t)) / 1000));
      lastSparkleTimeRef.current = t;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = "#ffffff";
      const sec = t / 1000;

      for (const p of particlesRef.current) {
        p.x -= p.flow * dt;
        if (p.x < -3) p.x += cw + 6;
        const s = 0.5 + 0.5 * Math.sin(sec * p.twinkle + p.phase);
        ctx.globalAlpha = 0.06 + 0.74 * s * s;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      sparklesRafRef.current = requestAnimationFrame(tickSparkles);
    };

    sparklesRafRef.current = requestAnimationFrame(tickSparkles);

    return () => {
      cancelAnimationFrame(sparklesRafRef.current);
    };
  }, [trackWidth]);

  // Confetti celebration trigger for Ultra
  const fireConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const now = performance.now();
    lastConfettiTimeRef.current = now;

    const COLORS = ["#C9B0F0", "#BFA5F2", "#D4C3F7", "#B79EF5"];
    const K = 34;
    const span = Math.max(1, trackWidth - K);
    const cx = 17 + span + 20;
    const cy = 25;
    const parts = [];

    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const sp = 105 + Math.random() * 45;
      parts.push({
        x: cx + Math.cos(ang) * 17,
        y: cy + Math.sin(ang) * 17,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 25,
        size: 4.5 + Math.random() * 1,
        life: 0,
        ttl: 0.2 + Math.random() * 0.08,
        color: COLORS[i % COLORS.length],
      });
    }

    confettiPartsRef.current = parts;

    const tickConfetti = (t: number) => {
      const cvs = confettiCanvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(0.032, Math.max(0, (t - (lastConfettiTimeRef.current || t)) / 1000));
      lastConfettiTimeRef.current = t;

      ctx.clearRect(0, 0, cvs.width, cvs.height);

      confettiPartsRef.current = confettiPartsRef.current.filter((p) => {
        p.life += dt;
        if (p.life >= p.ttl) return false;
        const damp = Math.exp(-6 * dt);
        p.vx *= damp;
        p.vy = p.vy * damp - 20 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = p.life / p.ttl;
        ctx.globalAlpha = Math.pow(1 - k, 1.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      ctx.globalAlpha = 1;

      if (confettiPartsRef.current.length > 0) {
        confettiRafRef.current = requestAnimationFrame(tickConfetti);
      }
    };

    cancelAnimationFrame(confettiRafRef.current);
    confettiRafRef.current = requestAnimationFrame(tickConfetti);
  }, [trackWidth]);

  // Geometry calculation for the slider using pure CSS calc to eliminate layout shift on hover/open
  const K = 34; // knob diameter
  const currentFraction = dragFraction !== null ? dragFraction : (localTier / 4);
  const knobLeftCSS = `calc(${currentFraction * 100}% + ${(1 - 2 * currentFraction) * 17}px)`;
  const fillWidthCSS = `calc(${currentFraction * 100}% + ${(2 - 2 * currentFraction) * 17}px)`;

  // Pointer drag & click logic: instant snap on click, smooth 60fps tracking on drag
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    hasMovedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    if (rect.width <= K) return;
    const rawPos = (e.clientX - rect.left - 17) / (rect.width - 34);
    const clamped = Math.max(0, Math.min(1, rawPos));
    const nearest = Math.round(clamped * 4);

    // Immediately snap on click with zero delay!
    setLocalTier(nearest);
    onTierChange(nearest);
    if (nearest === 4) {
      fireConfetti();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    e.stopPropagation();

    // Check if pointer has moved enough to qualify as an intentional drag
    if (!hasMovedRef.current) {
      if (Math.abs(e.clientX - startXRef.current) > 3) {
        hasMovedRef.current = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    if (rect.width <= K) return;
    const rawPos = (e.clientX - rect.left - 17) / (rect.width - 34);
    const clamped = Math.max(0, Math.min(1, rawPos));
    setDragFraction(clamped);

    const nearest = Math.round(clamped * 4);
    if (nearest !== localTier) {
      setLocalTier(nearest);
      onTierChange(nearest);
      if (nearest === 4) {
        fireConfetti();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    e.stopPropagation();
    isPointerDownRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    if (hasMovedRef.current && dragFraction !== null) {
      const nearest = Math.round(dragFraction * 4);
      setLocalTier(nearest);
      onTierChange(nearest);
      if (nearest === 4) {
        fireConfetti();
      }
    }

    setIsDragging(false);
    setDragFraction(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(4, localTier + 1);
      setLocalTier(next);
      onTierChange(next);
      if (next === 4) fireConfetti();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(0, localTier - 1);
      setLocalTier(next);
      onTierChange(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      setLocalTier(0);
      onTierChange(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setLocalTier(4);
      onTierChange(4);
      fireConfetti();
    }
  };

  const isUltra = localTier === 4;
  const currentTier = TIERS[localTier] || TIERS[4];
  const showHeaderLabels = isHoveringSlider || isDragging;

  return (
    <div className="flex flex-col" onPointerDown={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="relative h-[22px] flex items-center justify-between mb-3 select-none">
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-between transition-opacity duration-150",
            showHeaderLabels ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <div className="flex items-center gap-1 text-[15px] text-[#8E9299] dark:text-[#8e8e93] font-medium select-none">
            <span>Advanced</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <svg className="w-[15px] h-[15px] text-[#0371DD] fill-current shrink-0" viewBox="0 0 20 20">
            <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z"/>
          </svg>
        </div>

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-between pointer-events-none transition-opacity duration-150",
            showHeaderLabels ? "opacity-100" : "opacity-0"
          )}
        >
          {isUltra ? (
            <span className="w-full text-center text-[15px] font-semibold bg-gradient-to-r from-[#7C3AED] to-[#9333EA] bg-clip-text text-transparent">
              Consumes usage limits faster
            </span>
          ) : (
            <>
              <span className="text-[15px] text-[#8E9299] dark:text-[#8e8e93]">Faster</span>
              <span className="text-[15px] text-[#8E9299] dark:text-[#8e8e93]">Smarter</span>
            </>
          )}
        </div>
      </div>

      {/* Slider */}
      <div
        className="relative h-[38px] w-full flex items-center cursor-grab active:cursor-grabbing select-none touch-none outline-none"
        onPointerEnter={() => setIsHoveringSlider(true)}
        onPointerLeave={() => setIsHoveringSlider(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        tabIndex={0}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={localTier}
        aria-valuetext={currentTier.label}
        onKeyDown={handleKeyDown}
      >
        {/* Track */}
        <div
          ref={sliderTrackRef}
          className="relative h-[28px] w-full rounded-full bg-[#E1E1E4] dark:bg-[#303030] overflow-hidden pointer-events-none"
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const f = i / 4;
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#C0C0C2] dark:bg-[#545458]"
                style={{
                  left: `calc(${f * 100}% + ${(1 - 2 * f) * 17}px)`,
                }}
              />
            );
          })}

          {/* Fill Bar with sparkles */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 rounded-full overflow-hidden",
              isDragging
                ? "transition-none"
                : "transition-[width] duration-150 ease-out",
              isUltra
                ? "bg-gradient-to-r from-[#2E61D4] via-[#A57BFD] to-[#8B73F3]"
                : "bg-[#0371DD]"
            )}
            style={{
              width: fillWidthCSS,
            }}
          >
            <canvas
              ref={sparklesCanvasRef}
              width={trackWidth || 236}
              height={28}
              className="w-full h-full pointer-events-none opacity-85"
            />
          </div>
        </div>

        {/* Draggable Knob */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full bg-white dark:bg-[#ececec] pointer-events-none",
            isDragging
              ? "scale-105 transition-transform duration-75 ease-out"
              : "scale-100 transition-[left,transform] duration-150 ease-out"
          )}
          style={{
            left: knobLeftCSS,
          }}
        />

        {/* Confetti Overlay */}
        <canvas
          ref={confettiCanvasRef}
          width={trackWidth + 40}
          height={50}
          className="absolute -left-5 -top-1.5 pointer-events-none z-20"
        />
      </div>
    </div>
  );
}

export function PlusMenuContent({
  onAddFiles,
  onAddPhotos,
  selectedModel = "gemini-3.8 flash",
  onModelChange,
  selectedTier = 4,
  onTierChange,
  isOpen = true,
  disableAttach = false,
  isGuest = false,
  onOpenLoginModal,
  onOpenWebSearchModal,
  onOpenAdvancedFeaturesModal,
}: PlusMenuContentProps) {
  const [model, setModel] = useState<string>(selectedModel);
  const [tierIndex, setTierIndex] = useState<number>(selectedTier);
  const [speed, setSpeed] = useState<string>("Fast");
  const [hoveredModelIdx, setHoveredModelIdx] = useState<number | null>(null);
  const [hoveredTierIdx, setHoveredTierIdx] = useState<number | null>(null);
  const [hoveredSpeedIdx, setHoveredSpeedIdx] = useState<number | null>(null);
  const [subView, setSubView] = useState<
    "main" | "models" | "model-picker" | "effort" | "speed" | "advanced"
  >("main");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isSelectModelsHovered, setIsSelectModelsHovered] = useState(false);
  const [isModelSubHovered, setIsModelSubHovered] = useState(false);
  const [isEffortSubHovered, setIsEffortSubHovered] = useState(false);
  const [isSpeedSubHovered, setIsSpeedSubHovered] = useState(false);
  const [isMobileSelectModelsHovered, setIsMobileSelectModelsHovered] = useState(false);
  const [isMobileModelRowHovered, setIsMobileModelRowHovered] = useState(false);
  const [isMobileEffortRowHovered, setIsMobileEffortRowHovered] = useState(false);
  const [isMobileSpeedRowHovered, setIsMobileSpeedRowHovered] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1025);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset subview when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSubView("main");
    }
  }, [isOpen]);

  // Sync external changes
  useEffect(() => {
    if (selectedModel) setModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (typeof selectedTier === "number") setTierIndex(selectedTier);
  }, [selectedTier]);

  const handleTierChange = (newTier: number) => {
    const clamped = Math.max(0, Math.min(4, newTier));
    setTierIndex(clamped);
    onTierChange?.(clamped);
  };

  const handleModelSelect = (newModel: string) => {
    setModel(newModel);
    onModelChange?.(newModel);
  };

  const isUltra = tierIndex === 4;
  const currentTier = TIERS[tierIndex] || TIERS[4];

  // Unauthorized / Guest User Menu
  if (isGuest) {
    if (isMobileScreen && subView === "models") {
      return (
        <div className="space-y-0.5 p-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("main");
            }}
            className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Select models</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

          {/* Row 1: Model */}
          <button
            type="button"
            onMouseEnter={() => setIsMobileModelRowHovered(true)}
            onMouseLeave={() => setIsMobileModelRowHovered(false)}
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("model-picker");
            }}
            className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <span className="font-medium shrink-0 mr-1.5">Model</span>
            <ModelMarqueeText text={model} isHovered={isMobileModelRowHovered} />
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
          </button>

          {/* Row 2: Effort */}
          <button
            type="button"
            onMouseEnter={() => setIsMobileEffortRowHovered(true)}
            onMouseLeave={() => setIsMobileEffortRowHovered(false)}
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("effort");
            }}
            className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <span className="font-medium shrink-0 mr-1.5">Effort</span>
            <ModelMarqueeText
              text={currentTier.key}
              isHovered={isMobileEffortRowHovered}
              className={isUltra ? "text-purple-400 font-medium" : "text-muted-foreground"}
            />
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
          </button>

          {/* Row 3: Speed */}
          <button
            type="button"
            onMouseEnter={() => setIsMobileSpeedRowHovered(true)}
            onMouseLeave={() => setIsMobileSpeedRowHovered(false)}
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("speed");
            }}
            className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <span className="shrink-0 font-medium mr-1.5">Speed</span>
            <ModelMarqueeText text={speed} isHovered={isMobileSpeedRowHovered} />
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
          </button>

          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

          {/* Row 4: Advanced */}
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("advanced");
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <span>Advanced</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </div>
      );
    }

    if (isMobileScreen && subView === "model-picker") {
      return (
        <div className="space-y-0.5 p-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("models");
            }}
            className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Model</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

          {MODEL_OPTIONS.map((m, globalIdx) => (
            <button
              key={m.key}
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                e.stopPropagation();
                (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
              }}
              onMouseEnter={() => setHoveredModelIdx(globalIdx)}
              onMouseLeave={() => setHoveredModelIdx(null)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
            >
              <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
              {model === m.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      );
    }

    if (isMobileScreen && subView === "effort") {
      return (
        <div className="space-y-0.5 p-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("models");
            }}
            className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Effort</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

          {TIERS.map((tier, idx) => (
            <button
              key={tier.key}
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                e.stopPropagation();
                (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
              }}
              onMouseEnter={() => setHoveredTierIdx(idx)}
              onMouseLeave={() => setHoveredTierIdx(null)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
            >
              <TierMarqueeText text={tier.label} isHovered={hoveredTierIdx === idx} />
              {tierIndex === idx && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      );
    }

    if (isMobileScreen && subView === "speed") {
      return (
        <div className="space-y-0.5 p-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("models");
            }}
            className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Speed</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

          {SPEED_OPTIONS.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                e.stopPropagation();
                (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
              }}
              onMouseEnter={() => setHoveredSpeedIdx(idx)}
              onMouseLeave={() => setHoveredSpeedIdx(null)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
            >
              <TierMarqueeText text={s.label} isHovered={hoveredSpeedIdx === idx} />
              {speed === s.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      );
    }

    if (isMobileScreen && subView === "advanced") {
      return (
        <div className="space-y-1.5 p-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("models");
            }}
            className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Advanced</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />
          <div
            className="p-2 pt-1 cursor-pointer"
            onPointerDown={(e) => {
              e.stopPropagation();
              (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
            }}
            onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
          >
            <ModelSliderCard
              tierIndex={tierIndex}
              onTierChange={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-0.5 p-0.5">
        {/* 1. Attach photos */}
        <DropdownMenuItem
          onClick={onAddPhotos}
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-medium cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none whitespace-nowrap text-left"
        >
          <Images className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Attach photos</span>
        </DropdownMenuItem>

        {/* 2. Web search */}
        <DropdownMenuItem
          onClick={() => {
            if (onOpenLoginModal) onOpenLoginModal();
            else if (onOpenWebSearchModal) onOpenWebSearchModal();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-medium cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] transition-colors outline-none whitespace-nowrap text-left"
        >
          <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Web search</span>
        </DropdownMenuItem>

        {/* Divider with text: Log in to use */}
        <div className="pt-2 pb-1 px-3 text-xs font-medium text-muted-foreground select-none">
          Log in to use
        </div>

        {/* 3. Create images */}
        <DropdownMenuItem
          onClick={() => {
            if (onOpenLoginModal) onOpenLoginModal();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-medium cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] transition-colors outline-none whitespace-nowrap text-left"
        >
          <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <AnimatedComingSoonText label="Create images" comingSoonText="Coming soon" />
        </DropdownMenuItem>

        {/* 4. Attach files */}
        <DropdownMenuItem
          onClick={() => {
            (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-medium cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] transition-colors outline-none whitespace-nowrap text-left"
        >
          <Files className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Attach files</span>
        </DropdownMenuItem>

        {/* 5. Select models (Replaces Deep research) */}
        {isMobileScreen ? (
          <button
            type="button"
            onMouseEnter={() => setIsMobileSelectModelsHovered(true)}
            onMouseLeave={() => setIsMobileSelectModelsHovered(false)}
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSubView("models");
            }}
            className="w-full flex items-center px-3 py-2 text-md rounded-xl cursor-pointer text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left"
          >
            <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-2" />
            <span className="whitespace-nowrap font-medium shrink-0 mr-1.5">Select models</span>
            <ModelMarqueeText
              text={model}
              isHovered={isMobileSelectModelsHovered}
            />
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
          </button>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              onMouseEnter={() => setIsSelectModelsHovered(true)}
              onMouseLeave={() => setIsSelectModelsHovered(false)}
              chevronClassName="-ml-0.5"
              className="flex items-center px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
            >
              <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-2" />
              <span className="whitespace-nowrap font-medium shrink-0 mr-1.5">Select models</span>
              <ModelMarqueeText
                text={model}
                isHovered={isSelectModelsHovered}
              />
            </DropdownMenuSubTrigger>

            {/* Submenu: Models Menu */}
            <DropdownMenuSubContent
              sideOffset={4}
              alignOffset={-133}
              avoidCollisions={true}
              collisionPadding={12}
              className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none"
            >
              {/* Row 1: Model */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  onMouseEnter={() => setIsModelSubHovered(true)}
                  onMouseLeave={() => setIsModelSubHovered(false)}
                  onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                  chevronClassName="-ml-0.5"
                  className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
                >
                  <span className="font-medium shrink-0 mr-1.5">Model</span>
                  <ModelMarqueeText
                    text={model}
                    isHovered={isModelSubHovered}
                  />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={4}
                  alignOffset={-133}
                  avoidCollisions={true}
                  collisionPadding={12}
                  className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none"
                >
                  {MODEL_OPTIONS.filter((m) => m.key.toLowerCase().includes("gemini")).map((m) => {
                    const globalIdx = MODEL_OPTIONS.indexOf(m);
                    return (
                      <DropdownMenuItem
                        key={m.key}
                        onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                        onMouseEnter={() => setHoveredModelIdx(globalIdx)}
                        onMouseLeave={() => setHoveredModelIdx(null)}
                        className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                      >
                        <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
                        {model === m.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
                      </DropdownMenuItem>
                    );
                  })}

                  <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

                  {MODEL_OPTIONS.filter((m) => !m.key.toLowerCase().includes("gemini")).map((m) => {
                    const globalIdx = MODEL_OPTIONS.indexOf(m);
                    return (
                      <DropdownMenuItem
                        key={m.key}
                        onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                        onMouseEnter={() => setHoveredModelIdx(globalIdx)}
                        onMouseLeave={() => setHoveredModelIdx(null)}
                        className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                      >
                        <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
                        {model === m.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Row 2: Effort */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  onMouseEnter={() => setIsEffortSubHovered(true)}
                  onMouseLeave={() => setIsEffortSubHovered(false)}
                  onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                  chevronClassName="-ml-0.5"
                  className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
                >
                  <span className="font-medium shrink-0 mr-1.5">Effort</span>
                  <ModelMarqueeText
                    text={currentTier.key}
                    isHovered={isEffortSubHovered}
                    className={isUltra ? "text-purple-400 font-medium" : "text-muted-foreground"}
                  />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={4}
                  alignOffset={-161}
                  avoidCollisions={true}
                  collisionPadding={12}
                  className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none"
                >
                  {TIERS.map((tier, idx) => (
                    <DropdownMenuItem
                      key={tier.key}
                      onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                      onMouseEnter={() => setHoveredTierIdx(idx)}
                      onMouseLeave={() => setHoveredTierIdx(null)}
                      className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                    >
                      <TierMarqueeText text={tier.label} isHovered={hoveredTierIdx === idx} />
                      {tierIndex === idx && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Row 3: Speed */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  onMouseEnter={() => setIsSpeedSubHovered(true)}
                  onMouseLeave={() => setIsSpeedSubHovered(false)}
                  onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                  chevronClassName="-ml-0.5"
                  className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
                >
                  <span className="shrink-0 font-medium mr-1.5">Speed</span>
                  <ModelMarqueeText
                    text={speed}
                    isHovered={isSpeedSubHovered}
                  />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={4}
                  alignOffset={-84}
                  avoidCollisions={true}
                  collisionPadding={12}
                  className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none"
                >
                  {SPEED_OPTIONS.map((s, idx) => (
                    <DropdownMenuItem
                      key={s.key}
                      onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                      onMouseEnter={() => setHoveredSpeedIdx(idx)}
                      onMouseLeave={() => setHoveredSpeedIdx(null)}
                      className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                    >
                      <TierMarqueeText text={s.label} isHovered={hoveredSpeedIdx === idx} />
                      {speed === s.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Divider */}
              <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

              {/* Row 4: Advanced Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer text-[15px] text-foreground hover:bg-secondary dark:hover:bg-[#383838] dark:focus:bg-[#383838] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 [&>svg:last-child]:ml-1 text-left">
                  <span className="shrink-0">Advanced</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={4}
                  alignOffset={-48}
                  avoidCollisions={true}
                  collisionPadding={12}
                  className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-3 bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none select-none outline-none cursor-pointer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.();
                  }}
                  onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                >
                  <div onClick={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}>
                    <ModelSliderCard
                      tierIndex={tierIndex}
                      onTierChange={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.()}
                    />
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </div>
    );
  }

  // Mobile In-Place Subviews (matching Profile Dropdown behavior)
  if (isMobileScreen && subView === "models") {
    return (
      <div className="space-y-0.5 p-0.5">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("main");
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Select models</span>
        </button>
        <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

        {/* Row 1: Model */}
        <button
          type="button"
          onMouseEnter={() => setIsMobileModelRowHovered(true)}
          onMouseLeave={() => setIsMobileModelRowHovered(false)}
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("model-picker");
          }}
          className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <span className="font-medium shrink-0 mr-1.5">Model</span>
          <ModelMarqueeText
            text={model}
            isHovered={isMobileModelRowHovered}
          />
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
        </button>

        {/* Row 2: Effort */}
        <button
          type="button"
          onMouseEnter={() => setIsMobileEffortRowHovered(true)}
          onMouseLeave={() => setIsMobileEffortRowHovered(false)}
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("effort");
          }}
          className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <span className="font-medium shrink-0 mr-1.5">Effort</span>
          <ModelMarqueeText
            text={currentTier.key}
            isHovered={isMobileEffortRowHovered}
            className={isUltra ? "text-purple-400 font-medium" : "text-muted-foreground"}
          />
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
        </button>

        {/* Row 3: Speed */}
        <button
          type="button"
          onMouseEnter={() => setIsMobileSpeedRowHovered(true)}
          onMouseLeave={() => setIsMobileSpeedRowHovered(false)}
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("speed");
          }}
          className="w-full flex items-center px-3 py-2 rounded-xl text-md text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors cursor-pointer text-left outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <span className="shrink-0 font-medium mr-1.5">Speed</span>
          <ModelMarqueeText
            text={speed}
            isHovered={isMobileSpeedRowHovered}
          />
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
        </button>

        <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

        {/* Row 4: Advanced */}
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("advanced");
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <span>Advanced</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>
    );
  }

  if (isMobileScreen && subView === "model-picker") {
    return (
      <div className="space-y-0.5 p-0.5">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("models");
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Model</span>
        </button>
        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

        {MODEL_OPTIONS.filter((m) => m.key.toLowerCase().includes("gemini")).map((m) => {
          const globalIdx = MODEL_OPTIONS.indexOf(m);
          return (
            <button
              key={m.key}
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                e.stopPropagation();
                handleModelSelect(m.key);
                setSubView("models");
              }}
              onMouseEnter={() => setHoveredModelIdx(globalIdx)}
              onMouseLeave={() => setHoveredModelIdx(null)}
              onFocus={() => setHoveredModelIdx(globalIdx)}
              onBlur={() => setHoveredModelIdx(null)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
            >
              <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
              {model === m.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
            </button>
          );
        })}

        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

        {MODEL_OPTIONS.filter((m) => !m.key.toLowerCase().includes("gemini")).map((m) => {
          const globalIdx = MODEL_OPTIONS.indexOf(m);
          return (
            <button
              key={m.key}
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                e.stopPropagation();
                handleModelSelect(m.key);
                setSubView("models");
              }}
              onMouseEnter={() => setHoveredModelIdx(globalIdx)}
              onMouseLeave={() => setHoveredModelIdx(null)}
              onFocus={() => setHoveredModelIdx(globalIdx)}
              onBlur={() => setHoveredModelIdx(null)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
            >
              <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
              {model === m.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (isMobileScreen && subView === "effort") {
    return (
      <div className="space-y-0.5 p-0.5">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("models");
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Effort</span>
        </button>
        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

        {TIERS.map((tier, idx) => (
          <button
            key={tier.key}
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              handleTierChange(idx);
              setSubView("models");
            }}
            onMouseEnter={() => setHoveredTierIdx(idx)}
            onMouseLeave={() => setHoveredTierIdx(null)}
            onFocus={() => setHoveredTierIdx(idx)}
            onBlur={() => setHoveredTierIdx(null)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
          >
            <TierMarqueeText text={tier.label} isHovered={hoveredTierIdx === idx} />
            {tierIndex === idx && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
          </button>
        ))}
      </div>
    );
  }

  if (isMobileScreen && subView === "speed") {
    return (
      <div className="space-y-0.5 p-0.5">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("models");
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Speed</span>
        </button>
        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />

        {SPEED_OPTIONS.map((s, idx) => (
          <button
            key={s.key}
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              e.stopPropagation();
              setSpeed(s.key as "Fast" | "Standard");
              setSubView("models");
            }}
            onMouseEnter={() => setHoveredSpeedIdx(idx)}
            onMouseLeave={() => setHoveredSpeedIdx(null)}
            onFocus={() => setHoveredSpeedIdx(idx)}
            onBlur={() => setHoveredSpeedIdx(null)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors cursor-pointer min-w-0 outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
          >
            <TierMarqueeText text={s.label} isHovered={hoveredSpeedIdx === idx} />
            {speed === s.key && <Check className="w-4 h-4 text-foreground shrink-0 ml-2" />}
          </button>
        ))}
      </div>
    );
  }

  if (isMobileScreen && subView === "advanced") {
    return (
      <div className="space-y-1.5 p-0.5">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("models");
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Advanced</span>
        </button>
        <div className="h-[1px] bg-neutral-200 dark:bg-[#383838] my-1 -mx-0.5" />
        <div className="p-2 pt-1" onPointerDown={(e) => e.stopPropagation()}>
          <ModelSliderCard
            tierIndex={tierIndex}
            onTierChange={handleTierChange}
          />
        </div>
      </div>
    );
  }

  // Default Main View
  return (
    <>
      {/* Button 1: Attach anything */}
      <DropdownMenuItem
        onClick={disableAttach ? (e: any) => e.preventDefault() : onAddFiles}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 text-md rounded-xl font-medium transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left",
          disableAttach
            ? "cursor-not-allowed select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]"
            : "cursor-pointer text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80"
        )}
      >
        <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
        {disableAttach ? (
          <AnimatedComingSoonText label="Attach anything" comingSoonText="Coming soon" />
        ) : (
          <span className="whitespace-nowrap font-medium">Attach anything</span>
        )}
      </DropdownMenuItem>

      {/* Button 2: Select models */}
      {isMobileScreen ? (
        <button
          type="button"
          onMouseEnter={() => setIsMobileSelectModelsHovered(true)}
          onMouseLeave={() => setIsMobileSelectModelsHovered(false)}
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            e.stopPropagation();
            setSubView("models");
          }}
          className="w-full flex items-center px-3 py-2 text-md rounded-xl cursor-pointer text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left"
        >
          <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-2" />
          <span className="whitespace-nowrap font-medium shrink-0 mr-1.5">Select models</span>
          <ModelMarqueeText
            text={model}
            isHovered={isMobileSelectModelsHovered}
          />
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 -ml-0.5" />
        </button>
      ) : (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            onMouseEnter={() => setIsSelectModelsHovered(true)}
            onMouseLeave={() => setIsSelectModelsHovered(false)}
            chevronClassName="-ml-0.5"
            className="flex items-center px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
          >
            <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-2" />
            <span className="whitespace-nowrap font-medium shrink-0 mr-1.5">Select models</span>
            <ModelMarqueeText
              text={model}
              isHovered={isSelectModelsHovered}
            />
          </DropdownMenuSubTrigger>

          {/* Submenu 1: Models Menu */}
          <DropdownMenuSubContent
            sideOffset={4}
            alignOffset={-133}
            avoidCollisions={true}
            collisionPadding={12}
            className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none select-none outline-none"
          >
            {/* Row 1: Model (Submenu dropdown on HOVER) */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                onMouseEnter={() => setIsModelSubHovered(true)}
                onMouseLeave={() => setIsModelSubHovered(false)}
                chevronClassName="-ml-0.5"
                className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
              >
                <span className="font-medium shrink-0 mr-1.5">Model</span>
                <ModelMarqueeText
                  text={model}
                  isHovered={isModelSubHovered}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={4}
                alignOffset={-133}
                avoidCollisions={true}
                collisionPadding={12}
                className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none select-none outline-none"
              >
                <DropdownMenuRadioGroup
                  value={model}
                  onValueChange={(val) => handleModelSelect(val)}
                >
                  {MODEL_OPTIONS.filter((m) => m.key.toLowerCase().includes("gemini")).map((m) => {
                    const globalIdx = MODEL_OPTIONS.indexOf(m);
                    return (
                      <DropdownMenuRadioItem
                        key={m.key}
                        value={m.key}
                        onMouseEnter={() => setHoveredModelIdx(globalIdx)}
                        onMouseLeave={() => setHoveredModelIdx(null)}
                        onFocus={() => setHoveredModelIdx(globalIdx)}
                        onBlur={() => setHoveredModelIdx(null)}
                        className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                      >
                        <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
                      </DropdownMenuRadioItem>
                    );
                  })}

                  <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

                  {MODEL_OPTIONS.filter((m) => !m.key.toLowerCase().includes("gemini")).map((m) => {
                    const globalIdx = MODEL_OPTIONS.indexOf(m);
                    return (
                      <DropdownMenuRadioItem
                        key={m.key}
                        value={m.key}
                        onMouseEnter={() => setHoveredModelIdx(globalIdx)}
                        onMouseLeave={() => setHoveredModelIdx(null)}
                        onFocus={() => setHoveredModelIdx(globalIdx)}
                        onBlur={() => setHoveredModelIdx(null)}
                        className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                      >
                        <TierMarqueeText text={m.label} isHovered={hoveredModelIdx === globalIdx} />
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Row 2: Effort*/}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                onMouseEnter={() => setIsEffortSubHovered(true)}
                onMouseLeave={() => setIsEffortSubHovered(false)}
                chevronClassName="-ml-0.5"
                className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
              >
                <span className="font-medium shrink-0 mr-1.5">Effort</span>
                <ModelMarqueeText
                  text={currentTier.key}
                  isHovered={isEffortSubHovered}
                  className={isUltra ? "text-purple-400 font-medium" : "text-muted-foreground"}
                />
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent
                sideOffset={4}
                alignOffset={-161}
                avoidCollisions={true}
                collisionPadding={12}
                className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none select-none outline-none"
              >
                <DropdownMenuRadioGroup
                  value={String(tierIndex)}
                  onValueChange={(val) => handleTierChange(Number(val))}
                >
                  {TIERS.map((tier, idx) => (
                    <DropdownMenuRadioItem
                      key={tier.key}
                      value={String(idx)}
                      onMouseEnter={() => setHoveredTierIdx(idx)}
                      onMouseLeave={() => setHoveredTierIdx(null)}
                      onFocus={() => setHoveredTierIdx(idx)}
                      onBlur={() => setHoveredTierIdx(null)}
                      className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                    >
                      <TierMarqueeText text={tier.label} isHovered={hoveredTierIdx === idx} />
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Row 3: Speed */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                onMouseEnter={() => setIsSpeedSubHovered(true)}
                onMouseLeave={() => setIsSpeedSubHovered(false)}
                chevronClassName="-ml-0.5"
                className="flex items-center px-3 py-2 rounded-xl cursor-pointer text-md font-medium text-foreground hover:bg-secondary dark:hover:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 text-left"
              >
                <span className="shrink-0 font-medium mr-1.5">Speed</span>
                <ModelMarqueeText
                  text={speed}
                  isHovered={isSpeedSubHovered}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={4}
                alignOffset={-84}
                avoidCollisions={true}
                collisionPadding={12}
                className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none select-none outline-none"
              >
                <DropdownMenuRadioGroup
                  value={speed}
                  onValueChange={(val) => setSpeed(val as "Fast" | "Standard")}
                >
                  {SPEED_OPTIONS.map((s, idx) => (
                    <DropdownMenuRadioItem
                      key={s.key}
                      value={s.key}
                      onMouseEnter={() => setHoveredSpeedIdx(idx)}
                      onMouseLeave={() => setHoveredSpeedIdx(null)}
                      onFocus={() => setHoveredSpeedIdx(idx)}
                      onBlur={() => setHoveredSpeedIdx(null)}
                      className="cursor-pointer text-[15px] rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-[#383838] flex items-center justify-between min-w-0 text-left"
                    >
                      <TierMarqueeText text={s.label} isHovered={hoveredSpeedIdx === idx} />
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Divider */}
            <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700/60 my-1 -mx-0.5" />

            {/* Row 4: Advanced Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer text-[15px] text-foreground hover:bg-secondary dark:hover:bg-[#383838] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#383838] transition-colors outline-none whitespace-nowrap [&>svg:last-child]:shrink-0 [&>svg:last-child]:ml-1 text-left">
                <span className="shrink-0">Advanced</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={4}
                alignOffset={-48}
                avoidCollisions={true}
                collisionPadding={12}
                className="w-[241px] max-w-[calc(100vw-24px)] rounded-2xl p-3 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none select-none outline-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ModelSliderCard
                  tierIndex={tierIndex}
                  onTierChange={handleTierChange}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
    </>
  );
}

export default PlusMenuContent;
