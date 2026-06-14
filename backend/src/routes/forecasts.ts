import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ForecastingEngine } from '../services/engines/forecasting';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const forecasts = await prisma.forecast.findMany({
    where: { orgId },
    orderBy: { period: 'asc' },
    take: days,
  });

  res.json(forecasts);
}));

router.post('/generate', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const forecasts = await ForecastingEngine.generateForecast(orgId, days);
  res.json({ generated: forecasts.length, forecasts });
}));

export default router;
