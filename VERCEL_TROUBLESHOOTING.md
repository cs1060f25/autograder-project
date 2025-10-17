# Vercel Deployment Troubleshooting

## 500 Error: MIDDLEWARE_INVOCATION_FAILED

This error occurs when the middleware crashes during execution. Here are the common causes and solutions:

### ✅ Solution 1: Verify Environment Variables (Most Common)

The middleware needs these environment variables to function:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_GEMINI_API_KEY`

4. **Redeploy** your application after adding variables:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### ✅ Solution 2: Check Supabase Configuration

1. **Verify Supabase URL format**:
   - Should look like: `https://xxxxx.supabase.co`
   - No trailing slash

2. **Verify you're using the correct key**:
   - Use the **anon/public** key, NOT the service role key
   - Find it in: Supabase Dashboard → Settings → API → Project API keys

3. **Update Supabase redirect URLs**:
   - Go to: Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to **Redirect URLs**:
     ```
     https://your-app.vercel.app/auth/confirm
     https://your-app.vercel.app/**
     ```

### ✅ Solution 3: Check Vercel Logs

1. Go to your Vercel project
2. Click on the failed deployment
3. Click **View Function Logs**
4. Look for specific error messages

Common error messages:
- `"Missing Supabase environment variables"` → Add environment variables
- `"Invalid API key"` → Check your Supabase keys
- `"Network error"` → Check Supabase project status

### ✅ Solution 4: Test Locally First

Before deploying, test the build locally:

```bash
# Build the project
npm run build

# Start production server
npm start
```

If it works locally but fails on Vercel, it's likely an environment variable issue.

### ✅ Solution 5: Simplify Middleware (Temporary Debug)

If you need to deploy quickly, you can temporarily disable authentication:

1. Comment out the middleware matcher in `src/middleware.ts`:
   ```typescript
   export const config = {
     matcher: [], // Temporarily disable middleware
   };
   ```

2. Deploy and verify the app loads
3. Then re-enable and add proper environment variables

## Other Common Errors

### Build Fails with "Module not found"

**Cause**: Missing dependencies in `package.json`

**Solution**:
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Database Connection Errors

**Cause**: Supabase credentials incorrect or database not accessible

**Solution**:
1. Verify Supabase project is active (not paused)
2. Check API keys are correct
3. Verify database tables exist (run migrations if needed)

### API Route Errors

**Cause**: Missing API keys or incorrect configuration

**Solution**:
1. Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set in Vercel
2. Check API key has proper permissions
3. Review API usage quotas

## Quick Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel
- [ ] Supabase redirect URLs include your Vercel domain
- [ ] Build passes locally (`npm run build`)
- [ ] All dependencies are installed (`npm install`)
- [ ] No hardcoded localhost URLs in code
- [ ] API keys are valid and have proper permissions

## Getting Help

If you're still experiencing issues:

1. **Check Vercel Function Logs** for specific error messages
2. **Check Supabase Logs** in the Supabase dashboard
3. **Test locally** with production build (`npm run build && npm start`)
4. **Verify environment variables** are correctly set in Vercel

## Environment Variables Template

Copy this to your Vercel Environment Variables section:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

**Important**: Add these to ALL environments (Production, Preview, Development)
