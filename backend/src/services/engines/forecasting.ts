import { prisma } from '../../lib/prisma';
import { subDays, addDays, format } from 'date-fns';
import { linearRegression } from 'simple-statistics';

export class ForecastingEngine {
  static async generateForecast(orgId: string, forecastDays: number = 30) {
    const historyDays = 60;
    const since = subDays(new Date(), historyDays);

    const history = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COALESCE(SUM(cost_total), 0) as cost
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    const dailyCosts = (history as any[]).map((h, i) => [i, Number(h.cost)]);
    if (dailyCosts.length < 7) {
      throw new Error('Insufficient data for forecasting (minimum 7 days)');
    }

    const regression = linearRegression(dailyCosts);
    const slope = regression.m;
    const intercept = regression.b;
    const residuals = dailyCosts.map(([x, y]) => y - (slope * x + intercept));
    const stdError = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);

    const forecasts = [];
    const providerBreakdown = await this.getProviderBreakdown(orgId);
    const modelBreakdown = await this.getModelBreakdown(orgId);

    for (let i = 1; i <= forecastDays; i++) {
      const dayIndex = dailyCosts.length + i;
      const projectedCost = Math.max(0, slope * dayIndex + intercept);
      const lowerBound = Math.max(0, projectedCost - 1.96 * stdError);
      const upperBound = projectedCost + 1.96 * stdError;
      const confidence = Math.max(0.5, 1 - (stdError / (projectedCost || 1)));

      forecasts.push({
        orgId,
        period: format(addDays(new Date(), i), 'yyyy-MM-dd'),
        periodType: 'day',
        projectedCost,
        lowerBound,
        upperBound,
        confidence: Math.min(confidence, 0.99),
        providerBreakdown,
        modelBreakdown,
      });
    }

    await prisma.forecast.createMany({ data: forecasts, skipDuplicates: true });
    return forecasts;
  }

  private static async getProviderBreakdown(orgId: string) {
    const since = subDays(new Date(), 30);
    const data = await prisma.$queryRaw`
      SELECT provider_id, COALESCE(SUM(cost_total), 0) as cost
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY provider_id
    `;
    return (data as any[]).reduce((acc, row) => { acc[row.provider_id] = Number(row.cost); return acc; }, {});
  }

  private static async getModelBreakdown(orgId: string) {
    const since = subDays(new Date(), 30);
    const data = await prisma.$queryRaw`
      SELECT model_name, COALESCE(SUM(cost_total), 0) as cost
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY model_name
    `;
    return (data as any[]).reduce((acc, row) => { acc[row.model_name] = Number(row.cost); return acc; }, {});
  }
}