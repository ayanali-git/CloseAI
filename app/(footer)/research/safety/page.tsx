'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatedArrow } from '@/components/ui/animated';
import { Shield, Lock, Eye, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function SafetyPage() {
  const safetyPillars = [
    {
      icon: Shield,
      title: "Verifiable Alignment",
      description:
        "We develop rigorous mathematical guardrails, automated red-teaming harnesses, and policy distillation to ensure models act predictably and safely.",
    },
    {
      icon: Lock,
      title: "Enterprise Privacy by Design",
      description:
        "Zero data retention on enterprise APIs. Customer data is strictly never used for training foundation models without explicit contractual permission.",
    },
    {
      icon: Eye,
      title: "Transparency & Governance",
      description:
        "We regularly publish system cards, safety evaluations, vulnerability disclosure programs, and third-party independent audit findings.",
    },
    {
      icon: CheckCircle2,
      title: "Autonomous Agent Safeguards",
      description:
        "Hardware-isolated sandboxing, human-in-the-loop approvals for sensitive actions, and continuous permission boundaries.",
    },
  ];

  return (
    <div className="py-20 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-3">
          Safety & Alignment
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
          Building safety directly into the foundation.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          As AI systems advance in capability, maintaining verifiable safety, alignment, and robust user safeguards is our highest imperative.
        </p>
      </div>

      {/* Grid of Safety Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {safetyPillars.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <div
              key={i}
              className="p-8 rounded-3xl border border-border/80 dark:border-none bg-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {pillar.title}
                </h3>
                <p className="text-md text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="rounded-3xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-10 sm:p-20 text-center flex flex-col items-center">
        <h2 className="text-4xl sm:text-5xl font-semibold text-foreground mb-3">
          Review our System Cards
        </h2>
        <p className="text-muted-foreground text-md max-w-lg mb-6">
          Detailed technical reports on training mitigations, bias benchmarks, and safety evaluation suites across our model family.
        </p>
        <Link
          href="/research/overview"
          className="group inline-flex items-center rounded-full px-4 h-12 text-md font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-opacity cursor-pointer"
        >
          <span>Explore here</span>
          <AnimatedArrow size={18} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
