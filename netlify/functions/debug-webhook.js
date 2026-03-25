// Temporary debug — DELETE after testing
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const results = {};

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // 1. Read profiles
        const { data: profiles, error: readErr } = await supabase
            .from('profiles')
            .select('id, email, subscription_plan, stripe_customer_id');
        results.profiles = readErr ? `READ ERROR: ${readErr.message}` : profiles;

        // 2. Try updating eterna to owner
        if (profiles && profiles.length > 0) {
            const p = profiles.find(r => r.email === 'eterna.general@gmail.com');
            if (p) {
                const { data: updated, error: upErr } = await supabase
                    .from('profiles')
                    .update({ subscription_plan: 'owner', subscription_status: 'active', stripe_customer_id: 'cus_test_debug' })
                    .eq('id', p.id)
                    .select();
                results.update = upErr ? `UPDATE ERROR: ${upErr.message}` : updated;
            } else {
                results.update = 'No eterna profile found';
            }
        }

        // 3. Check env vars
        results.envCheck = {
            supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
            serviceKey: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 15) + '...' : 'MISSING',
            priceOwnerMonthly: process.env.STRIPE_PRICE_OWNER_MONTHLY || 'MISSING'
        };
    } catch (err) {
        results.error = err.message;
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results, null, 2)
    };
};
