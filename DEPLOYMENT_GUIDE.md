# NeuroScan Vercel Deployment Guide

This guide will walk you through deploying both the frontend and backend to Vercel using the CLI.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **PostgreSQL Database**: You'll need a hosted PostgreSQL database (recommended: Vercel Postgres, Neon, or Supabase)

## Project Architecture

- **Frontend**: React + Vite + TypeScript (SPA)
- **Backend**: Express + TypeScript (Serverless Functions)
- **Database**: PostgreSQL
- **AI Services**: Google Gemini API, ElevenLabs TTS

## Step 1: Prepare PostgreSQL Database

### Option A: Vercel Postgres (Recommended)
```bash
# In your Vercel dashboard, create a new Postgres database
# Copy the DATABASE_URL connection string
```

### Option B: Neon (Free Tier)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option C: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings > Database

## Step 2: Deploy Backend

### 2.1 Navigate to Backend Directory
```bash
cd NeuroScan-landing-page/backend
```

### 2.2 Login to Vercel
```bash
vercel login
```

### 2.3 Deploy Backend
```bash
# First deployment (will prompt for configuration)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? neuroscan-backend (or your choice)
# - Directory? ./
# - Override settings? No
```

### 2.4 Set Environment Variables
```bash
# Set all required environment variables
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel env add GOOGLE_GEMINI_API_KEY
# Paste your Gemini API key: AIzaSyC7-cX0mAUzd--BgLXQtmfmHMDhEDfWtKs

vercel env add ELEVENLABS_API_KEY
# Paste your ElevenLabs API key: 0ae7b1f8886213e38774bfa553dec3222392d290e78f8ad9f42240dfdd0f42e8

vercel env add JWT_SECRET
# Generate a secure random string

vercel env add ENCRYPTION_KEY
# Generate a 32-character random string

vercel env add NODE_ENV
# Enter: production

vercel env add AI_PROVIDER
# Enter: gemini

vercel env add USE_GEMINI
# Enter: true

# Set CORS origin (will be your frontend URL)
vercel env add CORS_ORIGIN
# Enter: https://your-frontend-url.vercel.app (update after frontend deployment)
```

### 2.5 Deploy to Production
```bash
vercel --prod
```

### 2.6 Note Your Backend URL
After deployment, Vercel will show your backend URL:
```
https://neuroscan-backend-xxxxx.vercel.app
```
**Save this URL - you'll need it for the frontend!**

### 2.7 Run Database Migrations
You'll need to run migrations manually. Connect to your database and run:
```sql
-- Copy the contents of backend/src/database/schema.sql
-- Execute in your PostgreSQL database
```

Or use a migration tool:
```bash
# Set DATABASE_URL environment variable locally
export DATABASE_URL="your_postgres_connection_string"

# Run migrations
npm run migrate
```

## Step 3: Deploy Frontend

### 3.1 Navigate to Frontend Directory
```bash
cd ..  # Back to NeuroScan-landing-page
```

### 3.2 Create Production Environment File
```bash
# Create .env.production
cat > .env.production << EOF
VITE_API_URL=https://your-backend-url.vercel.app
EOF
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Step 2.6.

### 3.3 Update API Calls (if needed)
The frontend should use `import.meta.env.VITE_API_URL` for API calls. Let's verify:

```typescript
// Should be using environment variable like:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 3.4 Deploy Frontend
```bash
# First deployment
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? neuroscan-frontend (or your choice)
# - Directory? ./
# - Override settings? No
```

### 3.5 Deploy to Production
```bash
vercel --prod
```

### 3.6 Note Your Frontend URL
After deployment, Vercel will show your frontend URL:
```
https://neuroscan-frontend-xxxxx.vercel.app
```

## Step 4: Update CORS Configuration

### 4.1 Update Backend CORS
```bash
cd backend

# Update CORS_ORIGIN with your frontend URL
vercel env add CORS_ORIGIN production
# Enter: https://your-frontend-url.vercel.app

# Redeploy backend
vercel --prod
```

