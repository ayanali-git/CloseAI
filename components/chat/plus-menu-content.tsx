"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  Brain,
  Paperclip,
  Package,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Image as ImageIcon,
  Files,
  Images,
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AnimatedComingSoonText, OverflowMarquee } from "@/components/ui/animated";

export interface PlusMenuContentProps {
  onAddFiles: () => void;
  onAddPhotos?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  selectedTier?: number;
  onTierChange?: (tier: number) => void;
  thinkMode: boolean;
  onToggleThink: () => void;
  disableAttach?: boolean;
  isGuest?: boolean;
  onOpenLoginModal?: (options?: { description?: string; title?: string }) => void;
  onOpenWebSearchModal?: (options?: { description?: string; title?: string }) => void;
  onOpenAdvancedFeaturesModal?: (options?: { description?: string; title?: string }) => void;
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
  { key: "GPT-6.1 Terra", label: "GPT-6.1 Terra" },
  { key: "GPT-6 Astra", label: "GPT-6 Astra" },
  { key: "GPT-5.6", label: "GPT-5.6" },
  { key: "GPT-5.5", label: "GPT-5.5" },
  { key: "Gemini 3.8 flash", label: "Gemini 3.8 flash" },
];

function MenuDescription({ text, className }: { text: string; className?: string }) {
  return (
    <OverflowMarquee
      text={text}
      className={cn("text-xs font-normal text-muted-foreground sm:text-sm", className)}
    />
  );
}

