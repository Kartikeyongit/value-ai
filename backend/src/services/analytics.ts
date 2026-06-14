import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/redis';
import { subDays, format, differenceInDays } from 'date-fns';

export class AnalyticsService {
  static async getDashboardMetrics(orgId: string, days: number) {
    const cacheKey = `analytics:dashboard:${orgId}:${days}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const since = subDays(new Date(), days);
    const previousSince = subDays(since, days);

    const [
      currentMetrics,
      previousMetrics,
      providerBreakdown,
      modelBreakdown,
      dailyTrend,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(cost_total), 0) as total_cost,
          COALESCE(SUM(tokens_total), 0) as total_tokens,
          COALESCE(AVG(latency_ms), 0) as avg_latency,
          COUNT(*) as request_count
        FROM usage_logs
        WHERE org_id = ${orgId} AND timestamp >= ${since}
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(cost_total), 0) as total_cost
        FROM usage_logs
        WHERE org_id = ${orgId} 
        AND timestamp >= ${previousSince}
        AND timestamp < ${since}
      `,
      prisma.$queryRaw`
        SELECT 
          p.name as provider_name,
          p.slug as provider_slug,
          COALESCE(SUM(ul.cost_total), 0) as cost,
          COALESCE(SUM(ul.tokens_total), 0) as tokens
        FROM providers p
        LEFT JOIN usage_logs ul ON ul.provider_id = p.id 
          AND ul.org_id = ${orgId} 
          AND ul.timestamp >= ${since}
        WHERE p.is_active = true
        GROUP BY p.id, p.name, p.slug
        HAVING COALESCE(SUM(ul.cost_total), 0) > 0
        ORDER BY cost DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT 
          model_name,
          COALESCE(SUM(cost_total), 0) as cost,
          COALESCE(SUM(tokens_total), 0) as tokens
        FROM usage_logs
        WHERE org_id = ${orgId} AND timestamp >= ${since}
        GROUP BY model_name
        ORDER BY cost DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COALESCE(SUM(cost_total), 0) as cost,
          COALESCE(SUM(tokens_total), 0) as tokens,
          COUNT(*) as requests
        FROM usage_logs
        WHERE org_id = ${orgId} AND timestamp >= ${since}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `,
    ]);

    const current = (currentMetrics as any[])[0];
    const previous = (previousMetrics as any[])[0];
    const costChange = previous.total_cost > 0 
      ? ((current.total_cost - previous.total_cost) / previous.total_cost) * 100 
      : 0;

    const result = {
      headline: {
        monthlyBurn: Number(current.total_cost),
        burnChange: Number(costChange.toFixed(2)),
        totalTokens: Number(current.total_tokens),
        avgLatency: Number(current.avg_latency),
        requestCount: Number(current.request_count),
      },
      providers: (providerBreakdown as any[]).map(p => ({
        name: p.provider_name,
        slug: p.provider_slug,
        cost: Number(p.cost),
        tokens: Number(p.tokens),
      })),
      models: (modelBreakdown as any[]).map(m => ({
        name: m.model_name,
        cost: Number(m.cost),
        tokens: Number(m.tokens),
      })),
      dailyTrend: (dailyTrend as any[]).map(d => ({
        date: d.date,
        cost: Number(d.cost),
        tokens: Number(d.tokens),
        requests: Number(d.requests),
      })),
    };

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  static async getBurnRate(orgId: string) {
    const since = subDays(new Date(), 30);
    
    const data = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COALESCE(SUM(cost_total), 0) as cost
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    const dailyCosts = (data as any[]).map(d => Number(d.cost));
    const avgDaily = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
    const projectedMonthly = avgDaily * 30;
    
    // Simple trend calculation
    const firstHalf = dailyCosts.slice(0, Math.floor(dailyCosts.length / 2));
    const secondHalf = dailyCosts.slice(Math.floor(dailyCosts.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return {
      avgDailyBurn: Number(avgDaily.toFixed(2)),
      projectedMonthlyBurn: Number(projectedMonthly.toFixed(2)),
      trend: Number(trend.toFixed(2)),
      daysAnalyzed: dailyCosts.length,
    };
  }

  static async getCostDistribution(orgId: string, days: number) {
    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        provider_id,
        model_name,
        request_type,
        COALESCE(SUM(cost_total), 0) as cost,
        COALESCE(SUM(tokens_total), 0) as tokens
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY provider_id, model_name, request_type
      ORDER BY cost DESC
    `;

    const totalCost = (data as any[]).reduce((sum, row) => sum + Number(row.cost), 0);
    
    return (data as any[]).map(row => ({
      providerId: row.provider_id,
      modelName: row.model_name,
      requestType: row.request_type,
      cost: Number(row.cost),
      tokens: Number(row.tokens),
      percentage: totalCost > 0 ? Number(((Number(row.cost) / totalCost) * 100).toFixed(2)) : 0,
    }));
  }

  static async getEfficiencyMetrics(orgId: string, days: number) {
    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        model_name,
        COALESCE(AVG(cost_total / NULLIF(tokens_total, 0)), 0) as cost_per_token,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COUNT(*) as request_count
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY model_name
      HAVING COUNT(*) > 5
      ORDER BY cost_per_token ASC
    `;

    return (data as any[]).map(row => ({
      modelName: row.model_name,
      costPerToken: Number(row.cost_per_token),
      avgLatency: Number(row.avg_latency),
      totalCost: Number(row.total_cost),
      requestCount: Number(row.request_count),
    }));
  }
}
