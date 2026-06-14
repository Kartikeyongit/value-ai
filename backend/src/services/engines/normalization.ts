import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export interface NormalizedPrice {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  category: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  imagePricePer1K: number | null;
  effectiveDate: Date;
  region: string;
  planTier: string;
}

export class NormalizationEngine {
  static async normalizePricing(): Promise<NormalizedPrice[]> {
    const pricingModels = await prisma.pricingModel.findMany({
      where: { isCurrent: true },
      include: { provider: true },
    });

    return pricingModels.map(pm => ({
      providerId: pm.providerId,
      providerName: pm.provider.name,
      modelId: pm.modelId,
      modelName: pm.modelName,
      category: pm.category,
      inputPricePer1M: Number(pm.inputPrice) * 1_000_000,
      outputPricePer1M: Number(pm.outputPrice) * 1_000_000,
      imagePricePer1K: pm.imagePrice ? Number(pm.imagePrice) * 1000 : null,
      effectiveDate: pm.effectiveFrom,
      region: pm.region,
      planTier: pm.planTier,
    }));
  }

  static async getCheapestAlternative(modelCategory: string, region: string = 'us-east-1'): Promise<NormalizedPrice | null> {
    const normalized = await this.normalizePricing();
    
    const filtered = normalized.filter(n => 
      n.category === modelCategory && 
      (n.region === region || n.region === 'global')
    );

    if (filtered.length === 0) return null;

    // Sort by total cost (input + output)
    return filtered.sort((a, b) => 
      (a.inputPricePer1M + a.outputPricePer1M) - (b.inputPricePer1M + b.outputPricePer1M)
    )[0];
  }

  static async compareProviders(modelId: string): Promise<NormalizedPrice[]> {
    const normalized = await this.normalizePricing();
    return normalized.filter(n => n.modelId === modelId || n.modelName === modelId);
  }
}
