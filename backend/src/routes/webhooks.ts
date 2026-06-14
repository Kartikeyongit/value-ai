import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const webhooks = await prisma.webhook.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(webhooks);
}));

const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()),
});

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const data = webhookSchema.parse(req.body);
  
  const webhook = await prisma.webhook.create({
    data: {
      userId: req.user!.id,
      ...data,
    },
  });

  res.status(201).json(webhook);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.webhook.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ message: 'Webhook deleted' });
}));

export default router;
