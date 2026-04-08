# NeuroScan Deployment Information

## ✅ Frontend Deployed to Vercel

### 🌐 Live URLs

**Production URL**: https://neuroscan-frontend-alpha.vercel.app

**Alternative URL**: https://neuroscan-frontend-bjv9bedfy-yugallohanis-projects.vercel.app

**Inspect Deployment**: https://vercel.com/yugallohanis-projects/neuroscan-frontend/7nvg9hcXb2KNaGd4XZC7UL9i82CP

### 📊 Deployment Details

- **Platform**: Vercel
- **Project Name**: neuroscan-frontend
- **Owner**: yugallohanis-projects
- **Framework**: Vite
- **Build Command**: npm run build
- **Output Directory**: dist
- **Status**: ✅ Deployed Successfully
- **Deployment Time**: ~38 seconds

### ⚠️ Important Note

The frontend is currently configured to connect to `http://localhost:3001` for the backend API. This means:

- ✅ The frontend is live and accessible
- ❌ API calls won't work until backend is deployed
- 🔧 You'll need to update the API URL after deploying backend to Render

### 🔄 Next Steps: Deploy Backend to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up or login

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository (or deploy from local)

3. **Configure Backend Service**
   ```
   Name: neuroscan-backend
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Set Environment Variables on Render**
   ```
   DATABASE_URL=your_postgresql_connection_string
   GOOGLE_GEMINI_API_KEY=AIzaSyC7-cX0mAUzd--BgLXQtmfmHMDhEDfWtKs
   ELEVENLABS_API_KEY=0ae7b1f8886213e38774bfa553dec3222392d290e78f8ad9f42240dfdd0f42e8
   JWT_SECRET=your_random_secret
   ENCRYPTION_KEY=your_32_character_key
   NODE_ENV=production
   AI_PROVIDER=gemini
   USE_GEMINI=true
   CORS_ORIGIN=https://neuroscan-frontend-alpha.vercel.app
   PORT=3001
   ```

5. **Get Backend URL**
   - After deployment, Render will provide a URL like:
   - `https://neuroscan-backend.onrender.com`

6. **Update Frontend Environment Variable**
   ```bash
   cd NeuroScan-landing-page
   
   # Update .env.production
   echo "VITE_API_URL=https://neuroscan-backend.onrender.com" > .env.production
   
   # Redeploy frontend
   vercel --prod
   ```

### 🗄️ Database Options for Render

**Option 1: Render PostgreSQL (Recommended)**
- Go to Render Dashboard → New → PostgreSQL
- Copy the Internal Database URL
- Use this as DATABASE_URL in environment variables

**Option 2: Neon (Free Tier)**
- Go to https://neon.tech
- Create new project
- Copy connection string

**Option 3: Supabase**
- Go to https://supabase.com
- Create new project
- Get connection string from Settings → Database

### 📝 Update Frontend API URL Command

After backend is deployed to Render:

```bash
# Navigate to frontend directory
cd NeuroScan-landing-page

# Update environment variable
echo "VITE_API_URL=https://your-backend-url.onrender.com" > .env.production

# Redeploy to Vercel
vercel --prod
```

### 🧪 Testing

**Test Frontend (Now)**:
```bash
curl -I https://neuroscan-frontend-alpha.vercel.app
```

**Test After Backend Deployment**:
```bash
# Test backend health
curl https://your-backend-url.onrender.com/api/health

# Test frontend in browser
open https://neuroscan-frontend-alpha.vercel.app
```

### 🔧 Vercel Management Commands

```bash
# View deployments
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Update environment variable
vercel env add VITE_API_URL production
# Then enter: https://your-backend-url.onrender.com
```

### 📊 Current Status

- ✅ Frontend: Deployed to Vercel
- ⏳ Backend: Pending deployment to Render
- ⏳ Database: Needs to be set up
- ⏳ API Connection: Will work after backend deployment

### 🎯 Quick Access

**Frontend**: https://neuroscan-frontend-alpha.vercel.app

**Vercel Dashboard**: https://vercel.com/yugallohanis-projects/neuroscan-frontend

**Local Backend** (still running): http://localhost:3001

---

**Deployment Date**: April 2, 2026
**Deployed By**: yugallohani
**Status**: ✅ Frontend Live, Backend Pending
