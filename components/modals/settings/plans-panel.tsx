"use client";

import { useState } from "react";
import { Check, Loader } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import toast from "@/lib/toast";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Core intelligence for everyday questions.",
    features: [
      "10 AI conversations / day",
      "5 image generations / day",
      "Basic file analysis",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    yearlyPrice: 999,
    description: "Unlimited chats and faster responses.",
    features: [
      "Unlimited AI conversations",
      "100 image generations / day",
      "Priority inference speed",
    ],
  },
  {
    id: "ultra",
    name: "Ultra Pro",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    description: "Maximum limits and team workspaces.",
    features: [
      "Everything in Pro",
      "Unlimited image generations",
      "Dedicated support",
    ],
  },
] as const;

export function PlansPanel() {
  const { user, token } = useAuth();
  const {
    plan: currentPlan,
    interval: currentInterval,
    hasActiveSubscription,
    loading: subLoading,
  } = useSubscription();
  const [isYearly, setIsYearly] = useState(currentInterval === "yearly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error("Please log in to upgrade your plan");
      return;
    }
    setLoading(planId);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan: planId,
          interval: isYearly ? "yearly" : "monthly",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setLoading(null);
    }
  };

  const handleManage = async () => {
    if (!user) return;
    setLoading("manage");
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch("/api/stripe/portal", { method: "POST", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to open subscription portal");
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to open subscription portal");
      setLoading(null);
    }
  };

  if (subLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-8 w-40 rounded-2xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="h-24 rounded-2xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
        <div className="h-24 rounded-2xl bg-secondary/70 dark:bg-neutral-800/60 animate-pulse" />
        <div className="h-24 rounded-2xl bg-secondary/70 dark:bg-neutral-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Choose a plan that fits how you work.
        </p>
        <div className="flex items-center gap-2 shrink-0 py-1">
          <span className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
        </div>
      </div>

      {hasActiveSubscription ? (
        <button
          type="button"
          onClick={handleManage}
          disabled={loading === "manage"}
          className="h-10 px-4 rounded-sm border border-border/80 text-sm text-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-background cursor-pointer disabled:opacity-70 transition-all select-none"
        >
          {loading === "manage" ? (
            <Loader className="w-4 h-4 animate-spin inline" />
          ) : (
            "Manage subscription"
          )}
        </button>
      ) : null}

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isCurrent =
            currentPlan === plan.id &&
            (plan.id === "free"
              ? !hasActiveSubscription || currentPlan === "free"
              : isYearly
              ? currentInterval === "yearly"
              : currentInterval !== "yearly");
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-border/80 dark:border-none p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-medium text-foreground">
                    {plan.name}{" "}
                    {isCurrent ? (
                      <span className="text-xs text-muted-foreground font-normal">
                      · Current
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
                <p className="text-[15px] font-medium text-foreground shrink-0">
                  ₹{price}
                  {plan.id !== "free" ? (
                    <span className="text-sm text-muted-foreground font-normal">
                      /{isYearly ? "yr" : "mo"}
                    </span>
                  ) : null}
                </p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isCurrent || plan.id === "free" ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-10 rounded-full border border-border/80 text-sm text-muted-foreground cursor-not-allowed"
                >
                  {isCurrent ? "Current plan" : "Free plan"}
                </button>
              ) : currentPlan === "ultra" && plan.id === "pro" ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-10 rounded-full border border-border/80 text-sm text-muted-foreground cursor-not-allowed"
                >
                  Included in Ultra Pro
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading !== null}
                  className="w-full h-10 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-background cursor-pointer disabled:opacity-70 flex items-center justify-center transition-all select-none"
                >
                  {loading === plan.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
