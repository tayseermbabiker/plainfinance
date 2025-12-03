// Netlify Function: /api/create-checkout
// Creates a Stripe checkout session for subscription

exports.handler = async (event, context) => {
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

    const stripe = require('stripe')(STRIPE_SECRET_KEY);

    try {
        const data = JSON.parse(event.body);
        const { priceId, userId, userEmail, successUrl, cancelUrl } = data;

        if (!priceId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing price ID' })
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
                userId: userId
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
            body: JSON.stringify({ error: error.message || 'Failed to create checkout session' })
        };
    }
};
