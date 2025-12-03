// Netlify Function: /api/stripe-webhook
// Handles Stripe webhook events for subscription updates

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
        console.error('Stripe keys not configured');
        return { statusCode: 500, body: 'Webhook not configured' };
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY);

    // Verify webhook signature
    const signature = event.headers['stripe-signature'];
    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    // Initialize Supabase client with service key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                if (userId && subscriptionId) {
                    // Get subscription details
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0]?.price?.id;

                    // Determine plan based on price ID
                    let plan = 'free';
                    if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) {
                        plan = 'professional';
                    } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
                        plan = 'premium';
                    }

                    // Update user profile
                    await supabase.from('profiles').update({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        subscription_plan: plan,
                        subscription_status: 'active',
                        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
                    }).eq('id', userId);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                const customerId = subscription.customer;

                // Find user by customer ID
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    const priceId = subscription.items.data[0]?.price?.id;
                    let plan = 'free';
                    if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) {
                        plan = 'professional';
                    } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
                        plan = 'premium';
                    }

                    await supabase.from('profiles').update({
                        subscription_plan: plan,
                        subscription_status: subscription.status,
                        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
                    }).eq('id', profile.id);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                const customerId = subscription.customer;

                // Find user and reset to free
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await supabase.from('profiles').update({
                        subscription_plan: 'free',
                        subscription_status: 'canceled',
                        subscription_ends_at: null
                    }).eq('id', profile.id);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };

    } catch (error) {
        console.error('Webhook handler error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
