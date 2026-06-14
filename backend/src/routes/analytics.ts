import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics';

const router = Router();

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await AnalyticsService.getDashboardMetrics(orgId, days);
  res.json(data);
}));

router.get('/burn-rate', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const data = await AnalyticsService.getBurnRate(orgId);
  res.json(data);
}));

router.get('/cost-distribution', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await AnalyticsService.getCostDistribution(orgId, days);
  res.json(data);
}));

router.get('/efficiency-metrics', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await AnalyticsService.getEfficiencyMetrics(orgId, days);
  res.json(data);
}));

export default router;
