import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { UsageService } from '../services/usage';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

router.get('/summary', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const summary = await UsageService.getSummary(orgId, days);
  res.json(summary);
}));

router.get('/timeline', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const groupBy = (req.query.groupBy as string) || 'day'; // day, week, month
  const data = await UsageService.getTimeline(orgId, days, groupBy);
  res.json(data);
}));

router.get('/by-provider', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await UsageService.getByProvider(orgId, days);
  res.json(data);
}));

router.get('/by-model', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const providerId = req.query.providerId as string | undefined;
  const data = await UsageService.getByModel(orgId, days, providerId);
  res.json(data);
}));

router.get('/by-team', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await UsageService.getByTeam(orgId, days);
  res.json(data);
}));

router.get('/latency-correlation', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  const data = await UsageService.getLatencyCorrelation(orgId, days);
  res.json(data);
}));

router.post('/upload-csv', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results: any[] = [];
  const stream = Readable.from(req.file.buffer.toString());
  
  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const count = await UsageService.ingestCSV(orgId, results);
      res.json({ message: 'CSV ingested', recordsProcessed: count });
    });
}));

export default router;
