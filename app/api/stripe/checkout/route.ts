import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';
import {
    stripe,
    PLAN_PRICES,
    getOrCreateCustomer,
    createCheckoutSession
} from '@/lib/stripe';
import { getAppUrl } from '@/lib/url';

export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, interval } = await request.json();

        // Validate plan
        if (!plan || !['pro', 'ultra'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Validate interval
        if (!interval || !['monthly', 'yearly'].includes(interval)) {
            return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
        }

        // Get price ID
        const priceId = PLAN_PRICES[plan as keyof typeof PLAN_PRICES][interval as 'monthly' | 'yearly'];
        if (!priceId) {
            return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
            user.id,
            user.email!,
            user.user_metadata?.name
        );

        // Update profile with customer ID
        await supabaseAdmin
            .from('profiles')
            .update({ customer_id: customerId })
            .eq('id', user.id);

        // Create checkout session
        const appUrl = getAppUrl(request);
        const session = await createCheckoutSession(
            customerId,
            priceId,
            user.id,
            `${appUrl}/product/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
            `${appUrl}/product/plans?canceled=true`
        );

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
