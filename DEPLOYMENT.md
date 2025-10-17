# Vercel Deployment Checklist

## Pre-Deployment Checklist

- [x] Build script updated (removed `--turbopack` flag)
- [x] `vercel.json` configuration created
- [x] `env.example` file created with all required environment variables
- [x] Build tested locally and passes successfully
- [x] README updated with deployment instructions

## Required Environment Variables

Before deploying, ensure you have the following credentials ready:

1. **Supabase**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

2. **Google Gemini API**
   - `NEXT_PUBLIC_GEMINI_API_KEY` - Your Google Gemini API key

## Deployment Steps

### Quick Deploy (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Setup for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add environment variables in the dashboard
   - Click Deploy

### Alternative: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_GEMINI_API_KEY

# Deploy to production
vercel --prod
```

## Post-Deployment

1. **Test the deployment**
   - Visit your Vercel URL
   - Test authentication flow
   - Verify AI grading features work

2. **Configure custom domain** (optional)
   - Go to your project settings in Vercel
   - Add your custom domain
   - Update DNS records as instructed

3. **Set up Supabase redirects**
   - Update your Supabase authentication settings
   - Add your Vercel URL to allowed redirect URLs
   - Format: `https://your-app.vercel.app/auth/confirm`

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify Node.js version compatibility (20+)
- Review build logs in Vercel dashboard

### Authentication Issues
- Ensure Supabase redirect URLs include your Vercel domain
- Verify environment variables are set in Vercel (not just locally)

### API Errors
- Confirm Gemini API key is valid and has proper permissions
- Check API quotas and limits

## Notes

- The build process takes approximately 1-2 minutes
- Vercel automatically detects Next.js and configures settings
- Environment variables can be updated in Vercel dashboard without redeployment
- Each push to main branch triggers automatic redeployment (if configured)
