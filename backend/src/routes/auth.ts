import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  orgName: z.string().optional(),
});

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  let orgId: string | undefined;
  if (data.orgName) {
    const org = await prisma.organization.create({
      data: { name: data.orgName, slug: data.orgName.toLowerCase().replace(/\s+/g, '-') },
    });
    orgId = org.id;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      orgId,
      role: orgId ? 'ADMIN' : 'ADMIN',
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, orgId: true },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, orgId: user.orgId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logger.info(`User registered: ${user.email}`);
  res.status(201).json({ user, token });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !await bcrypt.compare(data.password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, orgId: user.orgId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      orgId: user.orgId,
    },
    token,
  });
}));

export default router;
