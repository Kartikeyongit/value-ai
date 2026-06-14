# ValueAI Deployment Guide

## Step 1: Push to GitHub

cd /mnt/c/Users/gauta/Downloads/github-projects/value-ai
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/valueai.git
git push -u origin main

## Step 2: Deploy on Render.com

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repo
4. Render will read render.yaml and create:
   - PostgreSQL database (free)
   - Redis cache (free)
   - Backend API (free)
   - Frontend static site (free)

## Step 3: Run migrations

After first deploy, go to Render dashboard > valueai-backend > Shell

npx prisma migrate deploy
npx tsx prisma/seed-demo.ts

## Your URLs

Frontend: https://valueai-frontend.onrender.com
Backend:  https://valueai-backend.onrender.com
API:      https://valueai-backend.onrender.com/api/v1

## Free Tier Notes

- Services sleep after 15 min idle (cold start ~30s)
- PostgreSQL pauses after 90 days inactivity
- Use UptimeRobot (free) to ping /health every 5 min to keep alive

## Custom Domain (Optional)

1. Buy domain on Namecheap (~$10/year)
2. Add in Render dashboard > Settings > Custom Domains
3. Update DNS records
