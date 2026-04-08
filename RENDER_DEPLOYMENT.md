# Deploy Backend to Render - Step by Step Guide

## 🎯 Quick Deploy to Render

### Step 1: Prepare Backend for Render

The backend is already configured and ready. No changes needed!

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended) or email
3. Verify your email

### Step 3: Create PostgreSQL Database (Optional but Recommended)

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - Name: `neuroscan-db`
   - Database: `neuroscan`
   - User: `neuroscan_user`
   - Region: Choose closest to you
   - Plan: Free (or paid for production)
3. Click "Create Database"
4. Copy the "Internal Database URL" (starts with `postgresql://`)

### Step 4: Deploy Backend Web Service

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub first:
   ```bash
   cd NeuroScan-landing-page
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. In Render Dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository
   - Configure:
     - Name: `neuroscan-backend`
     - Root Directory: `backend`
     - Environment: `Node`
     - Region: Same as database
     - Branch: `main`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Plan: Free (or paid)

#### Option B: Deploy from Local (Manual)

1. Install Render CLI:
   ```bash
   npm install -g render-cli
   ```

2. Login:
   ```bash
   render login
   ```

3. Deploy:
   ```bash
   cd NeuroScan-landing-page/backend
   render deploy
   ```

### Step 5: Set Environment Variables on Render

In your Render service dashboard, go to "Environment" tab and add:

```
DATABASE_URL=postgresql://... (from Step 3 or your own database)
GOOGLE_GEMINI_API_KEY=AIzaSyC7-cX0mAUzd--BgLXQtmfmHMDhEDfWtKs
ELEVENLABS_API_KEY=0ae7b1f8886213e38774bfa553dec3222392d290e78f8ad9f42240dfdd0f42e8
JWT_SECRET=generate_random_secret_here
ENCRYPTION_KEY=generate_32_character_key_here
NODE_ENV=production
AI_PROVIDER=gemini
USE_GEMINI=true
CORS_ORIGIN=https://neuroscan-frontend-alpha.vercel.app
PORT=10000
```

**Important**: 
- Generate secure random strings for JWT_SECRET and ENCRYPTION_KEY
- Use PORT=10000 (Render's default)
- CORS_ORIGIN should be your Vercel frontend URL

### Step 6: Deploy and Wait

1. Click "Create Web Service" or "Deploy"
2. Wait for deployment (usually 2-5 minutes)
3. Render will provide a URL like: `https://neuroscan-backend.onrender.com`

### Step 7: Run Database Migrations

After deployment, you need to run migrations:

1. In Render Dashboard, go to your service
2. Click "Shell" tab
3. Run:
   ```bash
   npm run migrate
   ```

Or connect to your database directly and run the SQL from `backend/src/database/schema.sql`

### Step 8: Test Backend

```bash
# Test health endpoint
curl https://neuroscan-backend.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","service":"NeuroScan AI Backend"}
```

### Step 9: Update Frontend to Use Render Backend

```bash
cd NeuroScan-landing-page

# Update environment variable
echo "VITE_API_URL=https://neuroscan-backend.onrender.com" > .env.production

# Redeploy frontend to Vercel
vercel --prod
```

### Step 10: Update CORS on Backend

If you get CORS errors:

1. Go to Render Dashboard → Your Service → Environment
2. Update `CORS_ORIGIN` to your Vercel URL
3. Click "Save Changes" (will auto-redeploy)

## 🔧 Render Configuration Files

### render.yaml (Optional - for automated deployment)

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: neuroscan-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: AI_PROVIDER
        value: gemini
      - key: USE_GEMINI
        value: true
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: GOOGLE_GEMINI_API_KEY
        sync: false
      - key: ELEVENLABS_API_KEY
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: ENCRYPTION_KEY
        generateValue: true
      - key: CORS_ORIGIN
        value: https://neuroscan-frontend-alpha.vercel.app

databases:
  - name: neuroscan-db
    plan: free
    databaseName: neuroscan
    user: neuroscan_user
```

## 🐛 Troubleshooting

### Build Fails

**Check logs in Render Dashboard**:
- Go to your service → "Logs" tab
- Look for error messages

**Common issues**:
- Missing dependencies: Check `package.json`
- TypeScript errors: Run `npm run build` locally first
- Wrong Node version: Add `engines` to `package.json`

### Database Connection Fails

**Check DATABASE_URL**:
- Verify it's set in Environment variables
- Test connection locally:
  ```bash
  export DATABASE_URL="your_render_database_url"
  npm run migrate
  ```

### CORS Errors

**Update CORS_ORIGIN**:
1. Render Dashboard → Environment
2. Update `CORS_ORIGIN` to exact Vercel URL
3. Save (auto-redeploys)

### API Calls Fail

**Check backend is running**:
```bash
curl https://your-backend.onrender.com/api/health
```

**Check frontend environment**:
```bash
# Verify VITE_API_URL is set correctly
cat .env.production
```

## 📊 Render Free Tier Limits

- ✅ 750 hours/month (enough for 1 service)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from Git
- ⚠️ Spins down after 15 min inactivity (cold starts)
- ⚠️ 512 MB RAM
- ⚠️ Shared CPU

**For production**: Consider upgrading to paid plan ($7/month) for:
- No spin down
- More resources
- Better performance

## 🎉 Success Checklist

- [ ] Render account created
- [ ] PostgreSQL database created (or external DB ready)
- [ ] Backend deployed to Render
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Backend health check passes
- [ ] Frontend updated with Render backend URL
- [ ] Frontend redeployed to Vercel
- [ ] CORS configured correctly
- [ ] Full app tested end-to-end

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Render Node.js Guide: https://render.com/docs/deploy-node-express-app
- Render PostgreSQL: https://render.com/docs/databases

---

**Next**: After backend is deployed, update frontend and test the complete application!
