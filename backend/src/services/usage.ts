import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../lib/redis';
import { logger } from '../utils/logger';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export class UsageService {
  static async bulkIngest(providerId: string, credentialId: string, records: any[]) {
    const credential = await prisma.providerCredential.findUnique({
      where: { id: credentialId },
      include: { provider: true },
    });

    if (!credential) throw new Error('Credential not found');
    const orgId = credential.providerId; // In real app, get from credential -> user -> org

    // For MVP, we'll create usage logs directly
    // In production, this would go through a queue (Bull/BullMQ)
    const data = records.map(r => ({
      orgId: credential.providerId, // Simplified for MVP
      providerId,
      credentialId,
      modelId: r.modelId,
      modelName: r.modelName,
      tokensIn: r.tokensIn || 0,
      tokensOut: r.tokensOut || 0,
      tokensTotal: r.tokensTotal || (r.tokensIn + r.tokensOut),
      costInput: r.costInput || 0,
      costOutput: r.costOutput || 0,
      costTotal: r.costTotal || (r.costInput + r.costOutput),
      latencyMs: r.latencyMs || 0,
      statusCode: r.statusCode || 200,
      region: r.region || 'us-east-1',
      requestType: r.requestType || 'chat',
      endpoint: r.endpoint,
      timestamp: new Date(r.timestamp),
      rawPayload: r,
    }));

    const result = await prisma.usageLog.createMany({
      data,
      skipDuplicates: true,
    });

    // Invalidate caches
    await cacheInvalidatePattern(`usage:*`);
    
    logger.info(`Ingested ${result.count} usage records for provider ${providerId}`);
    return result;
  }

  static async ingestCSV(orgId: string, records: any[]) {
    // Transform CSV format to internal format
    const transformed = records.map(r => ({
      orgId,
      providerId: r.provider_id || r.provider || 'unknown',
      modelId: r.model || r.model_id || 'unknown',
      modelName: r.model_name || r.model || 'unknown',
      tokensIn: parseInt(r.tokens_in) || parseInt(r.input_tokens) || 0,
      tokensOut: parseInt(r.tokens_out) || parseInt(r.output_tokens) || 0,
      tokensTotal: parseInt(r.total_tokens) || 0,
      costInput: parseFloat(r.cost_input) || 0,
      costOutput: parseFloat(r.cost_output) || 0,
      costTotal: parseFloat(r.cost_total) || parseFloat(r.cost) || 0,
      latencyMs: parseInt(r.latency_ms) || parseInt(r.latency) || 0,
      statusCode: parseInt(r.status_code) || 200,
      region: r.region || 'us-east-1',
      requestType: r.request_type || 'chat',
      endpoint: r.endpoint,
      timestamp: new Date(r.timestamp || r.date || Date.now()),
    }));

    const result = await prisma.usageLog.createMany({
      data: transformed,
      skipDuplicates: true,
    });

    await cacheInvalidatePattern(`usage:*`);
    return result.count;
  }

  static async getSummary(orgId: string, days: number) {
    const cacheKey = `usage:summary:${orgId}:${days}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const since = subDays(new Date(), days);
    
    const [metrics, previousMetrics] = await Promise.all([
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
        AND timestamp >= ${subDays(since, days)}
        AND timestamp < ${since}
      `,
    ]);

    const current = (metrics as any[])[0];
    const previous = (previousMetrics as any[])[0];
    
    const costChange = previous.total_cost > 0 
      ? ((current.total_cost - previous.total_cost) / previous.total_cost) * 100 
      : 0;

    const result = {
      totalCost: Number(current.total_cost),
      totalTokens: Number(current.total_tokens),
      avgLatency: Number(current.avg_latency),
      requestCount: Number(current.request_count),
      costChange: Number(costChange.toFixed(2)),
      period: `${days} days`,
    };

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  static async getTimeline(orgId: string, days: number, groupBy: string) {
    const cacheKey = `usage:timeline:${orgId}:${days}:${groupBy}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const since = subDays(new Date(), days);
    
    let dateTrunc: string;
    switch (groupBy) {
      case 'week': dateTrunc = 'week'; break;
      case 'month': dateTrunc = 'month'; break;
      default: dateTrunc = 'day'; break;
    }

    const data = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${dateTrunc}, timestamp) as period,
        COALESCE(SUM(cost_total), 0) as cost,
        COALESCE(SUM(tokens_total), 0) as tokens,
        COUNT(*) as requests,
        COALESCE(AVG(latency_ms), 0) as latency
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY DATE_TRUNC(${dateTrunc}, timestamp)
      ORDER BY period ASC
    `;

    const result = (data as any[]).map(row => ({
      period: row.period,
      cost: Number(row.cost),
      tokens: Number(row.tokens),
      requests: Number(row.requests),
      latency: Number(row.latency),
    }));

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  static async getByProvider(orgId: string, days: number) {
    const cacheKey = `usage:by-provider:${orgId}:${days}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        p.id as provider_id,
        p.name as provider_name,
        p.slug as provider_slug,
        COALESCE(SUM(ul.cost_total), 0) as total_cost,
        COALESCE(SUM(ul.tokens_total), 0) as total_tokens,
        COUNT(*) as request_count,
        COALESCE(AVG(ul.latency_ms), 0) as avg_latency
      FROM providers p
      LEFT JOIN usage_logs ul ON ul.provider_id = p.id 
        AND ul.org_id = ${orgId} 
        AND ul.timestamp >= ${since}
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.slug
      HAVING COALESCE(SUM(ul.cost_total), 0) > 0
      ORDER BY total_cost DESC
    `;

    const totalCost = (data as any[]).reduce((sum, row) => sum + Number(row.total_cost), 0);
    
    const result = (data as any[]).map(row => ({
      providerId: row.provider_id,
      providerName: row.provider_name,
      providerSlug: row.provider_slug,
      totalCost: Number(row.total_cost),
      totalTokens: Number(row.total_tokens),
      requestCount: Number(row.request_count),
      avgLatency: Number(row.avg_latency),
      percentage: totalCost > 0 ? Number(((Number(row.total_cost) / totalCost) * 100).toFixed(2)) : 0,
    }));

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  static async getByModel(orgId: string, days: number, providerId?: string) {
    const cacheKey = `usage:by-model:${orgId}:${days}:${providerId || 'all'}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        model_id,
        model_name,
        provider_id,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COALESCE(SUM(tokens_total), 0) as total_tokens,
        COUNT(*) as request_count,
        COALESCE(AVG(latency_ms), 0) as avg_latency
      FROM usage_logs
      WHERE org_id = ${orgId} 
        AND timestamp >= ${since}
        ${providerId ? prisma.$queryRaw`AND provider_id = ${providerId}` : prisma.$queryRaw``}
      GROUP BY model_id, model_name, provider_id
      ORDER BY total_cost DESC
      LIMIT 50
    `;

    const result = (data as any[]).map(row => ({
      modelId: row.model_id,
      modelName: row.model_name,
      providerId: row.provider_id,
      totalCost: Number(row.total_cost),
      totalTokens: Number(row.total_tokens),
      requestCount: Number(row.request_count),
      avgLatency: Number(row.avg_latency),
    }));

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  static async getByTeam(orgId: string, days: number) {
    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.color as team_color,
        COALESCE(SUM(ul.cost_total), 0) as total_cost,
        COUNT(*) as request_count
      FROM teams t
      LEFT JOIN projects p ON p.team_id = t.id
      LEFT JOIN usage_logs ul ON ul.project_id = p.id 
        AND ul.timestamp >= ${since}
      WHERE t.org_id = ${orgId}
      GROUP BY t.id, t.name, t.color
      ORDER BY total_cost DESC
    `;

    return (data as any[]).map(row => ({
      teamId: row.team_id,
      teamName: row.team_name,
      teamColor: row.team_color,
      totalCost: Number(row.total_cost),
      requestCount: Number(row.request_count),
    }));
  }

  static async getLatencyCorrelation(orgId: string, days: number) {
    const since = subDays(new Date(), days);
    
    const data = await prisma.$queryRaw`
      SELECT 
        model_id,
        model_name,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        COALESCE(AVG(cost_total), 0) as avg_cost,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COUNT(*) as request_count
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY model_id, model_name
      HAVING COUNT(*) > 10
      ORDER BY avg_latency DESC
    `;

    return (data as any[]).map(row => ({
      modelId: row.model_id,
      modelName: row.model_name,
      avgLatency: Number(row.avg_latency),
      avgCost: Number(row.avg_cost),
      totalCost: Number(row.total_cost),
      requestCount: Number(row.request_count),
    }));
  }
}
