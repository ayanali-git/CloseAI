import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';
import { createPortalSession } from '@/lib/stripe';
import { getAppUrl } from '@/lib/url';

export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get customer ID from profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('customer_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.customer_id) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            );
        }

        // Create portal session
        const appUrl = getAppUrl(request);
        const session = await createPortalSession(
            profile.customer_id,
            `${appUrl}/product/plans`
        );

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Portal error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create portal session' },
            { status: 500 }
        );
    }
}
