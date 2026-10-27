"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Layers } from "lucide-react";
import { AnimatedArrowUpRight } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";

export default function CompanyBrandPage() {
  const brandColors = [
    {
      name: "CloseAI Black",
      role: "Primary Logomark & Surfaces",
      hex: "#000000",
      className: "bg-black text-white",
    },
    {
      name: "CloseAI White",
      role: "Inverted Logomark & Canvas",
      hex: "#FFFFFF",
      className: "bg-white text-black border border-border/80",
    },
    {
      name: "Neutral Surface",
      role: "Secondary Containers & Cards",
      hex: "#F9F9F9",
      className: "bg-secondary text-foreground",
    },
    {
      name: "Border Subdued",
      role: "Dividers & Structural Rules",
      hex: "#E5E5E5",
      className: "bg-border text-foreground",
    },
  ];

  return (
    <div className="py-12 sm:py-20 w-full max-w-5xl mx-auto min-w-0 select-none">
      {/* 1. HERO SECTION */}
      <section className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Brand
        </p>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-[1.08]">
          Brand of CloseAI
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
          Visit our brand guidelines for detailed information on using our
          visual assets.
        </p>

        {/* Hero CTA Buttons: Contact Brand Support (left) & Brand Guidelines (right) */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12 sm:mb-16">
          <Button
            asChild
            className="group rounded-full h-12 px-4 bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white transition-all cursor-pointer inline-flex items-center justify-center font-normal text-base"
          >
            <Link href="/company/contact">
              <span>Contact Us</span>
            </Link>
          </Button>

          <Button
            asChild
            className="group rounded-full h-12 px-4 bg-foreground text-background hover:opacity-80 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center font-medium text-base"
          >
            <Link
              href="/company/brand/brand-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5"
            >
              <span>Brand Guidelines</span>
              <AnimatedArrowUpRight size={20} />
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. INTRODUCTION */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Overview
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Introduction
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            The CloseAI brand is an expression of our commitment to building
            safe, verifiable, and beneficial autonomous artificial general
            intelligence. It stands for technical rigour, transparency, and
            collaborative intelligence deployed worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 dark:border-none flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Safety First
              </span>
              <span className="text-xs font-mono text-muted-foreground mt-1">
                Formal Verification
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                Safety &amp; Alignment
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Engineered alignment verification and rigorous systemic
                boundaries
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 dark:border-none flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Broad Benefit
              </span>
              <span className="text-xs font-mono text-muted-foreground mt-1">
                Open Collaboration
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                Universal Utility
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accessible autonomous intelligence built for creators and
                researchers
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 dark:border-none flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Empirical Rigour
              </span>
              <span className="text-xs font-mono text-muted-foreground mt-1">
                Mathematical Gravity
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                Scientific Precision
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calm, understated systems focused on verifiable foundational
                progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE LOGOMARK (SYMBOL) */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Symbol
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            The Logomark
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Our symbol is an interlaced continuous eight-fold knot. It
            communicates algorithmic balance, collaborative intelligence, and
            robust alignment boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-white flex items-center justify-center p-6 border border-border/80">
              <img
                src="/closeai-new.png"
                alt="CloseAI Black Emblem"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                Black on Light
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Primary light mode and physical print mark
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6">
              <img
                src="/closeai-new-app-icon.png"
                alt="CloseAI App Icon"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                App Squircle
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mobile, desktop, and PWA manifest icon
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-black flex items-center justify-center p-6">
              <img
                src="/closeai-new-white.png"
                alt="CloseAI White Emblem"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">
                White on Dark
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Primary dark mode and physical print mark
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. IN APPLICATION (EDITORIAL GALLERY) */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Applications
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            In Application
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Examples of CloseAI brand kit usage across physical stationery,
            editorial monographs, and typographic media.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between aspect-square">
            <div className="w-full h-full rounded-2xl bg-secondary flex flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <img
                  src="/closeai-new.png"
                  alt="Emblem"
                  className="w-6 h-6 object-contain dark:hidden"
                />
                <img
                  src="/closeai-new-white.png"
                  alt="Emblem"
                  className="w-6 h-6 object-contain hidden dark:block"
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  ID &middot; 2026
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-16 bg-foreground/20 rounded" />
                <div className="h-1 w-24 bg-foreground/10 rounded" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
              Stationery &amp; Card System
            </p>
          </div>

          <div className="p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between aspect-square">
            <div className="w-full h-full rounded-2xl bg-secondary flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl font-semibold tracking-tight text-foreground mb-1 font-sans">
                CloseAI
              </span>
              <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                Alignment &middot; Research
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
              Monograph Publication
            </p>
          </div>

          <div className="p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between aspect-square">
            <div className="w-full h-full rounded-2xl bg-secondary flex flex-col justify-center p-6 space-y-1.5 font-sans">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                CloseAI
              </span>
              <span className="text-xl font-semibold tracking-tight text-foreground/80">
                CloseAI
              </span>
              <span className="text-base font-medium tracking-tight text-foreground/60">
                CloseAI
              </span>
              <span className="text-sm font-normal text-foreground/40">
                CloseAI
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
              Typographic Specimen
            </p>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA SECTION (BRAND GUIDELINES) */}
      <section className="rounded-sm bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none p-10 sm:p-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold text-foreground mb-4">
          Explore our brand guidelines
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Comprehensive specifications, emblem rules, color definitions, and
          asset standards for representing the CloseAI brand.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            className="group rounded-full px-4 h-12 text-base font-medium bg-foreground text-background hover:opacity-80 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Link
              href="/company/brand/brand-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5"
            >
              <span>Brand Guidelines</span>
              <AnimatedArrowUpRight size={20} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
