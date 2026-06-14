import app from './app';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { initializeJobs } from './jobs';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');
    await redis.ping();
    logger.info('Connected to Redis');
    initializeJobs();
    logger.info('Background jobs initialized');
    app.listen(PORT, () => {
      logger.info(`ValueAI API Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
