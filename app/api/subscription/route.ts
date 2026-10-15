import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';
import { subscriptionService } from '@/lib/subscription-service';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get profile with subscription info
        let { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('plan, subscription_status, customer_id, subscription_id')
            .eq('id', user.id)
            .maybeSingle();

        // If profile doesn't exist yet, auto-create a free profile
        if (!profile) {
            const userName = user.user_metadata?.full_name || 
                             user.user_metadata?.name || 
                             user.email?.split('@')[0] || '';
            const userAvatar = user.user_metadata?.avatar_url || 
                               user.user_metadata?.picture || null;

            const { data: newProfile } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    name: userName,
                    avatar_url: userAvatar,
                    plan: 'free',
                    subscription_status: 'inactive',
                }, { onConflict: 'id' })
                .select('plan, subscription_status, customer_id, subscription_id')
                .single();

            profile = newProfile;
        }

        // Auto-sync with Stripe to ensure plan is completely accurate even without webhooks
        let customerId = profile?.customer_id;
        if (!customerId && user.email) {
            try {
                const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
                if (existingCustomers.data.length > 0) {
                    customerId = existingCustomers.data[0].id;
                    await supabaseAdmin.from('profiles').update({ customer_id: customerId }).eq('id', user.id);
                    if (profile) profile.customer_id = customerId;
                }
            } catch (e) {
                console.warn('Customer lookup error:', e);
            }
        }

        let subscriptionInterval: 'monthly' | 'yearly' = 'monthly';

        if (customerId) {
            try {
                const stripeSubs = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1,
                });

                if (stripeSubs.data.length > 0) {
                    const activeSub = stripeSubs.data[0];
                    const priceId = activeSub.items.data[0]?.price?.id;
                    const syncedPlan = getPlanFromPriceId(priceId);
                    const subInterval = activeSub.items.data[0]?.price?.recurring?.interval;
                    subscriptionInterval = subInterval === 'year' ? 'yearly' : 'monthly';

                    if (profile?.plan !== syncedPlan || profile?.subscription_status !== 'active' || profile?.subscription_id !== activeSub.id) {
                        await supabaseAdmin
                            .from('profiles')
                            .update({
                                plan: syncedPlan,
                                subscription_status: 'active',
                                subscription_id: activeSub.id,
                                customer_id: customerId,
                            })
                            .eq('id', user.id);

                        await supabaseAdmin
                            .from('subscriptions')
                            .upsert({
                                user_id: user.id,
                                stripe_subscription_id: activeSub.id,
                                stripe_customer_id: customerId,
                                status: 'active',
                                plan_name: syncedPlan,
                                current_period_start: new Date(activeSub.items.data[0].current_period_start * 1000).toISOString(),
                                current_period_end: new Date(activeSub.items.data[0].current_period_end * 1000).toISOString(),
                                cancel_at_period_end: activeSub.cancel_at_period_end,
                            }, { onConflict: 'stripe_subscription_id' });

                        if (profile) {
                            profile.plan = syncedPlan;
                            profile.subscription_status = 'active';
                            profile.subscription_id = activeSub.id;
                        }
                    }
                } else if (profile?.subscription_status === 'active' && profile?.subscription_id) {
                    try {
                        const sub = await stripe.subscriptions.retrieve(profile.subscription_id);
                        if (sub.status !== 'active') {
                            await supabaseAdmin
                                .from('profiles')
                                .update({
                                    plan: 'free',
                                    subscription_status: sub.status,
                                })
                                .eq('id', user.id);
                            if (profile) {
                                profile.plan = 'free';
                                profile.subscription_status = sub.status;
                            }
                        } else {
                            const subInterval = sub.items.data[0]?.price?.recurring?.interval;
                            subscriptionInterval = subInterval === 'year' ? 'yearly' : 'monthly';
                        }
                    } catch (subErr) {
                        await supabaseAdmin
                            .from('profiles')
                            .update({
                                plan: 'free',
                                subscription_status: 'canceled',
                            })
                            .eq('id', user.id);
                        if (profile) {
                            profile.plan = 'free';
                            profile.subscription_status = 'canceled';
                        }
                    }
                }
            } catch (stripeErr) {
                console.warn('Stripe subscription sync warning:', stripeErr);
            }
        }

        const plan = profile?.plan || 'free';
        const limits = subscriptionService.getUsageLimits(plan);

        // Get usage stats
        const messageUsage = await subscriptionService.checkUsageLimit(user.id, 'messages');
        const imageUsage = await subscriptionService.checkUsageLimit(user.id, 'images');

        return NextResponse.json({
            plan,
            status: profile?.subscription_status || 'inactive',
            hasActiveSubscription: profile?.subscription_status === 'active' || (Boolean(profile?.plan) && profile?.plan !== 'free'),
            customerId: profile?.customer_id,
            interval: subscriptionInterval,
            limits,
            usage: {
                messages: {
                    used: limits.dailyMessages === -1 ? 0 : limits.dailyMessages - messageUsage.remaining,
                    limit: messageUsage.limit,
                    remaining: messageUsage.remaining,
                },
                images: {
                    used: limits.dailyImageGenerations === -1 ? 0 : limits.dailyImageGenerations - imageUsage.remaining,
                    limit: imageUsage.limit,
                    remaining: imageUsage.remaining,
                },
            },
        });
    } catch (error: any) {
        console.error('Subscription API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get subscription' },
            { status: 500 }
        );
    }
}
