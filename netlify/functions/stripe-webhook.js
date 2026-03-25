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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('Supabase keys not configured');
        return { statusCode: 500, body: 'Database not configured' };
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

    // Helper: safe timestamp conversion
    function safeTimestamp(unixSeconds) {
        if (!unixSeconds) return null;
        try {
            const date = new Date(unixSeconds * 1000);
            if (isNaN(date.getTime())) return null;
            return date.toISOString();
        } catch (e) {
            console.error('Invalid timestamp:', unixSeconds);
            return null;
        }
    }

    // Helper: determine plan from price ID
    function determinePlan(priceId) {
        const ownerPrices = [process.env.STRIPE_PRICE_OWNER_MONTHLY, process.env.STRIPE_PRICE_OWNER_ANNUAL];
        const proPrices = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_ANNUAL];
        if (ownerPrices.includes(priceId)) return 'owner';
        if (proPrices.includes(priceId)) return 'pro';
        return 'free';
    }

    // Helper: find user by customer ID or email
    async function findUser(customerId, customerEmail) {
        console.log('findUser called with:', { customerId, customerEmail });
        // Try by stripe_customer_id first
        if (customerId) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single();
            console.log('Lookup by customer_id:', { data, error: error?.message });
            if (data) return data;
        }
        // Fall back to email lookup
        if (customerEmail) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', customerEmail)
                .single();
            console.log('Lookup by email:', { data, error: error?.message });
            if (data) return data;
        }
        console.log('findUser: no user found');
        return null;
    }

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                if (userId && subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0]?.price?.id;
                    const plan = determinePlan(priceId);

                    await supabase.from('profiles').update({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        subscription_plan: plan,
                        subscription_status: 'active',
                        subscription_ends_at: safeTimestamp(subscription.current_period_end)
                    }).eq('id', userId);
                }
                break;
            }

            case 'customer.subscription.created': {
                const subscription2 = stripeEvent.data.object;
                const customerId2 = subscription2.customer;
                const priceId2 = subscription2.items.data[0]?.price?.id;
                const plan2 = determinePlan(priceId2);
                const debugInfo = { customerId: customerId2, priceId: priceId2, plan: plan2 };

                const customer2 = await stripe.customers.retrieve(customerId2);
                debugInfo.stripeEmail = customer2.email;

                // Try direct email update first — bypass findUser entirely
                const { data: directUpdate, error: directError } = await supabase
                    .from('profiles')
                    .update({
                        stripe_customer_id: customerId2,
                        subscription_plan: plan2,
                        subscription_status: 'active',
                        subscription_ends_at: safeTimestamp(subscription2.current_period_end)
                    })
                    .eq('email', customer2.email)
                    .select();

                debugInfo.directUpdate = directError ? `ERROR: ${directError.message}` : directUpdate;
                debugInfo.rowsUpdated = directUpdate ? directUpdate.length : 0;
                global._webhookDebug = debugInfo;
                break;
            }

            case 'invoice.payment_succeeded': {
                // Handles renewals and first payments
                const invoice = stripeEvent.data.object;
                const customerId = invoice.customer;
                const subscriptionId = invoice.subscription;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0]?.price?.id;
                    const plan = determinePlan(priceId);

                    const customer = await stripe.customers.retrieve(customerId);
                    const profile = await findUser(customerId, customer.email);

                    if (profile) {
                        await supabase.from('profiles').update({
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            subscription_plan: plan,
                            subscription_status: 'active',
                            subscription_ends_at: safeTimestamp(subscription.current_period_end)
                        }).eq('id', profile.id);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                // Mark subscription as past_due
                const invoice = stripeEvent.data.object;
                const customerId = invoice.customer;

                const customer = await stripe.customers.retrieve(customerId);
                const profile = await findUser(customerId, customer.email);

                if (profile) {
                    await supabase.from('profiles').update({
                        subscription_status: 'past_due'
                    }).eq('id', profile.id);
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
                    const ownerPrices = [process.env.STRIPE_PRICE_OWNER_MONTHLY, process.env.STRIPE_PRICE_OWNER_ANNUAL];
                    const proPrices = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_ANNUAL];

                    if (ownerPrices.includes(priceId)) {
                        plan = 'owner';
                    } else if (proPrices.includes(priceId)) {
                        plan = 'pro';
                    }

                    await supabase.from('profiles').update({
                        subscription_plan: plan,
                        subscription_status: subscription.status,
                        subscription_ends_at: safeTimestamp(subscription.current_period_end)
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

        return { statusCode: 200, body: JSON.stringify({ received: true, eventType: stripeEvent.type, debug: global._webhookDebug || 'no debug' }) };

    } catch (error) {
        console.error('Webhook handler error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
