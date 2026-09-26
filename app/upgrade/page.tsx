'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/components/subscription-provider';
import toast from '@/lib/toast';
import {
  ChevronLeft,
  Check,
  Loader
} from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Experience core intelligence for everyday assistance and questions.',
    features: [
      '10 AI conversations / day',
      '5 image generations / day',
      'Basic document & file analysis',
      'Standard response speed',
      'Web search grounding',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹99',
    monthlyPrice: 99,
    yearlyPrice: 999,
    originalAnnualPrice: 1175,
    discountPercent: 15,
    description: 'For professionals, engineers, and creators who need unlimited power.',
    features: [
      'Unlimited AI conversations',
      '100 image generations / day',
      'Advanced document & code analysis',
      'Priority fast inference speed',
      'Early access to reasoning models',
      'Custom instruction profiles',
    ],
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra Pro',
    price: '₹199',
    monthlyPrice: 199,
    yearlyPrice: 1999,
    originalAnnualPrice: 2351,
    discountPercent: 15,
    description: 'Maximum reasoning depth, limitless generations, and team workspaces.',
    features: [
      'Everything in Pro',
      'Unlimited image generations',
      'Team collaboration workspaces',
      'Fastest response throughput',
      'Full API developer access',
      '24/7 dedicated support',
    ],
    popular: false,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { plan: currentPlan, interval: currentInterval, hasActiveSubscription, refreshSubscription } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const hasProcessedSuccess = useRef(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      toast.success('Subscription successful! Your plan has been upgraded.');

      const syncSession = async () => {
        try {
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          if (sessionId) {
            await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`, { headers });
          }
        } catch (e) {
          console.error('Session sync error:', e);
        } finally {
          await refreshSubscription();
          setShowSuccessModal(true);
        }
      };

      syncSession();
      router.replace('/upgrade');
    } else if (canceled === 'true' && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      toast.error('Checkout was canceled.');
      router.replace('/upgrade');
    }
  }, [searchParams, router, refreshSubscription, token]);

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error('Please login to upgrade your plan');
      router.push('/?auth=login');
      return;
    }

    setLoading(planId);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan: planId,
          interval: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      router.push('/?auth=login');
      return;
    }

    setLoading('manage');

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open subscription portal');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open subscription portal');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="chat-selection-theme selection:bg-secondary selection:text-foreground min-h-screen bg-background">
      {/* Back Header */}
      <div className="border-b border-border sticky top-0 z-10 bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground cursor-pointer group/btn"
            onClick={() => router.push('/c')}
          >
            <ChevronLeft className="w-4 h-4 mr-1 text-muted-foreground group-hover/btn:text-foreground" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground mb-6">
            Upgrade your plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that best fits your workflow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-md ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-md ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Save 15%
              </span>
            </span>
          </div>

          {hasActiveSubscription && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full cursor-pointer disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-not-allowed"
                onClick={handleManageSubscription}
                disabled={loading === 'manage'}
              >
                {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id && (
              plan.id === 'free'
                ? !hasActiveSubscription || currentPlan === 'free'
                : (isYearly ? currentInterval === 'yearly' : currentInterval !== 'yearly')
            );
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between border transition-all ${
                  plan.popular || (isCurrentPlan && plan.id !== 'free')
                    ? "bg-card border-foreground/30"
                    : "bg-card/60 border-border/70"
                }`}
              >
                {isCurrentPlan ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-foreground text-background text-[15px] font-semibold tracking-wide uppercase">
                    Active Plan
                  </span>
                ) : plan.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-foreground text-background text-[15px] font-semibold tracking-wide uppercase">
                    Most Popular
                  </span>
                ) : null}

                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-md text-muted-foreground min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="flex flex-col mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                        ₹{price}
                      </span>
                      {plan.id !== 'free' && (
                        <span className="text-md text-muted-foreground">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {isYearly && plan.originalAnnualPrice ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm line-through text-muted-foreground">
                          ₹{plan.originalAnnualPrice}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          Save {plan.discountPercent}%
                        </span>
                      </div>
                    ) : null}
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

                <div>
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-full text-neutral-500 dark:text-neutral-400 font-medium border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-not-allowed"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : currentPlan === 'ultra' && plan.id === 'pro' && (!isYearly || currentInterval === 'yearly') ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-full text-neutral-500 dark:text-neutral-400 font-medium border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-not-allowed"
                      disabled
                    >
                      Included in Ultra Pro
                    </Button>
                  ) : plan.id === 'free' ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-full text-neutral-500 dark:text-neutral-400 font-medium border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#181818] disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-not-allowed"
                      disabled
                    >
                      Free Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full h-11 rounded-full text-md font-medium transition-all cursor-pointer ${
                        plan.popular
                          ? "bg-foreground text-background hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      } ${loading !== null ? 'disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-not-allowed' : ''}`}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loading !== null}
                    >
                      {loading === plan.id ? (
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Welcome to {currentPlan === 'ultra' ? 'Ultra Pro' : 'Pro'}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Your subscription is now active. You have full access to upgraded features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              className="w-full rounded-full"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/c');
              }}
            >
              Start Asking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}