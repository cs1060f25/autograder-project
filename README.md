# autograder-project
AI-assisted platform to accelerate grading and increase accuracy.

Google Drive: https://drive.google.com/drive/folders/1DzP-ny6q2N0FCIQIv-6ZH8mwM9E5JaQR?usp=sharing

## Tech Stack
- **Framework**: Next.js 15.5.3
- **Database**: Supabase
- **AI**: Google Gemini API
- **UI**: React 19, Tailwind CSS, Radix UI, shadcn/ui
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- Google Gemini API key

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Fill in your Supabase and Gemini API credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/new)**

3. **Import your repository**
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Configure Environment Variables**
   Add the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_GEMINI_API_KEY`

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   vercel env add NEXT_PUBLIC_GEMINI_API_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

See `env.example` for required environment variables:

- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: Your Supabase anon/public key
- **NEXT_PUBLIC_GEMINI_API_KEY**: Your Google Gemini API key

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Server actions and utilities
└── utils/            # Helper functions and clients
```