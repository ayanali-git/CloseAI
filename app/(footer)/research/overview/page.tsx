'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatedArrow } from '@/components/ui/animated';
import { Sparkles, Brain, Cpu, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function ResearchOverviewPage() {
  const { user } = useAuth();
  const researchPapers = [
    {
      title: "Frontier Reasoning with Hierarchical Self-Consistency Chains",
      authors: "closeAI Research Team",
      date: "August 2026",
      tag: "Reasoning",
      abstract: "We introduce a novel architecture for multi-turn deductive reasoning that evaluates candidate proof steps through parallel search trees.",
    },
    {
      title: "Multimodal Video Perception and Spatiotemporal Action Grounding",
      authors: "Vision Intelligence Lab",
      date: "July 2026",
      tag: "Multimodal",
      abstract: "Exploring continuous high-frame-rate frame representations for complex spatial manipulation and dynamic camera reasoning.",
    },
    {
      title: "Self-Verifiable Code Synthesis Across Polyglot Codebases",
      authors: "Codex Foundations",
      date: "June 2026",
      tag: "Code & Math",
      abstract: "Achieving state-of-the-art benchmarks on SWE-bench through automated linting, test synthesis, and iterative sandbox execution.",
    },
    {
      title: "Provable Alignment & Red Teaming for Autonomous Agents",
      authors: "Safety & Alignment Group",
      date: "May 2026",
      tag: "Safety",
      abstract: "Formulating formal safety bounds and guardrail boundaries for tool-augmented agents operating in high-stakes environments.",
    },
  ];

  return (
    <div className="py-20 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <p className="text-base font-semibold text-muted-foreground tracking-wider uppercase mb-3">
          closeAI Research
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
          Pioneering safe, beneficial artificial general intelligence.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Our research focuses on frontier reasoning architectures, multimodal understanding, and verifiable alignment systems that empower human potential.
        </p>
      </div>

      {/* Hero Research Spotlight */}
      <div className="rounded-sm border border-border/80 dark:border-none bg-gradient-to-br from-indigo-950/40 via-card to-background p-8 sm:p-12 mb-16">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-base font-semibold uppercase tracking-wider text-indigo-400">
            Featured Breakthrough
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
          GPT-6 Astra: The Next Paradigm in Multistep Deductive Inference
        </h2>
        <p className="text-muted-foreground text-base sm:text-base max-w-2xl mb-8 leading-relaxed">
          Delivering 3x faster chain-of-thought verification with 94.2% accuracy on competitive Olympiad mathematics and complex algorithmic engineering benchmarks.
        </p>
        <Link
          href={user ? "/c" : "/gc"}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center text-base font-semibold text-foreground"
        >
          <span>Try it now</span>
          <AnimatedArrow size={18} />
        </Link>
      </div>

      {/* Publications Index */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Selected Publications
          </h2>
          <span className="text-base text-muted-foreground">Updated August 2026</span>
        </div>

        <div className="space-y-6">
          {researchPapers.map((paper, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border/80 dark:border-none bg-card transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] font-semibold tracking-wider uppercase bg-secondary px-2.5 py-1 rounded-full text-foreground">
                  {paper.tag}
                </span>
                <span className="text-base text-muted-foreground">{paper.date}</span>
              </div>
              <h3 className="text-xl font-semibold text-muted-foreground group-hover:text-foreground mb-2">
                {paper.title}
              </h3>
              <p className="text-base text-muted-foreground mb-4 leading-relaxed">
                {paper.abstract}
              </p>
              <p className="text-base text-muted-foreground font-mono">{paper.authors}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
