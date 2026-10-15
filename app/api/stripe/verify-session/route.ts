import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = request.nextUrl.searchParams.get('session_id');
        if (!sessionId) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Verify session belongs to this user
        if (session.metadata?.userId && session.metadata.userId !== user.id) {
            return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
        }

        let subscription: any = session.subscription;
        if (typeof subscription === 'string') {
            subscription = await stripe.subscriptions.retrieve(subscription);
        }

        if (!subscription) {
            return NextResponse.json({ error: 'No subscription associated with session' }, { status: 400 });
        }

        const priceId = subscription.items.data[0]?.price?.id;
        const planName = getPlanFromPriceId(priceId);
        const customerId = session.customer as string;

        // Update profile
        await supabaseAdmin
            .from('profiles')
            .update({
                plan: planName,
                subscription_status: 'active',
                subscription_id: subscription.id,
                customer_id: customerId,
            })
            .eq('id', user.id);

        // Upsert subscription record
        await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: customerId,
                status: 'active',
                plan_name: planName,
                current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
                onConflict: 'stripe_subscription_id',
            });

        return NextResponse.json({
            success: true,
            plan: planName,
            status: 'active',
            subscriptionId: subscription.id,
        });
    } catch (error: any) {
        console.error('Verify session error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
    }
}
