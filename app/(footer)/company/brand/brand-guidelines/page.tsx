'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Mail, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyBrandGuidelinesPage() {

  const typeScale = [
    { level: "Display", size: "48px – 60px", weight: "Semi-Bold (600)", tracking: "-0.025em", usage: "Marketing hero headlines" },
    { level: "Heading 1", size: "32px – 40px", weight: "Semi-Bold (600)", tracking: "-0.02em", usage: "Section titles & major headings" },
    { level: "Heading 2", size: "22px – 28px", weight: "Semi-Bold (600)", tracking: "-0.015em", usage: "Subsections & card headers" },
    { level: "Body Text", size: "15px – 16px", weight: "Regular (400)", tracking: "Normal", usage: "Main body paragraphs & AI responses" },
    { level: "Monospace", size: "13px – 14px", weight: "Regular (400)", tracking: "Normal", usage: "Code blocks, hex codes, & API keys" },
  ];

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
      hex: "#ffffff",
      className: "bg-white text-black border border-border/80",
    },
    {
      name: "Neutral Surface",
      role: "Secondary Containers & Cards",
      hex: "#f9f9f9",
      className: "bg-secondary text-foreground",
    },
    {
      name: "Border Subdued",
      role: "Dividers & Structural Rules",
      hex: "#e5e5e5",
      className: "bg-border text-foreground",
    },
  ];

  const supportChannels = [
    {
      icon: MessageSquare,
      title: "Media Requests",
      description:
        "For journalists, media interviews, and high-resolution event media.",
      contact: "media@closeai.com",
      href: "mailto:media@closeai.com",
    },
    {
      icon: ShieldCheck,
      title: "Brand Permissions & Licensing",
      description:
        "For partner co-marketing approvals, book publishing, physical merchandise, and commercial rights.",
      contact: "brand@closeai.com",
      href: "mailto:brand@closeai.com",
    },
    {
      icon: Mail,
      title: "General Brand Inquiries",
      description:
        "For developers using CloseAI badges, community guidelines, or questions about asset formatting.",
      contact: "support@closeai.com",
      href: "/company/contact",
    },
  ];

  return (
    <div className="py-12 sm:py-20 w-full max-w-5xl mx-auto min-w-0 select-none">
      {/* 1. HERO HEADER (SARVAM AI CLEAN HEADER - NO BACK BUTTON) */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-3">
          Brand
        </p>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 leading-[1.08]">
          Brand guidelines of CloseAI
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Guide on how to represent CloseAI&apos;s brand marks and assets.
        </p>
      </div>

      {/* HERO POSTER BANNER (SARVAM POSTER DESIGN) */}
      <div className="p-8 sm:p-14 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card mb-12 sm:mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-md">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 block">
            CloseAI Brand Kit
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
            Safe intelligence for everyone, everywhere.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            Our geometric continuous knot symbolizes open collaboration, equilibrium, and mathematical safety in autonomous systems.
          </p>
          <Button
            asChild
            className="group rounded-full h-12 px-4 bg-foreground text-background hover:opacity-80 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center font-medium text-base"
          >
            <a href="/closeai-brand-kit.zip" download="closeai-brand-kit.zip">
              <span>Download Kit</span>
            </a>
          </Button>
        </div>

        <div className="w-full md:w-80 h-56 rounded-2xl bg-secondary flex items-center justify-center p-8 shrink-0">
          <img
            src="/closeai-new.png"
            alt="CloseAI Logo Banner"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain dark:hidden"
          />
          <img
            src="/closeai-new-white.png"
            alt="CloseAI Logo Banner"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain hidden dark:block"
          />
        </div>
      </div>

      {/* METADATA BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card mb-16 sm:mb-24 text-xs">
        <div>
          <span className="text-muted-foreground block mb-1">Standard Version</span>
          <span className="font-semibold text-foreground text-sm">CloseAI v2.0</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Last Updated</span>
          <span className="font-semibold text-foreground text-sm">October 2026</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Color Governance</span>
          <span className="font-semibold text-foreground text-sm">Monochrome Only</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">License Type</span>
          <span className="font-semibold text-foreground text-sm">Commercial &amp; Editorial</span>
        </div>
      </div>

      {/* 2. BRAND ESSENCE */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Pillars
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Brand Essence
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
            CloseAI represents the union of mathematical rigour and autonomous benevolence. We design intelligent models and infrastructure intended to empower researchers, developers, and global enterprise operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <h3 className="text-base font-semibold text-foreground mb-2">Safety First</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Formal alignment verification and robust guardrails are engineered into every agentic primitive.
            </p>
          </div>
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <h3 className="text-base font-semibold text-foreground mb-2">Broad Benefit</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Accessible, high-throughput intelligence deployed for all humanity without closed silos.
            </p>
          </div>
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <h3 className="text-base font-semibold text-foreground mb-2">Long-term Focus</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Prioritizing systemic safety, capability, and alignment over fleeting product trends.
            </p>
          </div>
        </div>
      </section>

      {/* 3. BRAND VOICE */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Tone
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Brand Voice
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
            Our tone of voice is direct, calm, precise, and understated. We avoid technical hyperbole, buzzwords, and marketing sensationalism.
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-base block mb-0.5">Precise and Empirical</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">State capabilities accurately and highlight limitations honestly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-base block mb-0.5">Understated Gravity</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Let technical breakthroughs speak for themselves without exclamation marks.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-base block mb-0.5">Universal Accessibility</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Present complex alignment concepts in lucid, human-readable prose.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORDMARK STANDARDS */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Typography
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Wordmark Standards
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Approved typographic signatures and strict misuse prevention.
          </p>
        </div>

        {/* Approved Wordmark 3-Card Showcase (Generous Height) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-foreground text-background flex items-center justify-center p-6">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight select-none font-sans">
                CloseAI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">Solid White</h3>
              <p className="text-xs text-muted-foreground mt-0.5">High-contrast on light surfaces</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground select-none font-sans">
                CloseAI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">Standard Wordmark</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Primary light/dark mode typography</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-black text-white flex items-center justify-center p-6">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight select-none font-sans">
                CloseAI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">Solid Black</h3>
              <p className="text-xs text-muted-foreground mt-0.5">High-contrast on dark surfaces</p>
            </div>
          </div>
        </div>

        {/* Wordmark Incorrect Usage Grid (6 Generous Cards with proper X badge) */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Incorrect Wordmark Usage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <div className="flex items-center gap-2.5">
                  <img src="/closeai-new.png" alt="Mark" className="w-8 h-8 object-contain dark:hidden" />
                  <img src="/closeai-new-white.png" alt="Mark" className="w-8 h-8 object-contain hidden dark:block" />
                  <span className="text-2xl font-semibold tracking-tight text-foreground">CloseAI</span>
                </div>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not lock up with symbol</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-end p-0 relative overflow-hidden">
                <span className="text-3xl font-semibold tracking-tight text-foreground translate-x-8">CloseAI</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center z-10">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not crop the wordmark</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <span className="text-2xl font-semibold tracking-tight text-foreground -rotate-12">CloseAI</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not rotate the wordmark</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <span className="text-2xl font-semibold tracking-tight">
                  <span className="text-background">Close</span>
                  <span className="text-foreground">AI</span>
                </span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not use unapproved colors</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <span className="text-2xl font-semibold tracking-tight text-foreground scale-x-150 inline-block">CloseAI</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not alter proportions</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <span className="text-2xl font-semibold tracking-tight text-foreground [filter:drop-shadow(3px_4px_4px_rgba(0,0,0,0.6))]">CloseAI</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not add drop shadows</p>
            </div>
          </div>
        </div>

        {/* Wordmark Rules List with Check Badges */}
        <div className="p-8 sm:p-10 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">PascalCase Format</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Always write CloseAI as one continuous word with an uppercase C and uppercase AI.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">Vector Rendering</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Always use production SVG kits rather than attempting to re-type with custom fonts.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">Monochrome Contrast</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Use pure black on white canvases and pure white on black canvases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EMBLEM & KNOT MARK */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Symbol
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Emblem &amp; Knot Mark
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            The continuous 8-loop blossom geometry and squircle badge rules.
          </p>
        </div>

        {/* Approved Emblem 3-Card Showcase (Generous Height) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
            <div className="h-44 sm:h-52 rounded-2xl bg-white flex items-center justify-center p-6 border border-border/80">
              <img
                src="/closeai-new.png"
                alt="CloseAI Black Emblem"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">Black on Light</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Light interface logomark</p>
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
              <h3 className="text-base font-semibold text-foreground">App Squircle</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mobile, Desktop, and PWA manifest container</p>
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
              <h3 className="text-base font-semibold text-foreground">White on Dark</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Dark interface logomark</p>
            </div>
          </div>
        </div>

        {/* Emblem Incorrect Usage Grid (6 Generous Cards with proper badges) */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Incorrect Emblem Usage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <img src="/closeai-new.png" alt="Distorted" className="w-14 h-14 object-contain scale-y-50 dark:hidden" />
                <img src="/closeai-new-white.png" alt="Distorted" className="w-14 h-14 object-contain scale-y-50 hidden dark:block" />
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not alter or squish symbol</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <div className="flex items-center gap-2 opacity-80">
                  <img src="/closeai-new.png" alt="Locked" className="w-7 h-7 object-contain dark:hidden" />
                  <img src="/closeai-new-white.png" alt="Locked" className="w-7 h-7 object-contain hidden dark:block" />
                  <span className="text-lg font-semibold text-foreground">CloseAI</span>
                </div>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not lock up with wordmark</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-muted/90 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                <img src="/closeai-new.png" alt="Busy" className="w-14 h-14 object-contain dark:hidden relative z-10" />
                <img src="/closeai-new-white.png" alt="Busy" className="w-14 h-14 object-contain hidden dark:block relative z-10" />
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center z-20">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Do not place on busy backgrounds</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <div className="p-4 rounded-xl bg-card border border-dashed border-border">
                  <img src="/closeai-new.png" alt="Clear space" className="w-10 h-10 object-contain dark:hidden" />
                  <img src="/closeai-new-white.png" alt="Clear space" className="w-10 h-10 object-contain hidden dark:block" />
                </div>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Maintain minimum clear space</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-card border border-border/80 dark:border-none flex items-center justify-center p-6 relative">
                <img src="/closeai-new.png" alt="Contrast" className="w-12 h-12 object-contain dark:hidden" />
                <img src="/closeai-new-white.png" alt="Contrast" className="w-12 h-12 object-contain hidden dark:block" />
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Use approved high contrast</p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center p-6 relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border/80 dark:border-none bg-card flex items-center justify-center p-3">
                  <img src="/closeai-new.png" alt="Proportional 1:1" className="w-12 h-12 object-contain dark:hidden" />
                  <img src="/closeai-new-white.png" alt="Proportional 1:1" className="w-12 h-12 object-contain hidden dark:block" />
                </div>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">Preserve 1:1 square ratio</p>
            </div>
          </div>
        </div>

        {/* Emblem Rules List with Check Badges */}
        <div className="p-8 sm:p-10 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">Geometric Integrity</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Never alter the 8-loop interlaced geometry or stroke weights.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">Square Aspect Ratio</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Preserve the 1:1 proportional bounding container at all times.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <strong className="text-foreground text-sm sm:text-base block mb-0.5">Chat Favicons</strong>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">In dark and chat windows, use transparent background with pure white emblem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLEAR SPACE & SIZING */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Clearance
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Clear Space &amp; Sizing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Geometric clearance formulas and minimum size constraints.
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-2xl p-10 sm:p-14 bg-secondary flex items-center justify-center">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] font-mono text-muted-foreground">
                0.5X Clear Space
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-mono text-muted-foreground">
                0.5X Clear Space
              </div>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-mono text-muted-foreground">
                0.5X
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[11px] font-mono text-muted-foreground">
                0.5X
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/80 dark:border-none">
                <img
                  src="/closeai-new.png"
                  alt="CloseAI Clear Space Measurement"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain dark:hidden"
                />
                <img
                  src="/closeai-new-white.png"
                  alt="CloseAI Clear Space Measurement"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain hidden dark:block"
                />
              </div>
            </div>

            <div className="space-y-5 text-sm sm:text-base text-muted-foreground">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  1.
                </div>
                <div>
                  <strong className="text-foreground text-base block mb-0.5">Clear Space Formula (0.5X)</strong>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clear space equals half the height of the mark on all four sides.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  2.
                </div>
                <div>
                  <strong className="text-foreground text-base block mb-0.5">Digital Favicons (16×16px)</strong>
                  <p className="text-xs sm:text-sm text-muted-foreground">Smallest permissible digital render for tab headers.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  3.
                </div>
                <div>
                  <strong className="text-foreground text-base block mb-0.5">App Headers (24×24px)</strong>
                  <p className="text-xs sm:text-sm text-muted-foreground">Standard navbar and header dimension.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  4.
                </div>
                <div>
                  <strong className="text-foreground text-base block mb-0.5">Physical Print (12mm)</strong>
                  <p className="text-xs sm:text-sm text-muted-foreground">Minimum physical print diameter for stationery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CO-BRANDING & PARTNERSHIPS */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Partnerships
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Co-Branding &amp; Partnerships
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rules for partner lockups, scaling symmetry, and hairline dividers.
          </p>
        </div>

        <div className="p-6 sm:p-14 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card space-y-8">
          <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-10 py-8 sm:py-10 px-4 rounded-2xl bg-secondary min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <img
                src="/closeai-new.png"
                alt="CloseAI"
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain dark:hidden"
              />
              <img
                src="/closeai-new-white.png"
                alt="CloseAI"
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain hidden dark:block"
              />
              <span className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                CloseAI
              </span>
            </div>
            <div className="w-px sm:w-[1.5px] h-6 sm:h-8 md:h-9 bg-foreground/40 shrink-0" />
            <span className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground shrink-0">
              Partner Brand
            </span>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Approved Lockup Format: CloseAI | Partner Brand
          </p>

          <div className="space-y-4 pt-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <strong className="text-foreground text-base block mb-0.5">Equal Visual Weight</strong>
                <p className="text-xs sm:text-sm text-muted-foreground">Both brand marks must maintain balanced optical proportions.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <strong className="text-foreground text-base block mb-0.5">Divider Line</strong>
                <p className="text-xs sm:text-sm text-muted-foreground">The vertical divider should use the hairline border color (#E5E5E5).</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div>
                <strong className="text-foreground text-base block mb-0.5">Independence</strong>
                <p className="text-xs sm:text-sm text-muted-foreground">Do not blend both logos into a single merged symbol.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Co-Branding Misuse Grid (6 Generous Cards with proper badges) */}
        <div className="mt-8 mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Incorrect &amp; Approved Partnership Usage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Disproportionate scale */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center gap-3 p-6 relative">
                <span className="text-2xl font-bold text-foreground">CloseAI</span>
                <div className="w-[1px] h-8 bg-foreground/40" />
                <span className="text-xs text-muted-foreground">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Do not scale disproportionately
              </p>
            </div>

            {/* 2. Colored background */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl sm:rounded-sm bg-card flex items-center justify-center gap-3 p-6 relative border border-foreground/40">
                <span className="text-base font-semibold text-foreground">CloseAI</span>
                <div className="w-[1px] h-6 bg-foreground/40" />
                <span className="text-base font-semibold text-foreground">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Do not use colored backgrounds
              </p>
            </div>

            {/* 3. Busy background */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-muted/90 flex items-center justify-center gap-3 p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                <span className="text-base font-semibold text-foreground relative z-10">CloseAI</span>
                <div className="w-[1px] h-6 bg-foreground/40 relative z-10" />
                <span className="text-base font-semibold text-foreground relative z-10">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center z-20">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Do not place on busy backgrounds
              </p>
            </div>

            {/* 4. Approved dark lockup */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-black text-white flex items-center justify-center gap-3.5 p-6 relative">
                <img
                  src="/closeai-new-white.png"
                  alt="CloseAI"
                  className="w-5 h-5 object-contain"
                />
                <span className="text-base font-semibold tracking-tight">CloseAI</span>
                <div className="w-[1px] h-6 bg-white/40" />
                <span className="text-base font-semibold tracking-tight">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Approved high-contrast dark lockup
              </p>
            </div>

            {/* 5. Approved optical balance */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-secondary flex items-center justify-center gap-3.5 p-6 relative">
                <img
                  src="/closeai-new.png"
                  alt="CloseAI"
                  className="w-5 h-5 object-contain dark:hidden"
                />
                <img
                  src="/closeai-new-white.png"
                  alt="CloseAI"
                  className="w-5 h-5 object-contain hidden dark:block"
                />
                <span className="text-base font-semibold tracking-tight text-foreground">CloseAI</span>
                <div className="w-[1px] h-6 bg-foreground/40" />
                <span className="text-base font-semibold tracking-tight text-foreground">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Approved symmetrical optical balance
              </p>
            </div>

            {/* 6. Approved standard light lockup */}
            <div className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between">
              <div className="h-44 sm:h-52 rounded-2xl bg-white text-black border border-border/80 flex items-center justify-center gap-3.5 p-6 relative">
                <img
                  src="/closeai-new.png"
                  alt="CloseAI"
                  className="w-5 h-5 object-contain"
                />
                <span className="text-base font-semibold tracking-tight text-black">CloseAI</span>
                <div className="w-[1.5px] h-6 bg-black/40" />
                <span className="text-base font-semibold tracking-tight text-black">Partner</span>
                <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-3">
                Approved standard light lockup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. GUIDELINES FOR LOGOS (CORE DO'S & DON'TS TWO-COLUMN SECTION) */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Standards
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Guidelines for Logos
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Please adhere to these foundational principles when referencing CloseAI marks in product integrations, editorial content, and marketing communications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 p-8 sm:p-14 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card">
          {/* DO's COLUMN */}
          <div>
            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Do&apos;s</h3>
            </div>
            <ul className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Use official assets:</strong> Always download the provided vector SVG or high-resolution PNG files directly from our brand package.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Maintain clear space:</strong> Ensure minimum clearance equal to 0.5X the height of the mark on all four sides.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Spell CloseAI consistently:</strong> Format as a single PascalCase proper noun with uppercase C and uppercase AI.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Maintain scale symmetry:</strong> Keep proportional balance between the logomark and surrounding interface elements.
                </span>
              </li>
            </ul>
          </div>

          {/* DONT's COLUMN */}
          <div>
            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-border/60">
              <div className="w-7 h-7 rounded-full bg-background text-foreground border border-border/80 dark:border-none flex items-center justify-center shrink-0">
                <X className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Dont&apos;s</h3>
            </div>
            <ul className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Do not alter or recreate:</strong> Never skew, stretch, rotate, redraw, or change the stroke weights of the continuous knot.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Do not lock up marks:</strong> Never combine the knot symbol and wordmark together into a crowded compound logo.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Do not imply endorsement:</strong> Never place our marks in a manner that suggests partnership or sponsorship without prior written authorization.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong className="text-foreground">Do not use unapproved colors:</strong> Never apply gradients, drop shadows, outlines, or unauthorized accent hues to our marks.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 9. COLOR PALETTE */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Color
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Color Palette
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monochrome palette ensuring high accessibility and visual purity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brandColors.map((color, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between"
            >
              <div>
                <div className={`w-full h-20 rounded-xl mb-4 ${color.className}`} />
                <h3 className="text-base font-semibold text-foreground mb-1">{color.name}</h3>
                <p className="text-xs text-muted-foreground leading-normal mb-3">{color.role}</p>
              </div>
              <div className="pt-3 border-t border-border/60 text-xs font-mono text-muted-foreground">
                {color.hex}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. BRAND SUPPORT & INQUIRIES */}
      <section className="mb-16 sm:mb-24 pt-8 border-t border-border/80">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-2">
            Support
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Brand Support &amp; Inquiries
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Have questions about using our brand kit, or seeking co-marketing permissions? Our media, brand and support
            teams are here to assist you.{' '}
            <Link
              href="/support/help"
              className="rounded-full text-foreground transition-opacity hover:opacity-80 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <span>Learn more</span>
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {supportChannels.map((channel, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-2xl sm:rounded-sm border border-border/80 dark:border-none bg-card flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <channel.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {channel.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                  {channel.description}
                </p>
              </div>
              <div className="pt-4 border-t border-border/80">
                <a
                  href={channel.href}
                  className="text-sm font-normal rounded-full text-foreground transition-opacity hover:opacity-80 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <span>{channel.contact}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
