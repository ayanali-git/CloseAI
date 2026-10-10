import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';

// Create admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId || !subscriptionId) {
        console.error('Missing userId or subscriptionId in checkout session');
        return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const planName = getPlanFromPriceId(priceId);

    // Update profile
    await supabaseAdmin
        .from('profiles')
        .update({
            plan: planName,
            subscription_status: 'active',
            subscription_id: subscriptionId,
            customer_id: customerId,
        })
        .eq('id', userId);

    // Create or update subscription record
    await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: 'active',
            plan_name: planName,
            current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
            onConflict: 'stripe_subscription_id',
        });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const priceId = subscription.items.data[0]?.price.id;
    const planName = getPlanFromPriceId(priceId);

    // Map Stripe status to our status
    let status = subscription.status;
    if (status === 'trialing') status = 'active';

    // Update profile if we have userId
    if (userId) {
        await supabaseAdmin
            .from('profiles')
            .update({
                plan: status === 'active' ? planName : 'free',
                subscription_status: status,
            })
            .eq('id', userId);
    }

    // Update subscription record
    await supabaseAdmin
        .from('subscriptions')
        .update({
            status,
            plan_name: planName,
            current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    // Update profile to free plan
    if (userId) {
        await supabaseAdmin
            .from('profiles')
            .update({
                plan: 'free',
                subscription_status: 'canceled',
                subscription_id: null,
            })
            .eq('id', userId);
    }

    // Update subscription record
    await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find user by customer ID
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('customer_id', customerId)
        .single();

    if (profile) {
        // Update subscription status
        await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);
    }
}
