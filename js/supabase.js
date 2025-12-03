// ===== PlainFinance - Supabase Client =====

// Initialize Supabase client
// These values will be replaced with environment variables in production
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// ===== Authentication =====

async function signUp(email, password, fullName) {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });

    if (!error && data.user) {
        // Create user profile in database
        await client.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString()
        });
    }

    return { data, error };
}

async function signIn(email, password) {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    return { data, error };
}

async function signOut() {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const { error } = await client.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    }
    return { error };
}

async function getUser() {
    const client = getSupabase();
    if (!client) return null;

    const { data: { user } } = await client.auth.getUser();
    return user;
}

async function getSession() {
    const client = getSupabase();
    if (!client) return null;

    const { data: { session } } = await client.auth.getSession();
    return session;
}

// ===== Reports =====

async function saveReport(reportData) {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const user = await getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await client.from('reports').insert({
        user_id: user.id,
        company_name: reportData.company?.name,
        period_month: reportData.company?.period?.month,
        period_year: reportData.company?.period?.year,
        currency: reportData.company?.currency,
        revenue: reportData.current?.revenue,
        net_profit: reportData.current?.netProfit,
        cash: reportData.current?.cash,
        report_data: reportData,
        created_at: new Date().toISOString()
    }).select();

    return { data, error };
}

async function getUserReports() {
    const client = getSupabase();
    if (!client) return { data: [], error: { message: 'Supabase not initialized' } };

    const user = await getUser();
    if (!user) return { data: [], error: { message: 'Not authenticated' } };

    const { data, error } = await client
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

async function getReport(reportId) {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const user = await getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await client
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

    return { data, error };
}

async function deleteReport(reportId) {
    const client = getSupabase();
    if (!client) return { error: { message: 'Supabase not initialized' } };

    const user = await getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { error } = await client
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

    return { error };
}

// ===== Auth State Listener =====

function onAuthStateChange(callback) {
    const client = getSupabase();
    if (!client) return;

    client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// ===== UI Helpers =====

async function updateNavForAuth() {
    const user = await getUser();
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return;

    if (user) {
        // User is logged in - show dashboard link and logout
        const authLinks = navLinks.querySelector('.auth-links');
        if (authLinks) {
            authLinks.innerHTML = `
                <a href="dashboard.html">My Reports</a>
                <button class="btn btn-secondary btn-sm" onclick="signOut()">Log Out</button>
            `;
        }
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavForAuth();
});
