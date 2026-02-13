// Netlify Function: /api/send-welcome
// Sends welcome email to new users via Resend

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, name } = JSON.parse(event.body);

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email is required' })
            };
        }

        const RESEND_API_KEY = process.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            console.error('Resend API key not configured');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Email service not configured' })
            };
        }

        const displayName = name || 'there';

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'PlainFinancials <reports@plainfinance.co>',
                to: [email],
                subject: 'Welcome to PlainFinancials',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
                        <h2 style="color: #1e3a5f;">Welcome to PlainFinancials</h2>
                        <p>Hi ${displayName},</p>
                        <p>Welcome to PlainFinancials. Whenever you enter new financial data, you'll receive a clear, simple report that shows how your business is really doing &mdash; without jargon or overwhelm.</p>
                        <p>If you need help or want guidance interpreting your numbers, we're here.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #64748b; font-size: 14px;">
                            Best regards,<br>
                            <strong>PlainFinancials Team</strong>
                        </p>
                    </div>
                `
            })
        });

        const result = await response.json();

        if (response.ok) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ success: true })
            };
        } else {
            console.error('Resend API error:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: result.message || 'Failed to send welcome email' })
            };
        }

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send welcome email' })
        };
    }
};
