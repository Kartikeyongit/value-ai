import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import providerRoutes from './routes/providers';
import usageRoutes from './routes/usage';
import analyticsRoutes from './routes/analytics';
import recommendationRoutes from './routes/recommendations';
import alertRoutes from './routes/alerts';
import teamRoutes from './routes/teams';
import webhookRoutes from './routes/webhooks';
import forecastRoutes from './routes/forecasts';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/providers', authenticate, providerRoutes);
app.use('/api/v1/usage', authenticate, usageRoutes);
app.use('/api/v1/analytics', authenticate, analyticsRoutes);
app.use('/api/v1/recommendations', authenticate, recommendationRoutes);
app.use('/api/v1/alerts', authenticate, alertRoutes);
app.use('/api/v1/teams', authenticate, teamRoutes);
app.use('/api/v1/webhooks', authenticate, webhookRoutes);
app.use('/api/v1/forecasts', authenticate, forecastRoutes);

app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
