'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatedArrow } from '@/components/ui/animated';
import { Globe, HeartHandshake, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FoundationPage() {
  const initiatives = [
    {
      icon: GraduationCap,
      title: "Global Academic Grants",
      description: "Providing compute credits, model API access, and mentoring grants to university researchers, doctoral fellows, and STEM non-profits globally.",
    },
    {
      icon: HeartHandshake,
      title: "Public Interest & Healthcare AI",
      description: "Supporting open-source research in genomic analysis, epidemiology, disaster relief modeling, and accessibility technologies.",
    },
    {
      icon: Globe,
      title: "Open Model Weights & Benchmarks",
      description: "Releasing open-weight baseline models, evaluation harnesses, and synthetic research datasets for public academic inquiry.",
    },
  ];

  return (
    <div className="py-20 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-3">
          closeAI Foundation
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
          Advancing AI for the benefit of humanity.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          The closeAI Foundation supports open academic research, educational accessibility, and community grants to ensure frontier intelligence elevates society.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {initiatives.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-8 rounded-3xl border border-border/80 dark:border-none bg-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-md text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grant Application Box */}
      <div className="rounded-3xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-10 sm:p-20 text-center flex flex-col items-center">
        <h2 className="text-4xl sm:text-5xl font-semibold text-foreground mb-4">
          Apply for funding and mentorship
        </h2>
        <p className="text-muted-foreground text-md max-w-lg mb-8">
          Researchers and educational institutions can apply for subsidized API access and direct engineering mentorship.
        </p>
        <Button asChild className="group rounded-full px-4 h-12 text-md font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer">
          <Link href="/company/contact" className="flex items-center">
            <span>Submit Proposal</span>
            <AnimatedArrow size={18} strokeWidth={2.5} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
