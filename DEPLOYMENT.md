# PlainFinance Deployment Guide

## Prerequisites

- Netlify account (free tier works)
- OpenAI API key (for AI-powered analysis)
- Resend API key (for email delivery - free tier: 3000 emails/month)

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

5. Click "Save"
6. Trigger a redeploy for the changes to take effect

### 3. Configure Resend Domain (for email delivery)

1. Sign up at https://resend.com
2. Go to Domains and add your domain (e.g., plainfinance.co)
3. Add the DNS records Resend provides
4. Once verified, update the `from` address in `netlify/functions/send-email.js`

Note: For testing, Resend allows sending to your own email without domain verification.

### 4. Test the Deployment

1. Visit your Netlify site URL
2. Fill out the analysis form
3. Submit and verify the AI-generated report loads correctly
4. Click "Download PDF" to test PDF generation
5. Click "Email Report" and send to yourself to test email delivery

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
