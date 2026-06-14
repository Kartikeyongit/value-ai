import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { RecommendationEngine } from '../services/engines/recommendation';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const recs = await prisma.recommendation.findMany({
    where: { orgId, status: { in: ['ACTIVE', 'APPLIED'] } },
    orderBy: [{ severity: 'asc' }, { monthlySavings: 'desc' }],
  });

  res.json(recs);
}));

router.get('/top', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const limit = parseInt(req.query.limit as string) || 5;
  const recs = await prisma.recommendation.findMany({
    where: { orgId, status: 'ACTIVE' },
    orderBy: { monthlySavings: 'desc' },
    take: limit,
  });

  res.json(recs);
}));

router.post('/generate', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const recs = await RecommendationEngine.generateRecommendations(orgId);
  res.json({ generated: recs.length, recommendations: recs });
}));

router.post('/:id/dismiss', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const rec = await prisma.recommendation.updateMany({
    where: { id: req.params.id, orgId },
    data: {
      status: 'DISMISSED',
      dismissedAt: new Date(),
      dismissedBy: req.user!.id,
    },
  });

  res.json({ message: 'Recommendation dismissed' });
}));

router.post('/:id/apply', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const rec = await prisma.recommendation.updateMany({
    where: { id: req.params.id, orgId },
    data: {
      status: 'APPLIED',
      appliedAt: new Date(),
      appliedBy: req.user!.id,
    },
  });

  res.json({ message: 'Recommendation applied' });
}));

export default router;
