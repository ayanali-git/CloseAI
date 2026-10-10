'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface UsageLimits {
    dailyMessages: number;
    dailyImageGenerations: number;
    maxFileSize: number;
    canUploadFiles: boolean;
}

interface UsageStats {
    messages: {
        used: number;
        limit: number;
        remaining: number;
    };
    images: {
        used: number;
        limit: number;
        remaining: number;
    };
}

interface SubscriptionContextType {
    plan: string;
    status: string;
    hasActiveSubscription: boolean;
    interval: 'monthly' | 'yearly';
    limits: UsageLimits;
    usage: UsageStats;
    loading: boolean;
    refreshSubscription: () => Promise<void>;
    canUseFeature: (feature: 'messages' | 'images' | 'files') => boolean;
    getRemainingUsage: (feature: 'messages' | 'images') => number;
}

const defaultLimits: UsageLimits = {
    dailyMessages: 10,
    dailyImageGenerations: 5,
    maxFileSize: 10 * 1024 * 1024,
    canUploadFiles: true,
};

const defaultUsage: UsageStats = {
    messages: { used: 0, limit: 10, remaining: 10 },
    images: { used: 0, limit: 5, remaining: 5 },
};

const SubscriptionContext = createContext<SubscriptionContextType>({
    plan: 'free',
    status: 'inactive',
    hasActiveSubscription: false,
    interval: 'monthly',
    limits: defaultLimits,
    usage: defaultUsage,
    loading: true,
    refreshSubscription: async () => { },
    canUseFeature: () => true,
    getRemainingUsage: () => 0,
});

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

function getInitialPlan(): string {
    if (typeof window !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)user_plan=([^;]+)/);
        if (match && match[1]) {
            const val = decodeURIComponent(match[1]).trim();
            if (val) return val;
        }
    }
    return 'free';
}

function persistPlanCookie(newPlan: string) {
    if (typeof document !== 'undefined') {
        if (!newPlan || newPlan === 'free') {
            document.cookie = 'user_plan=; path=/; max-age=0; SameSite=Lax';
        } else {
            document.cookie = `user_plan=${encodeURIComponent(newPlan)}; path=/; max-age=31536000; SameSite=Lax`;
        }
    }
}

export function SubscriptionProvider({
    children,
    initialPlan = 'free',
}: {
    children: React.ReactNode;
    initialPlan?: string;
}) {
    const { user, token, loading: authLoading } = useAuth();
    const [plan, setPlan] = useState<string>(() => {
        if (initialPlan && initialPlan !== 'free') return initialPlan;
        const cached = getInitialPlan();
        if (cached && cached !== 'free') return cached;
        return initialPlan || 'free';
    });
    const [status, setStatus] = useState(() => (plan !== 'free' ? 'active' : 'inactive'));
    const [hasActiveSubscription, setHasActiveSubscription] = useState(() => plan !== 'free');
    const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [limits, setLimits] = useState<UsageLimits>(defaultLimits);
    const [usage, setUsage] = useState<UsageStats>(defaultUsage);
    const [loading, setLoading] = useState(true);

    // Sync from cookie immediately on mount if initialPlan was free
    useEffect(() => {
        const cached = getInitialPlan();
        if (cached && cached !== 'free' && plan === 'free') {
            setPlan(cached);
            setStatus('active');
            setHasActiveSubscription(true);
        }
    }, [plan]);

    const fetchSubscription = useCallback(async () => {
        // While auth is still initializing, DO NOT reset plan or delete cookies!
        if (authLoading) {
            return;
        }

        // Only when auth has finished loading AND user is null (definitely logged out):
        if (!user) {
            setPlan('free');
            setStatus('inactive');
            setHasActiveSubscription(false);
            setInterval('monthly');
            setLimits(defaultLimits);
            setUsage(defaultUsage);
            setLoading(false);
            persistPlanCookie('free');
            return;
        }

        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/subscription', { headers });

            if (response.ok) {
                const data = await response.json();
                const currentPlan = data.plan || 'free';
                setPlan(currentPlan);
                setStatus(data.status || 'inactive');
                setHasActiveSubscription(data.hasActiveSubscription || false);
                setInterval(data.interval || 'monthly');
                setLimits(data.limits || defaultLimits);
                setUsage(data.usage || defaultUsage);
                persistPlanCookie(currentPlan);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    }, [user, token, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchSubscription();
        }
    }, [fetchSubscription, authLoading]);

    // Real-time subscription to profile changes (for when webhook updates the plan)
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`profile-changes-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload: any) => {
                    if (payload?.new?.plan) {
                        const newPlan = payload.new.plan;
                        setPlan(newPlan);
                        setStatus(payload.new.subscription_status || 'active');
                        setHasActiveSubscription(newPlan !== 'free');
                        persistPlanCookie(newPlan);
                    }
                    fetchSubscription();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchSubscription]);

    // Focus listener to re-sync when tab becomes active
    useEffect(() => {
        const handleFocus = () => {
            if (user && !authLoading) {
                fetchSubscription();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, authLoading, fetchSubscription]);

    const canUseFeature = useCallback((feature: 'messages' | 'images' | 'files'): boolean => {
        if (feature === 'files') {
            return limits.canUploadFiles;
        }
        if (feature === 'messages') {
            return limits.dailyMessages === -1 || usage.messages.remaining > 0;
        }
        if (feature === 'images') {
            return limits.dailyImageGenerations === -1 || usage.images.remaining > 0;
        }
        return true;
    }, [limits, usage]);

    const getRemainingUsage = useCallback((feature: 'messages' | 'images'): number => {
        if (feature === 'messages') {
            return limits.dailyMessages === -1 ? -1 : usage.messages.remaining;
        }
        return limits.dailyImageGenerations === -1 ? -1 : usage.images.remaining;
    }, [limits, usage]);

    const value = {
        plan,
        status,
        hasActiveSubscription,
        interval,
        limits,
        usage,
        loading,
        refreshSubscription: fetchSubscription,
        canUseFeature,
        getRemainingUsage,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export { SubscriptionContext };
