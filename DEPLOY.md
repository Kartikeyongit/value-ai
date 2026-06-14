# ValueAI Deployment Guide

## Step 1: Push to GitHub

cd /mnt/c/Users/gauta/Downloads/github-projects/value-ai
git init
git add .
git commit -m "ValueAI portfolio"
git remote add origin https://github.com/YOUR_USERNAME/valueai.git
git push -u origin main

## Step 2: Deploy on Render.com

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repo
4. Render will create:
   - PostgreSQL database (free)
   - Backend API (free)
   - Frontend static site (free)

## Step 3: Create Redis (MANUAL - Blueprint does not support Redis)

1. Go to https://dashboard.render.com/new/redis
2. Name: valueai-redis
3. Plan: Free
4. Region: Same as your backend (e.g., Oregon)
5. Click "Create Redis"
6. Copy the "Internal Redis URL" (looks like: redis://red-xxx:6379)

## Step 4: Set Environment Variables (MANUAL)

1. Go to Render dashboard > valueai-backend > Environment
2. Add/Edit these variables:

   JWT_SECRET:     (generate at https://randomkeygen.com/ - 64 chars)
   ENCRYPTION_KEY: (generate at https://randomkeygen.com/ - 32 chars)
   REDIS_URL:      (paste the Internal Redis URL from Step 3)

3. Click "Save Changes"
4. Backend will auto-restart

## Step 5: Run Database Migrations

1. Go to Render dashboard > valueai-backend > Shell
2. Run:
   npx prisma migrate deploy
   npx tsx prisma/seed-demo.ts

## Your URLs

Frontend: https://valueai-frontend.onrender.com
Backend:  https://valueai-backend.onrender.com
API:      https://valueai-backend.onrender.com/api/v1

## Free Tier Notes

- Services sleep after 15 min idle (cold start ~30s)
- Use UptimeRobot (free) to ping /health every 5 min to keep alive
- PostgreSQL pauses after 90 days inactivity

## Custom Domain (Optional)

1. Buy domain on Namecheap (~$10/year)
2. Add in Render dashboard > Settings > Custom Domains
3. Update DNS records
