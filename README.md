# ValueAI — AI Infrastructure Cost Optimization Platform

**Production-grade full-stack application for auditing, optimizing, and forecasting AI infrastructure spend across 15+ providers.**

## Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Zustand
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL 16 (structured data) + Redis 7 (caching & sessions)
- **Infrastructure:** Docker Compose + Nginx reverse proxy
- **Security:** AES-256 encryption at rest, JWT authentication, SOC-2 aligned key handling

## Supported Providers

OpenAI, Anthropic, Google Gemini, Mistral, Cohere, Azure OpenAI, AWS Bedrock, Stability AI, DeepSeek, Perplexity, xAI Grok, Replicate, Hugging Face, Meta Llama, Midjourney

## Quick Start

```bash
# 1. Clone and enter directory
cd valueai

# 2. Environment setup
cp .env.example .env
# Edit .env with your secrets

# 3. Launch full stack
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate dev

# 5. Seed mock data
docker-compose exec backend npx ts-node prisma/seed.ts

# 6. Access dashboard
open http://localhost
```

## Development

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

## Features

1. Multi-Provider Connection Hub (OAuth + API keys + CSV upload)
2. Unified Usage Dashboard with real-time charts
3. Cross-Provider Cost Normalization Engine
4. Waste & Redundancy Detection
5. Predictive Spend Forecasting (30-day trajectory)
6. Plan Recommendation Engine with exact savings
7. Smart Alerts System (Slack/Discord/Email webhooks)
8. Team & Project Allocation with chargeback reports
9. Premium dark-mode UI with glassmorphism

## License

Proprietary — ValueAI Inc.
