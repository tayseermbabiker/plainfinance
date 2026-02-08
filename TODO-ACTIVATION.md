# PlainFinance - Activation To-Do List

## Status: Features Built (Activation Needed)

Most features are built and ready. Follow these steps to go live.

---

## What's Already Done

| Feature | Status | Notes |
|---------|--------|-------|
| User auth (Supabase) | ✅ Built | Credentials configured |
| Login/Signup pages | ✅ Built | Email + Google OAuth ready |
| Report history dashboard | ✅ Built | With trends chart |
| Usage tracking | ✅ Built | Free: 2 total, Owner: 6/mo, Pro: 20/mo |
| PDF gating | ✅ Built | Checks plan before download |
| Stripe checkout | ✅ Built | Needs price IDs |
| Stripe webhook | ✅ Built | Needs environment variables |
| Pricing page | ✅ Built | With billing toggle |

---

## Step 1: Configure Supabase URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://yourdomain.com` (or `https://plainfinance.netlify.app`)
3. Add to **Redirect URLs**:
   - `https://yourdomain.com/dashboard.html`
   - `https://yourdomain.com/login.html`

---

## Step 2: Add Supabase Service Key to Netlify

The webhook needs a service key to update user profiles.

1. In Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (NOT the anon key)
3. In Netlify → **Site settings** → **Environment variables**
4. Add:
   - `SUPABASE_URL` = `https://yshqwuxfcxirqaolnfve.supabase.co`
   - `SUPABASE_SERVICE_KEY` = (your service_role key)

---

## Step 3: Set Up Stripe

### 3.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create account
2. Complete business verification
3. Use **Test Mode** first (toggle in dashboard)

### 3.2 Create Products and Prices

In Stripe Dashboard → **Products** → **Add product**:

| Product | Price ID Name | Amount | Billing |
|---------|--------------|--------|---------|
| Owner Monthly | Copy the price_xxx ID | AED 109 | Monthly |
| Owner Annual | Copy the price_xxx ID | AED 1,149 | Yearly |
| Pro Monthly | Copy the price_xxx ID | AED 309 | Monthly |
| Pro Annual | Copy the price_xxx ID | AED 3,099 | Yearly |

### 3.3 Add Stripe Keys to Netlify

In Netlify → **Site settings** → **Environment variables**:

```
STRIPE_SECRET_KEY = sk_test_xxxxx (or sk_live_xxxxx for production)
STRIPE_WEBHOOK_SECRET = whsec_xxxxx (from webhook setup)
STRIPE_PRICE_OWNER_MONTHLY = price_xxxxx
STRIPE_PRICE_OWNER_ANNUAL = price_xxxxx
STRIPE_PRICE_PRO_MONTHLY = price_xxxxx
STRIPE_PRICE_PRO_ANNUAL = price_xxxxx
```

### 3.4 Set Up Webhook

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/.netlify/functions/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** to Netlify as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Enforce Login (When Ready)

Add to top of `js/analyze.js`:

```javascript
// Uncomment to enforce login
document.addEventListener('DOMContentLoaded', async () => {
    const user = await getUser();
    if (!user) {
        window.location.href = 'login.html?redirect=analyze.html';
        return;
    }

    const { allowed, remaining, plan } = await canCreateReport();
    if (!allowed) {
        alert('You have used all your free reports. Upgrade to continue.');
        window.location.href = 'pricing.html';
        return;
    }
});
```

---

## Step 5: Enable Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth credentials (Web application)
3. Add authorized redirect URI: `https://yshqwuxfcxirqaolnfve.supabase.co/auth/v1/callback`
4. In Supabase → **Authentication** → **Providers** → Enable **Google**
5. Paste Client ID and Client Secret

---

## Step 6: Test the Full Flow

1. Sign up as new user
2. Confirm email
3. Generate 2 free reports (should hit limit)
4. Try to generate 3rd report (should be blocked)
5. Subscribe to Owner plan (use Stripe test card: 4242 4242 4242 4242)
6. Confirm subscription shows in dashboard
7. Test PDF download works
8. Cancel subscription and verify downgrade

---

## Pricing Structure (Final)

| Tier | Monthly | Annual | Reports | PDF | History |
|------|---------|--------|---------|-----|---------|
| Free | AED 0 | - | 2 total | No | 30 days |
| Owner | AED 109 | AED 1,149 | 6/month | Yes | 12 months |
| Pro | AED 309 | AED 3,099 | 20/month | Yes + Branded | 12 months |

**Add-on:** Consultation - AED 209 (via WhatsApp booking)

---

## Files Reference

| File | Purpose |
|------|---------|
| `js/supabase.js` | Auth, usage tracking, report storage |
| `login.html` / `signup.html` | Authentication pages |
| `dashboard.html` | Report history with trends |
| `pricing.html` | Pricing page with Stripe checkout |
| `netlify/functions/create-checkout.js` | Creates Stripe checkout session |
| `netlify/functions/stripe-webhook.js` | Handles subscription updates |

---

## Additional SQL (Run Once for New Features)

Run this in Supabase SQL Editor for branded PDF support:

```sql
-- Add logo_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload own logo" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own logo" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'logos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Public can view logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

-- Team access tables
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    invited_email TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Add team_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage their team" ON teams
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view team" ON teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Team owners can manage members" ON team_members
    FOR ALL USING (
        team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
    );

CREATE POLICY "Members can view team members" ON team_members
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    );
```

---

## Still To Build

| Feature | Priority | For Tier | Status |
|---------|----------|----------|--------|
| Scenario analysis | Medium | Pro | ✅ Built |
| Branded PDF upload | Medium | Pro | ✅ Built |
| Team access | Low | Pro | Pending |

---

Last updated: December 2024
