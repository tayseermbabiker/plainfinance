# PlainFinance Deployment Guide

## Prerequisites

- Netlify account (free tier works)
- OpenAI API key (for AI-powered analysis)
- Resend API key (for email delivery - free tier: 3000 emails/month)
- Supabase account (for user accounts - free tier: 50,000 MAU)

## Setup Steps

### 1. Deploy to Netlify

1. Push this repository to GitHub
2. Log in to Netlify (https://app.netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub repository
5. Netlify will auto-detect the settings from `netlify.toml`
6. Click "Deploy site"

### 2. Configure Environment Variables

**Important:** The OpenAI API key must be set as an environment variable, not in the code.

1. In Netlify, go to your site dashboard
2. Click "Site configuration" > "Environment variables"
3. Click "Add a variable"
4. Add the following variables:

   | Key | Value | Where to get it |
   |-----|-------|-----------------|
   | `OPENAI_API_KEY` | Your OpenAI key (starts with `sk-`) | https://platform.openai.com/api-keys |
   | `RESEND_API_KEY` | Your Resend key (starts with `re_`) | https://resend.com/api-keys |
   | `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_`) | https://dashboard.stripe.com/apikeys |
   | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (starts with `whsec_`) | https://dashboard.stripe.com/webhooks |
   | `STRIPE_PRICE_PROFESSIONAL` | Price ID for Professional plan | https://dashboard.stripe.com/products |
   | `STRIPE_PRICE_PREMIUM` | Price ID for Premium plan | https://dashboard.stripe.com/products |
   | `SUPABASE_URL` | Your Supabase project URL | https://supabase.com/dashboard |
   | `SUPABASE_SERVICE_KEY` | Supabase service role key (secret) | Project Settings > API |

   Note: Client-side Supabase anon key is in `js/supabase.js` (safe to expose)

5. Click "Save"
6. Trigger a redeploy for the changes to take effect

### 3. Configure Resend Domain (for email delivery)

1. Sign up at https://resend.com
2. Go to Domains and add your domain (e.g., plainfinance.co)
3. Add the DNS records Resend provides
4. Once verified, update the `from` address in `netlify/functions/send-email.js`

Note: For testing, Resend allows sending to your own email without domain verification.

### 4. Set Up Supabase (for user accounts)

1. Sign up at https://supabase.com
2. Create a new project
3. Go to Project Settings > API
4. Copy your Project URL and anon/public key
5. Update `js/supabase.js` with your values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
6. Go to SQL Editor and run this to create the tables:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_plan text default 'free',
  subscription_status text,
  subscription_ends_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create reports table
create table reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  company_name text,
  period_month text,
  period_year text,
  currency text default 'AED',
  revenue numeric,
  net_profit numeric,
  cash numeric,
  report_data jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table reports enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Policies for reports
create policy "Users can view own reports" on reports
  for select using (auth.uid() = user_id);

create policy "Users can insert own reports" on reports
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own reports" on reports
  for delete using (auth.uid() = user_id);
```

7. (Optional) Enable Google OAuth:
   - Go to Authentication > Providers
   - Enable Google and add your OAuth credentials

### 5. Set Up Stripe (for payments)

1. Sign up at https://stripe.com
2. Go to Developers > API keys and copy your secret key
3. Create two Products in the Products section:
   - Professional: AED 249/month
   - Premium + Expert: AED 499/month
4. Copy the Price IDs (start with `price_`) for each plan
5. Go to Developers > Webhooks
6. Add an endpoint: `https://your-site.netlify.app/api/stripe-webhook`
7. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
8. Copy the webhook signing secret
9. Add all Stripe values to Netlify environment variables

### 6. Test the Deployment

1. Visit your Netlify site URL
2. Sign up for an account
3. Fill out the analysis form
4. Submit and verify the AI-generated report loads correctly
5. Click "Download PDF" to test PDF generation
6. Click "Email Report" and send to yourself to test email delivery
7. Go to Dashboard and verify your report is saved

## Local Development

To test locally with Netlify Dev:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to the site folder
cd site

# Install function dependencies
cd netlify/functions && npm install && cd ../..

# Create a .env file (do not commit this)
echo "OPENAI_API_KEY=your-key-here" > .env

# Run Netlify Dev
netlify dev
```

This will start a local server with the functions available at `/api/analyze`.

## Troubleshooting

### "Analysis failed" error
- Check that OPENAI_API_KEY is set correctly in Netlify environment variables
- Verify your OpenAI account has available credits
- Check Netlify function logs for detailed error messages

### Functions not working
- Ensure `netlify/functions` directory exists with `analyze.js` and `package.json`
- Check that `netlify.toml` has the correct functions directory configuration
- Verify the function was deployed (check Netlify > Functions tab)

## Security Notes

- Never commit API keys to the repository
- The OpenAI key is only accessible server-side in Netlify Functions
- Client-side code cannot access environment variables directly