## Step 5: Create User Account

### 5.1 Access Your Deployed App
Open your frontend URL: `https://your-frontend-url.vercel.app`

### 5.2 Register Account
1. Click "Login" or "Get Started"
2. Create account with:
   - Email: yugalmora@gmail.com
   - Password: test123

## Step 6: Test the Deployment

### 6.1 Test Health Check
```bash
curl https://your-backend-url.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "NeuroScan AI Backend",
  "environment": "production"
}
```

### 6.2 Test Frontend
1. Open frontend URL
2. Login with your account
3. Start an assessment
4. Verify AI responses work
5. Check clinical reports generate

## Troubleshooting

### Backend Issues

**Database Connection Errors**
```bash
# Verify DATABASE_URL is set correctly
vercel env ls

# Check database is accessible
# Try connecting with psql or a database client
```

**API Key Errors**
```bash
# Verify all API keys are set
vercel env ls

# Re-add any missing keys
vercel env add KEY_NAME production
```

**CORS Errors**
```bash
# Update CORS_ORIGIN to match your frontend URL
vercel env add CORS_ORIGIN production
vercel --prod
```

### Frontend Issues

**API Connection Errors**
- Check `.env.production` has correct `VITE_API_URL`
- Verify backend is deployed and accessible
- Check browser console for CORS errors

**Build Errors**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

## Continuous Deployment

### Auto-Deploy from Git

1. **Connect to GitHub**
   ```bash
   # In Vercel dashboard, import your GitHub repository
   # Vercel will auto-deploy on every push to main branch
   ```

2. **Configure Build Settings**
   - **Frontend**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
   
   - **Backend**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

## Environment Variables Summary

### Backend Required Variables
```
DATABASE_URL=postgresql://...
GOOGLE_GEMINI_API_KEY=AIzaSyC7...
ELEVENLABS_API_KEY=0ae7b1f8...
JWT_SECRET=your_secret
ENCRYPTION_KEY=your_32_char_key
NODE_ENV=production
AI_PROVIDER=gemini
USE_GEMINI=true
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend Required Variables
```
VITE_API_URL=https://your-backend.vercel.app
```

## Custom Domains (Optional)

### Add Custom Domain to Frontend
```bash
vercel domains add yourdomain.com
```

### Add Custom Domain to Backend
```bash
cd backend
vercel domains add api.yourdomain.com
```

Then update:
- Frontend `.env.production`: `VITE_API_URL=https://api.yourdomain.com`
- Backend `CORS_ORIGIN`: `https://yourdomain.com`

## Monitoring

### View Logs
```bash
# Backend logs
cd backend
vercel logs

# Frontend logs
cd ..
vercel logs
```

### View Deployments
```bash
vercel ls
```

## Rollback

If something goes wrong:
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Cost Considerations

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function executions
- ✅ Automatic HTTPS
- ✅ Preview deployments

### Paid Services:
- 💰 PostgreSQL database (Vercel Postgres: $20/month, Neon: Free tier available)
- 💰 Google Gemini API (Free tier: 20 requests/day, Paid: $0.00025/request)
- 💰 ElevenLabs TTS (Free tier: 10k characters/month)

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test API endpoints with curl/Postman
5. Check database connectivity

## Quick Deploy Commands

```bash
# Deploy everything (run from project root)
cd NeuroScan-landing-page/backend && vercel --prod && cd .. && vercel --prod
```

## Success Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Database connected and migrated
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] User account created
- [ ] Assessment flow tested
- [ ] AI responses working
- [ ] Clinical reports generating
- [ ] Custom domains configured (optional)

---

**Congratulations! Your NeuroScan AI application is now live on Vercel! 🎉**

Frontend: https://your-frontend.vercel.app
Backend: https://your-backend.vercel.app
