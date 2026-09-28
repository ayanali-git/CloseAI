'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatedArrow } from '@/components/ui/animated';
import { Building2, ShieldCheck, Zap, Users, BarChart3, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EnterprisePage() {
  const enterpriseFeatures = [
    {
      icon: ShieldCheck,
      title: "Enterprise Data Privacy",
      description: "Dedicated isolated tenant architecture. Customer inputs and outputs are never retained or used to train models.",
    },
    {
      icon: Zap,
      title: "Unlimited High-Speed Inference",
      description: "Dedicated GPU clusters guarantee sub-second latency and custom rate limit allocations for critical workflows.",
    },
    {
      icon: Lock,
      title: "SSO & SCIM Provisioning",
      description: "SAML 2.0, Okta, Azure AD, and automated role-based access control with granular audit logging.",
    },
    {
      icon: Users,
      title: "Team Workspaces & Shared Canvas",
      description: "Collaborative prompt libraries, shared document indexing, and role-governed generative projects.",
    },
  ];

  return (
    <div className="py-20 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <p className="text-md font-semibold text-muted-foreground tracking-wider uppercase mb-3">
          closeAI for Business
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
          Supercharge your organization with frontier AI.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
          Empower your teams with industry-leading intelligence, enterprise security, and administrative governance designed for global scale.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" className="rounded-full h-12 px-4 bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white">
            <Link href="/product/pricing">View Pricing</Link>
          </Button>
          <Button asChild size="lg" className="group rounded-full h-12 px-4 bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-opacity cursor-pointer">
            <Link href="/company/contact" className="inline-flex items-center justify-center">
              <span>Contact Sales</span>
              <AnimatedArrow size={18} strokeWidth={2.5} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {enterpriseFeatures.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="p-8 rounded-3xl border border-border/80 dark:border-none bg-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-md text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Trust Banner */}
      <div className="rounded-3xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none p-10 sm:p-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-semibold text-foreground mb-4">
          Trusted by millions of users
        </h2>
        <p className="text-muted-foreground text-md max-w-lg mx-auto mb-8">
          Join thousands of enterprises transforming productivity with closeAI's secure reasoning infrastructure.
        </p>
        <Button asChild className="group rounded-full px-4 h-12 text-md font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.99] transition-opacity cursor-pointer">
          <Link href="/company/contact" className="flex items-center">
            <span>Schedule Demo</span>
            <AnimatedArrow size={18} strokeWidth={2.5} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
