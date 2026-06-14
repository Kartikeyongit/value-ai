# ValueAI Free Deployment Guide

## Architecture (All Free)

| Service | Provider | Purpose | Cost |
|---------|----------|---------|------|
| Frontend | Vercel | React app hosting | FREE |
| Backend | Cyclic | Node.js API | FREE |
| Database | Supabase | PostgreSQL | FREE |
| Redis | None | Optional (disabled) | FREE |

## Step 1: Prepare Your Code

```bash
cd /mnt/c/Users/gauta/Downloads/github-projects/value-ai

# Backend now works without Redis (graceful fallback)
# Just make sure your .env has DATABASE_URL

# Push to GitHub
git add .
git commit -m "Make Redis optional for free deploy"
git push origin main
```

## Step 2: Create Supabase Database (Free)

1. Go to https://supabase.com
2. Sign up with GitHub
3. Click "New Project"
4. Name: valueai
5. Region: closest to you
6. Plan: Free
7. Wait ~2 minutes for database creation
8. Go to Settings > Database > Connection String
9. Copy the URI (looks like: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres)

## Step 3: Deploy Backend on Cyclic (Free)

1. Go to https://cyclic.sh
2. Sign up with GitHub
3. Click "Link Your Own"
4. Select your GitHub repo: value-ai
5. Set root directory: backend/
6. Add Environment Variables:
   - DATABASE_URL: (paste Supabase connection string)
   - JWT_SECRET: (generate at https://randomkeygen.com)
   - ENCRYPTION_KEY: (generate at https://randomkeygen.com)
   - NODE_ENV: production
   - PORT: 3001
7. Click "Deploy"
8. Your backend URL: https://your-app-name.cyclic.app

## Step 4: Run Migrations on Cyclic

1. In Cyclic dashboard, go to your app
2. Click "Logs" > "Terminal"
3. Run:
   npx prisma migrate deploy
   npx tsx prisma/seed-demo.ts

## Step 5: Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repo: value-ai
5. Root Directory: frontend/
6. Framework Preset: Vite
7. Build Command: npm run build
8. Output Directory: dist
9. Environment Variables:
   - VITE_API_URL: https://your-app-name.cyclic.app/api/v1
10. Click "Deploy"
11. Your frontend URL: https://valueai-yourname.vercel.app

## Step 6: Connect Frontend to Backend

1. In Vercel dashboard > your project > Settings > Environment Variables
2. Update VITE_API_URL to your actual Cyclic URL
3. Redeploy: Vercel dashboard > Deployments > Redeploy

## Your Live URLs

Frontend: https://valueai-yourname.vercel.app
Backend:  https://your-app-name.cyclic.app
API:      https://your-app-name.cyclic.app/api/v1

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth, 6000 build minutes/month |
| Cyclic | 1 app, sleeps after inactivity (cold start ~5s) |
| Supabase | 500MB database, 2GB file storage, 500K requests/month |

## Keep Backend Alive (Optional)

Cyclic sleeps after inactivity. Use UptimeRobot:
1. https://uptimerobot.com (free)
2. Add monitor: https://your-app-name.cyclic.app/health
3. Check every 5 minutes

## Custom Domain (Optional)

1. Buy domain on Namecheap (~$10/year)
2. Vercel: Project Settings > Domains > Add
3. Cyclic: App Settings > Custom Domain > Add
4. Update DNS records at Namecheap
