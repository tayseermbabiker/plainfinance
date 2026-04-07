// Netlify Function: /api/upgrade-subscription
// Upgrades an existing Stripe subscription (prorated)

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

    const PRICE_IDS = {
        owner_monthly: process.env.STRIPE_PRICE_OWNER_MONTHLY,
        owner_annual: process.env.STRIPE_PRICE_OWNER_ANNUAL
    };

    try {
        const { userId, plan, billing } = JSON.parse(event.body);

        if (!userId || !plan || !billing) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId, plan, or billing' }) };
        }

        // Get user's current subscription from Supabase
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_subscription_id, subscription_plan')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.stripe_subscription_id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No active subscription found' }) };
        }

        // Get new price ID
        const priceKey = `${plan}_${billing}`;
        const newPriceId = PRICE_IDS[priceKey];

        if (!newPriceId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid plan selected' }) };
        }

        // Retrieve current subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

        if (subscription.status !== 'active') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Subscription is not active' }) };
        }

        // Update subscription with proration
        const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId
            }],
            proration_behavior: 'create_prorations'
        });

        // Supabase will be updated by the webhook (customer.subscription.updated)
        // but we can update immediately for a snappy UI
        const ownerPrices = [PRICE_IDS.owner_monthly, PRICE_IDS.owner_annual];
        const newPlan = ownerPrices.includes(newPriceId) ? 'owner' : 'free';

        await supabase.from('profiles').update({
            subscription_plan: newPlan,
            subscription_status: updated.status
        }).eq('id', userId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true, plan: newPlan })
        };

    } catch (error) {
        console.error('Upgrade error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message || 'Failed to upgrade subscription' })
        };
    }
};
