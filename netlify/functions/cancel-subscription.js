// Netlify Function: /api/cancel-subscription
// Cancels a Stripe subscription at the end of the current billing period

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Service not configured' }) };
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        const { userId } = JSON.parse(event.body);

        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId' }) };
        }

        // Get user's subscription from Supabase
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_subscription_id, subscription_plan')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.stripe_subscription_id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No active subscription found' }) };
        }

        // Cancel at period end (user keeps access until billing cycle ends)
        const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
            cancel_at_period_end: true
        });

        // Update Supabase to reflect pending cancellation
        await supabase.from('profiles').update({
            subscription_status: 'canceling',
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
        }).eq('id', userId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                endsAt: new Date(subscription.current_period_end * 1000).toISOString()
            })
        };

    } catch (error) {
        console.error('Cancel error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message || 'Failed to cancel subscription' })
        };
    }
};
