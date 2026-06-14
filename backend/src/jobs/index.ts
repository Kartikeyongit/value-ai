import cron from 'node-cron';
import { ProviderService } from '../services/providers';
import { RecommendationEngine } from '../services/engines/recommendation';
import { ForecastingEngine } from '../services/engines/forecasting';
import { WasteDetectionEngine } from '../services/engines/waste';
import { AlertEngine } from '../services/engines/alerts';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export function initializeJobs() {
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running provider sync job');
    const credentials = await prisma.providerCredential.findMany({ where: { isActive: true } });
    for (const cred of credentials) {
      try { await ProviderService.syncProvider(cred.id); }
      catch (e) { logger.error(`Sync failed for ${cred.id}:`, e); }
    }
  });

  cron.schedule('0 2 * * *', async () => {
    logger.info('Running nightly optimization jobs');
    const orgs = await prisma.organization.findMany();
    for (const org of orgs) {
      try {
        await RecommendationEngine.generateRecommendations(org.id);
        await ForecastingEngine.generateForecast(org.id, 30);
        await WasteDetectionEngine.detectWaste(org.id);
      } catch (e) { logger.error(`Optimization failed for ${org.id}:`, e); }
    }
  });

  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running alert processor');
    await AlertEngine.processAlerts();
  });

  logger.info('Cron jobs initialized');
}