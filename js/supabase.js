// ===== PlainFinancials - Supabase Client =====

// Admin emails get unlimited access
const ADMIN_EMAILS = ['tayseermbabiker@gmail.com'];

// Initialize Supabase client
const SUPABASE_URL = 'https://yshqwuxfcxirqaolnfve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaHF3dXhmY3hpcnFhb2xuZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTI3MTMsImV4cCI6MjA4MDQ4ODcxM30.psrwfVzTtx5VTANYrTlyt7CUW87MEqccHx3HAh6vpu4';

let supabaseClient = null;
let supabaseEnabled = false;

function getSupabase() {
    // Check if Supabase is properly configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL.startsWith('http')) {
        supabaseEnabled = false;
        return null;
    }

    if (!supabaseClient && typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            supabaseEnabled = true;
        } catch (e) {
            console.log('Supabase not configured');
            supabaseEnabled = false;
            return null;
        }
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

// ===== Subscription =====

async function getUserProfile() {
    const client = getSupabase();
    if (!client) return { data: null, error: { message: 'Supabase not initialized' } };

    const user = await getUser();
    if (!user) return { data: null, error: { message: 'Not authenticated' } };

    const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { data, error };
}

async function getMonthlyReportCount() {
    const client = getSupabase();
    if (!client) return 0;

    const user = await getUser();
    if (!user) return 0;

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);

    return error ? 0 : (count || 0);
}

async function getTotalReportCount() {
    const client = getSupabase();
    if (!client) return 0;

    const user = await getUser();
    if (!user) return 0;

    const { count, error } = await client
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return error ? 0 : (count || 0);
}

function getReportLimit(plan) {
    const limits = {
        'free': 2,      // 2 total (lifetime)
        'owner': 6,     // 6 per month
        'pro': 20       // 20 per month
    };
    return limits[plan] ?? 2;
}

async function canCreateReport() {
    // If Supabase is not configured, allow unlimited reports
    if (!getSupabase()) {
        return { allowed: true, remaining: -1, plan: 'free' };
    }

    const user = await getUser();

    // Admin bypass - unlimited access
    if (user && ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
        return { allowed: true, remaining: 999, plan: 'admin', limit: 999, used: 0, isAdmin: true };
    }

    const { data: profile } = await getUserProfile();
    const plan = profile?.subscription_plan || 'free';
    const limit = getReportLimit(plan);

    // Free tier: 2 total lifetime reports
    // Paid tiers: monthly limit
    const used = plan === 'free'
        ? await getTotalReportCount()
        : await getMonthlyReportCount();

    const remaining = Math.max(0, limit - used);

    return {
        allowed: remaining > 0,
        remaining,
        used,
        limit,
        plan,
        isLifetime: plan === 'free'
    };
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
