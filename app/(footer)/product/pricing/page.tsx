'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatedArrow } from '@/components/ui/animated';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      description: "Experience core intelligence for everyday assistance and questions.",
      features: [
        "10 AI conversations / day",
        "5 image generations / day",
        "Basic document & file analysis",
        "Standard response speed",
        "Web search grounding",
      ],
      cta: "Get started",
      href: "/?auth=signup",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "₹99",
      period: "/month",
      description: "For professionals, engineers, and creators who need unlimited power.",
      features: [
        "Unlimited AI conversations",
        "100 image generations / day",
        "Advanced document & code analysis",
        "Priority fast inference speed",
        "Early access to reasoning models",
        "Custom instruction profiles",
      ],
      cta: "Start Pro",
      href: "/?auth=signup&plan=pro",
      popular: true,
    },
    {
      id: "ultra",
      name: "Ultra Pro",
      price: "₹199",
      period: "/month",
      description: "For teams and enterprises that require the ultimate in AI reasoning and collaboration.",
      features: [
        "Everything in Pro",
        "Unlimited image generations",
        "Team collaboration workspaces",
        "Fastest response throughput",
        "Full API developer access",
        "24/7 dedicated support",
      ],
      cta: "Choose Ultra Pro",
      href: "/?auth=signup&plan=ultra",
      popular: false,
    },
  ];

  return (
    <div className="py-20 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6">
          Simple, transparent pricing.
        </h1>
        <p className="text-lg text-muted-foreground">
          Start for free, then scale with limitless reasoning as your needs grow.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl p-8 flex flex-col justify-between border transition-all ${
              plan.popular
                ? "bg-card border-foreground/30 scale-[1.02]"
                : "bg-card/60 border-border/70"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-foreground text-background text-[15px] font-semibold tracking-wide uppercase">
                Most Popular
              </span>
            )}

            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-md text-muted-foreground min-h-[32px]">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-md text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-md font-semibold uppercase tracking-wider text-muted-foreground">
                  Included features
                </p>
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-md text-foreground">
                    <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              asChild
              className={`w-full h-11 rounded-full text-md font-medium transition-all ${
                plan.popular
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              <Link href={plan.href} className="group flex items-center justify-center">
                <span>{plan.cta}</span>
                <AnimatedArrow size={18} />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
