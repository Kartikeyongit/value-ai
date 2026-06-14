import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { NormalizationEngine } from './normalization';
import { subDays } from 'date-fns';

export class RecommendationEngine {
  static async generateRecommendations(orgId: string) {
    const since = subDays(new Date(), 30);
    const usageByModel = await prisma.$queryRaw`
      SELECT 
        model_name,
        provider_id,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COALESCE(SUM(tokens_total), 0) as total_tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        COUNT(*) as request_count
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY model_name, provider_id
      ORDER BY total_cost DESC
    `;

    const recommendations = [];
    const models = usageByModel as any[];
    const totalSpend = models.reduce((sum, m) => sum + Number(m.total_cost), 0);

    for (const model of models) {
      const cheaper = await NormalizationEngine.getCheapestAlternative('CHAT');
      const currentPrice = Number(model.total_cost) / (Number(model.total_tokens) || 1);
      if (cheaper && cheaper.providerId !== model.provider_id) {
        const potentialSavings = Number(model.total_cost) * 0.3;
        if (potentialSavings > 50) {
          recommendations.push({
            orgId,
            category: 'MODEL_DOWNGRADE',
            severity: potentialSavings > 500 ? 'HIGH' : 'MEDIUM',
            title: `Switch from ${model.model_name} to ${cheaper.modelName}`,
            description: `${model.model_name} costs $${currentPrice.toFixed(4)} per token. ${cheaper.modelName} at ${cheaper.providerName} offers comparable quality at lower rates.`,
            currentMonthlyCost: Number(model.total_cost),
            recommendedMonthlyCost: Number(model.total_cost) * 0.7,
            monthlySavings: potentialSavings,
            savingsPercent: 30,
            currentProvider: model.provider_id,
            recommendedProvider: cheaper.providerId,
            currentModel: model.model_name,
            recommendedModel: cheaper.modelName,
            confidenceScore: 0.85,
            status: 'ACTIVE',
            evidence: [{ type: 'cost_comparison', data: model }],
          });
        }
      }
    }

    if (totalSpend > 5000) {
      recommendations.push({
        orgId,
        category: 'VOLUME_DISCOUNT',
        severity: 'HIGH',
        title: 'Enterprise tier volume discount available',
        description: `Your monthly spend of $${totalSpend.toFixed(2)} qualifies for enterprise pricing. Typical discounts are 15-40%.`,
        currentMonthlyCost: totalSpend,
        recommendedMonthlyCost: totalSpend * 0.75,
        monthlySavings: totalSpend * 0.25,
        savingsPercent: 25,
        confidenceScore: 0.9,
        status: 'ACTIVE',
        evidence: [{ monthlySpend: totalSpend }],
      });
    }

    const providerIds = [...new Set(models.map(m => m.provider_id))];
    if (providerIds.length > 2) {
      recommendations.push({
        orgId,
        category: 'DUPLICATE_USAGE',
        severity: 'MEDIUM',
        title: 'Consolidate providers for better rates',
        description: `Using ${providerIds.length} providers fragments volume and prevents tier discounts. Consider consolidating to 2 primary providers.`,
        currentMonthlyCost: totalSpend,
        recommendedMonthlyCost: totalSpend * 0.9,
        monthlySavings: totalSpend * 0.1,
        savingsPercent: 10,
        confidenceScore: 0.7,
        status: 'ACTIVE',
        evidence: [{ providerCount: providerIds.length }],
      });
    }

    const saved = [];
    for (const rec of recommendations) {
      const created = await prisma.recommendation.create({ data: rec });
      saved.push(created);
    }
    logger.info(`Generated ${saved.length} recommendations for org ${orgId}`);
    return saved;
  }
}