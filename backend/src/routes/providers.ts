import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { encrypt, maskKey } from '../utils/encryption';
import { ProviderService } from '../services/providers';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const providers = await prisma.provider.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json(providers);
}));

router.get('/my-connections', asyncHandler(async (req: AuthRequest, res) => {
  const credentials = await prisma.providerCredential.findMany({
    where: { userId: req.user!.id },
    include: { provider: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(credentials.map(c => ({
    ...c,
    encryptedKey: undefined,
    keyLastFour: c.keyLastFour || '••••',
  })));
}));

const connectSchema = z.object({
  providerId: z.string().uuid(),
  credentialType: z.enum(['API_KEY', 'OAUTH_TOKEN', 'AWS_ROLE', 'AZURE_SERVICE_PRINCIPAL']),
  key: z.string().min(1),
  region: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/connect', asyncHandler(async (req: AuthRequest, res) => {
  const data = connectSchema.parse(req.body);
  const userId = req.user!.id;

  const provider = await prisma.provider.findUnique({ where: { id: data.providerId } });
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const encryptedKey = encrypt(data.key);
  const keyLastFour = data.key.slice(-4);

  const credential = await prisma.providerCredential.create({
    data: {
      userId,
      providerId: data.providerId,
      credentialType: data.credentialType,
      encryptedKey,
      keyLastFour,
      region: data.region || 'us-east-1',
      metadata: data.metadata || {},
      lastSyncStatus: 'NEVER',
    },
    include: { provider: true },
  });

  logger.info(`Provider connected: ${provider.name} by user ${userId}`);

  // Trigger initial sync
  ProviderService.syncProvider(credential.id).catch(err => {
    logger.error(`Initial sync failed for ${credential.id}:`, err);
  });

  res.status(201).json({
    ...credential,
    encryptedKey: undefined,
  });
}));

router.delete('/connections/:id', asyncHandler(async (req: AuthRequest, res) => {
  const credential = await prisma.providerCredential.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!credential) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  await prisma.providerCredential.delete({ where: { id: req.params.id } });
  res.json({ message: 'Connection removed' });
}));

router.post('/sync/:id', asyncHandler(async (req: AuthRequest, res) => {
  const credential = await prisma.providerCredential.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!credential) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  const job = await ProviderService.syncProvider(credential.id);
  res.json({ message: 'Sync initiated', jobId: job.id });
}));

export default router;
