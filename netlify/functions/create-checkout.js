// Netlify Function: /api/create-checkout
// Creates a Stripe checkout session for subscription

exports.handler = async (event, context) => {
    // Handle CORS preflight
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

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

    if (!STRIPE_SECRET_KEY) {
        console.error('Stripe secret key not configured');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Payment service not configured' })
        };
    }

    // Price IDs from environment variables
    const PRICE_IDS = {
        owner_monthly: process.env.STRIPE_PRICE_OWNER_MONTHLY,
        owner_annual: process.env.STRIPE_PRICE_OWNER_ANNUAL,
        pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
        pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL
    };

    const stripe = require('stripe')(STRIPE_SECRET_KEY);

    try {
        const data = JSON.parse(event.body);
        const { plan, billing, userId, userEmail, successUrl, cancelUrl } = data;

        // Get price ID from plan and billing
        const priceKey = `${plan}_${billing}`;
        const priceId = PRICE_IDS[priceKey];

        if (!priceId) {
            console.error('Invalid plan/billing:', priceKey);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid plan selected' })
            };
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${event.headers.origin}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${event.headers.origin}/pricing.html`,
            customer_email: userEmail,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                plan: plan,
                billing: billing
            }
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                sessionId: session.id,
                url: session.url
            })
        };

    } catch (error) {
        console.error('Stripe error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message || 'Failed to create checkout session' })
        };
    }
};
