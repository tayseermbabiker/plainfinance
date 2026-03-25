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
                from: 'PlainFinancials <reports@plainfinancials.com>',
                to: [email],
                subject: 'Welcome to PlainFinancials',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
                        <h2 style="color: #1e3a5f;">Welcome to PlainFinancials</h2>
                        <p>Hi ${displayName},</p>
                        <p>Accountants hide the truth in complexity. We do the opposite.</p>
                        <p>Every time you enter your numbers, you'll get a clear report that shows how your business is really doing &mdash; no jargon, no overwhelm.</p>
                        <p style="margin: 28px 0;">
                            <a href="https://plainfinancials.com/analyze.html" style="background-color: #1e3a5f; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Run Your First Report &rarr;</a>
                        </p>
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
