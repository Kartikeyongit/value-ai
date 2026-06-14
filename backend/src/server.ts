import app from './app';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { initializeJobs } from './jobs';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

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
  process.exit(0);
});
