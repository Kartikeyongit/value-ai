import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const teams = await prisma.team.findMany({
    where: { orgId },
    include: { projects: true, apiKeys: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(teams);
}));

const teamSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const data = teamSchema.parse(req.body);
  const team = await prisma.team.create({
    data: { orgId, name: data.name, color: data.color || '#6366f1' },
  });

  res.status(201).json(team);
}));

router.get('/spend', asyncHandler(async (req: AuthRequest, res) => {
  const orgId = req.user!.orgId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  const days = parseInt(req.query.days as string) || 30;
  
  const spend = await prisma.$queryRaw`
    SELECT 
      t.id, t.name, t.color,
      COALESCE(SUM(ul.cost_total), 0) as total_cost,
      COUNT(ul.id) as request_count
    FROM teams t
    LEFT JOIN usage_logs ul ON ul.project_id IN (
      SELECT p.id FROM projects p WHERE p.team_id = t.id
    ) AND ul.timestamp >= NOW() - INTERVAL '${days} days'
    WHERE t.org_id = ${orgId}
    GROUP BY t.id, t.name, t.color
    ORDER BY total_cost DESC
  `;

  res.json(spend);
}));

export default router;
