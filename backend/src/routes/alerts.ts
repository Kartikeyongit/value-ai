import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.user!.id },
    include: { alertHistory: { take: 5, orderBy: { triggeredAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(alerts);
}));

const alertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  alertType: z.enum(['BUDGET_THRESHOLD', 'ANOMALY_DETECTION', 'SPIKE_DETECTION', 'FORECAST_EXCEEDED', 'NEW_RECOMMENDATION', 'UNUSED_RESOURCE', 'COST_INCREASE']),
  thresholdValue: z.number().positive(),
  thresholdUnit: z.string(),
  comparison: z.string().default('gt'),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  channels: z.array(z.string()),
  webhookUrl: z.string().url().optional(),
  emailRecipients: z.array(z.string().email()).optional(),
});

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = alertSchema.parse(req.body);
  
  const alert = await prisma.alert.create({
    data: {
      userId: req.user!.id,
      ...data,
      emailRecipients: data.emailRecipients || [],
    },
  });

  res.status(201).json(alert);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const data = alertSchema.partial().parse(req.body);
  
  const alert = await prisma.alert.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data,
  });

  res.json({ message: 'Alert updated' });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.alert.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ message: 'Alert deleted' });
}));

export default router;
