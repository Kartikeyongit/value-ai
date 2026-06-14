# ValueAI Split Deployment Guide

## Architecture

| Service | Provider | Cost | URL |
|---------|----------|------|-----|
| Frontend | Vercel | FREE | https://valueai-yourname.vercel.app |
| Backend | Render | $7/month | https://valueai-backend.onrender.com |
| Database | Supabase | FREE | postgresql://...supabase.co |

---

## Step 1: Push to GitHub

```bash
cd /mnt/c/Users/gauta/Downloads/github-projects/value-ai
git add .
git commit -m "Split deploy: Vercel + Render + Supabase"
git push origin main
```

---

## Step 2: Create Supabase Database (FREE)

1. Go to https://supabase.com
2. Sign up with GitHub
3. Click "New Project"
   - Name: valueai
   - Region: closest to you (e.g., Singapore for India)
   - Plan: Free
4. Wait 2 minutes for database creation
5. Go to Project Settings > Database > Connection String
6. Copy the URI (looks like):
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxx.supabase.co:5432/postgres
   ```
7. Save this somewhere - you'll need it twice

---

## Step 3: Deploy Backend on Render ($7/month)

1. Go to https://dashboard.render.com
2. Sign up with GitHub
3. Click "New +" > "Web Service"
4. Connect your GitHub repo: YOUR_USERNAME/value-ai
5. Configure:
   - Name: valueai-backend
   - Root Directory: backend/
   - Runtime: Docker
   - Plan: Starter ($7/month)
6. Click "Advanced" and add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxx.supabase.co:5432/postgres
   JWT_SECRET=generate-64-random-characters-here-change-this-in-production
   ENCRYPTION_KEY=generate-32-random-characters-here!!!
   FRONTEND_URL=https://valueai-yourname.vercel.app
   ```
7. Click "Create Web Service"
8. Wait for build (~5 minutes)
9. Your backend URL: https://valueai-backend.onrender.com

---

## Step 4: Run Migrations on Render

1. Render dashboard > valueai-backend > Shell
2. Run:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed-demo.ts
   ```
3. Close shell

---

## Step 5: Deploy Frontend on Vercel (FREE)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repo: YOUR_USERNAME/value-ai
5. Configure:
   - Root Directory: frontend/
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
6. Environment Variables:
   ```
   VITE_API_URL=https://valueai-backend.onrender.com/api/v1
   ```
7. Click "Deploy"
8. Wait for build (~2 minutes)
9. Your frontend URL: https://valueai-yourname.vercel.app

---

## Step 6: Update CORS on Render

1. Go to Render dashboard > valueai-backend > Environment
2. Update FRONTEND_URL to your actual Vercel URL:
   ```
   FRONTEND_URL=https://valueai-yourname.vercel.app
   ```
3. Click "Save Changes" (auto-restarts)

---

## Your Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://valueai-yourname.vercel.app |
| Backend API | https://valueai-backend.onrender.com/api/v1 |
| Health Check | https://valueai-backend.onrender.com/health |

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth, 6000 build minutes/month |
| Render Starter | 512MB RAM, never sleeps, $7/month |
| Supabase Free | 500MB database, 2GB file storage, 500K requests/month |

---

## Keep Backend Alive (Not needed on Render Starter)

Render Starter plan never sleeps, so no need for UptimeRobot.
Only free Render web services sleep after 15 min.

---

## Custom Domain (Optional)

1. Buy domain on Namecheap (~$10/year)
2. Vercel: Project Settings > Domains > Add custom domain
3. Render: Service Settings > Custom Domains > Add domain
4. Update DNS records at Namecheap
5. Update FRONTEND_URL env var on Render
6. Update VITE_API_URL env var on Vercel

---

## Troubleshooting

### CORS Error in Browser Console
- Check FRONTEND_URL on Render matches your Vercel URL exactly
- Include https:// and no trailing slash

### Database Connection Failed
- Check DATABASE_URL format: postgresql://user:pass@host:5432/db
- Make sure Supabase project is active (not paused)

### Frontend Shows "No data"
- Check VITE_API_URL on Vercel points to correct Render URL
- Check backend health: https://valueai-backend.onrender.com/health

### Build Fails on Render
- Check Render logs for exact error
- Common: Prisma generate not run, missing env vars
- Fix: Add `npx prisma generate` to build command if needed