function ModelValue({ text, className }: { text: string; className?: string }) {
  return (
    <OverflowMarquee
      text={text}
      className={cn("flex-1 pr-1 text-muted-foreground font-normal", className)}
      textClassName="text-[12.5px] sm:text-[15px]"
      alignEnd
    />
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
    if (!["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      const next = Math.min(4, localTier + 1);
      setLocalTier(next);
      onTierChange(next);
      if (next === 4) fireConfetti();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      const next = Math.max(0, localTier - 1);
      setLocalTier(next);
      onTierChange(next);
    } else if (e.key === "Home") {
      setLocalTier(0);
      onTierChange(0);
    } else if (e.key === "End") {
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
        aria-label="Effort"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={localTier}
        aria-valuetext={currentTier.label}
        onKeyDown={handleKeyDown}
      >
        {/* Track */}
        <div
          ref={sliderTrackRef}
          className="relative h-[28px] w-full rounded-full bg-[#E1E1E4] dark:bg-[#404040] overflow-hidden pointer-events-none"
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
  selectedModel = "Gemini 3.8 flash",
  onModelChange,
  selectedTier = 4,
  onTierChange,
  thinkMode,
  onToggleThink,
  disableAttach = false,
  isGuest = false,
  onOpenLoginModal,
  onOpenWebSearchModal,
  onOpenAdvancedFeaturesModal,
}: PlusMenuContentProps) {
  const [model, setModel] = useState<string>(selectedModel);
  const [tierIndex, setTierIndex] = useState<number>(selectedTier);
  const [speed, setSpeed] = useState<string>("Fast");
  const [subView, setSubView] = useState<
    "main" | "models" | "model-picker" | "effort" | "speed" | "advanced"
  >("main");
  const menuRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef(false);

  useLayoutEffect(() => {
    if (!navigationRef.current) return;
    navigationRef.current = false;

    if (menuRef.current) {
      menuRef.current.closest("[data-plus-menu-scroll]")?.scrollTo(0, 0);
      menuRef.current.querySelector<HTMLElement>("[data-plus-menu-focus]")?.focus();
    }
  }, [subView]);

  const navigate = (event: Event, view: typeof subView) => {
    event.preventDefault();
    navigationRef.current = true;
    setSubView(view);
  };

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
  const guestLoginLabel = (
    <span className="ml-auto hidden shrink-0 cursor-pointer text-xs font-medium no-underline transition-opacity group-hover:block group-hover:hover:opacity-90 group-focus-visible:block">
      Log in
    </span>
  );
  const thinkMenuItem = (
    <DropdownMenuItem
      role={isGuest ? "menuitem" : "menuitemcheckbox"}
      aria-checked={isGuest ? undefined : thinkMode}
      textValue="Think"
      onSelect={onToggleThink}
      className={cn(
        "gap-2 rounded-xl font-medium whitespace-nowrap",
        isGuest && "dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
      )}
    >
      <Brain className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
      <span>Think mode</span>
      <MenuDescription text={!isGuest && thinkMode ? "Selected" : "Get efficient responses"} />
      {isGuest && guestLoginLabel}
    </DropdownMenuItem>
  );

  // Unauthorized / Guest User Menu
  if (isGuest) {
    return (
      <div className="space-y-0.5 p-0.5">
        {/* 1. Attach photos */}
        <DropdownMenuItem
          onClick={onAddPhotos}
          className="flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-pointer text-foreground transition-colors outline-none whitespace-nowrap text-left dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
        >
          <Images className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Attach photos</span>
          <MenuDescription text="Upload photos" />
        </DropdownMenuItem>

        <div className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground select-none">
          Log in to use
        </div>
        
        {/* 2. Attach files */}
        <DropdownMenuItem
          onSelect={() => {
            (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.({ description: "To continue with Attach files" });
          }}
          className="flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-pointer text-foreground transition-colors outline-none whitespace-nowrap text-left dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
        >
          <Files className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Attach files</span>
          <MenuDescription text="Upload files" />
          {guestLoginLabel}
        </DropdownMenuItem>

        {/* 3. Create images */}
        <DropdownMenuItem
          onSelect={() => {
            (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.({ description: "To continue with Create images" });
          }}
          className="flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-pointer text-foreground transition-colors outline-none whitespace-nowrap text-left dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Create images</span>
          <MenuDescription text="Turn prompts into images" />
          {guestLoginLabel}
        </DropdownMenuItem>

        {/* 4. Web search */}
        <DropdownMenuItem
          onSelect={() => {
            if (onOpenLoginModal) onOpenLoginModal({ description: "To continue with Web search" });
            else if (onOpenWebSearchModal) onOpenWebSearchModal({ description: "To continue with Web search" });
          }}
          className="flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-pointer text-foreground transition-colors outline-none whitespace-nowrap text-left dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
        >
          <Globe className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Web search</span>
          <MenuDescription text="Find real-time detailed info" />
          {guestLoginLabel}
        </DropdownMenuItem>

        {thinkMenuItem}

        {/* Select models */}
        <DropdownMenuItem
          onSelect={() => (onOpenLoginModal || onOpenAdvancedFeaturesModal)?.({ description: "To continue with Select models" })}
          className="flex items-center gap-2 px-3 py-2 text-base rounded-xl cursor-pointer text-foreground transition-colors outline-none whitespace-nowrap text-left dark:hover:bg-[#404040] dark:focus:bg-[#404040] dark:data-[highlighted]:bg-[#404040]"
        >
          <Package className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span className="whitespace-nowrap font-medium shrink-0">Select models</span>
          <MenuDescription text="Choose model" />
          {guestLoginLabel}
        </DropdownMenuItem>
      </div>
    );
  }

  if (subView === "models") {
    return (
      <div className="space-y-0.5 py-0.5" ref={menuRef}>
        <DropdownMenuItem
          data-plus-menu-focus
          onSelect={(event) => navigate(event, "main")}
          className="flex items-center gap-2 px-2.5 py-2 text-base font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus-visible:outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Select models</span>
        </DropdownMenuItem>
        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {/* Row 1: Model */}
        <DropdownMenuItem
          onSelect={(event) => navigate(event, "model-picker")}
          className="w-full flex items-center px-3 py-2 rounded-xl text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary transition-colors cursor-pointer text-left outline-none focus:outline-none focus-visible:outline-none"
        >
          <span className="font-medium shrink-0 mr-1.5">Model</span>
          <ModelValue text={model} />
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-auto" />
        </DropdownMenuItem>

        {/* Row 2: Effort */}
        <DropdownMenuItem
          onSelect={(event) => navigate(event, "effort")}
          className="w-full flex items-center px-3 py-2 rounded-xl text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary transition-colors cursor-pointer text-left outline-none focus:outline-none focus-visible:outline-none"
        >
          <span className="font-medium shrink-0 mr-1.5">Effort</span>
          <ModelValue
            text={currentTier.key}
            className={isUltra ? "text-purple-400 font-medium" : undefined}
          />
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-auto" />
        </DropdownMenuItem>

        {/* Row 3: Speed */}
        <DropdownMenuItem
          onSelect={(event) => navigate(event, "speed")}
          className="w-full flex items-center px-3 py-2 rounded-xl text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary transition-colors cursor-pointer text-left outline-none focus:outline-none focus-visible:outline-none"
        >
          <span className="shrink-0 font-medium mr-1.5">Speed</span>
          <ModelValue text={speed} />
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-auto" />
        </DropdownMenuItem>

        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {/* Row 4: Advanced */}
        <DropdownMenuItem
          onSelect={(event) => navigate(event, "advanced")}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
        >
          <span className="shrink-0 font-medium mr-1.5">Advanced</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-auto" />
        </DropdownMenuItem>
      </div>
    );
  }

  if (subView === "model-picker") {
    return (
      <div className="space-y-0.5 py-0.5" ref={menuRef}>
        <DropdownMenuItem
          data-plus-menu-focus
          onSelect={(event) => navigate(event, "models")}
          className="flex items-center gap-2 px-2.5 py-2 text-base font-medium text-foreground hover:bg-secondary active:bg-secondary rounded-xl cursor-pointer w-full text-left transition-colors outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Model</span>
        </DropdownMenuItem>
        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {MODEL_OPTIONS.filter((m) => !m.key.toLowerCase().includes("gemini")).map((m) => (
          <DropdownMenuItem
            key={m.key}
            role="menuitemradio"
            aria-checked={model === m.key}
            onSelect={(event) => {
              handleModelSelect(m.key);
              navigate(event, "models");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer min-w-0 outline-none text-left"
          >
            <OverflowMarquee text={m.label} className="flex-1 pr-1" />
            {model === m.key && <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />}
          </DropdownMenuItem>
        ))}

        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {MODEL_OPTIONS.filter((m) => m.key.toLowerCase().includes("gemini")).map((m) => (
          <DropdownMenuItem
            key={m.key}
            role="menuitemradio"
            aria-checked={model === m.key}
            onSelect={(event) => {
              handleModelSelect(m.key);
              navigate(event, "models");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer min-w-0 outline-none text-left"
          >
            <OverflowMarquee text={m.label} className="flex-1 pr-1" />
            {model === m.key && <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />}
          </DropdownMenuItem>
        ))}
      </div>
    );
  }

  if (subView === "effort") {
    return (
      <div className="space-y-0.5 py-0.5" ref={menuRef}>
        <DropdownMenuItem
          data-plus-menu-focus
          onSelect={(event) => navigate(event, "models")}
          className="flex items-center gap-2 px-2.5 py-2 text-base font-medium text-foreground hover:bg-secondary active:bg-secondary rounded-xl cursor-pointer w-full text-left transition-colors outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Effort</span>
        </DropdownMenuItem>
        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {TIERS.map((tier, idx) => (
          <DropdownMenuItem
            key={tier.key}
            role="menuitemradio"
            aria-checked={tierIndex === idx}
            onSelect={(event) => {
              handleTierChange(idx);
              navigate(event, "models");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer min-w-0 outline-none text-left"
          >
            <OverflowMarquee text={tier.label} className="flex-1 pr-1" />
            {tierIndex === idx && <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />}
          </DropdownMenuItem>
        ))}
      </div>
    );
  }

  if (subView === "speed") {
    return (
      <div className="space-y-0.5 py-0.5" ref={menuRef}>
        <DropdownMenuItem
          data-plus-menu-focus
          onSelect={(event) => navigate(event, "models")}
          className="flex items-center gap-2 px-2.5 py-2 text-base font-medium text-foreground hover:bg-secondary active:bg-secondary rounded-xl cursor-pointer w-full text-left transition-colors outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Speed</span>
        </DropdownMenuItem>
        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />

        {SPEED_OPTIONS.map((s) => (
          <DropdownMenuItem
            key={s.key}
            role="menuitemradio"
            aria-checked={speed === s.key}
            onSelect={(event) => {
              setSpeed(s.key);
              navigate(event, "models");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[15px] text-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer min-w-0 outline-none text-left"
          >
            <OverflowMarquee text={s.label} className="flex-1 pr-1" />
            {speed === s.key && <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />}
          </DropdownMenuItem>
        ))}
      </div>
    );
  }

  if (subView === "advanced") {
    return (
      <div className="space-y-1.5 p-0.5" ref={menuRef}>
        <DropdownMenuItem
          data-plus-menu-focus
          onSelect={(event) => navigate(event, "models")}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
              event.preventDefault();
              menuRef.current?.querySelector<HTMLElement>('[role="slider"]')?.focus();
            }
          }}
          className="flex items-center gap-2 px-2.5 py-2 text-base font-medium text-foreground hover:bg-secondary active:bg-secondary rounded-xl cursor-pointer w-full text-left transition-colors outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
          <span>Advanced</span>
        </DropdownMenuItem>
        <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />
        <div
          className="p-2 pt-1"
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Tab" && event.shiftKey) {
              event.preventDefault();
              menuRef.current?.querySelector<HTMLElement>("[data-plus-menu-focus]")?.focus();
            }
          }}
        >
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
    <div className="space-y-0.5" ref={menuRef}>
      {/* Button 1: Attach anything */}
      <DropdownMenuItem
        onClick={disableAttach ? (e: any) => e.preventDefault() : onAddFiles}
        className={cn(
          "group flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium transition-colors outline-none whitespace-nowrap text-left",
          disableAttach
            ? "cursor-not-allowed opacity-50 select-none text-muted-foreground hover:bg-secondary data-[highlighted]:bg-secondary"
            : "cursor-pointer text-foreground hover:bg-secondary data-[highlighted]:bg-secondary active:bg-secondary"
        )}
      >
        <Paperclip className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        {disableAttach ? (
          <AnimatedComingSoonText label="Attach anything" comingSoonText="Coming soon" className="shrink-0" />
        ) : (
          <span className="whitespace-nowrap font-medium">Attach anything</span>
        )}
        <MenuDescription text="Upload photos or files" />
      </DropdownMenuItem>

      {/* Button 2: Create images */}
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={(e) => e.preventDefault()}
        className="group flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-not-allowed opacity-50 text-foreground hover:bg-secondary data-[highlighted]:bg-secondary active:bg-secondary transition-colors outline-none whitespace-nowrap text-left"
      >
        <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        <AnimatedComingSoonText
          label="Create images"
          comingSoonText="Coming soon"
          className="shrink-0"
        />
        <MenuDescription text="Turn prompts into images" />
      </DropdownMenuItem>

      {/* Button 3: Web search */}
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={(e) => e.preventDefault()}
        className="group flex items-center gap-2 px-3 py-2 text-base rounded-xl font-medium cursor-not-allowed opacity-50 text-foreground hover:bg-secondary data-[highlighted]:bg-secondary active:bg-secondary transition-colors outline-none whitespace-nowrap text-left"
      >
        <Globe className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        <AnimatedComingSoonText
          label="Web search"
          comingSoonText="Coming soon"
          className="shrink-0"
        />
        <MenuDescription text="Find real-time detailed info" />
      </DropdownMenuItem>

      {thinkMenuItem}

      <div className="h-[1px] bg-neutral-200 my-1 -mx-0.5 dark:bg-[#202020]" />
      {/* Select models */}
      <DropdownMenuItem
        data-plus-menu-focus
        onSelect={(event) => navigate(event, "models")}
        className="flex items-center px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary active:bg-secondary transition-colors outline-none whitespace-nowrap text-left font-medium"
      >
        {/* <Package className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 mr-2" /> */}
        <span className="whitespace-nowrap font-medium shrink-0 mr-1.5">Select models</span>
        <MenuDescription text="Choose model" className="mr-2" />
        {/* <ModelValue text={model} className="min-w-[3rem] flex-auto" /> */}
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-auto" />
      </DropdownMenuItem>
    </div>
  );
}

export default PlusMenuContent;
