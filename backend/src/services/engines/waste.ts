import { prisma } from '../../lib/prisma';
import { subDays } from 'date-fns';

export class WasteDetectionEngine {
  static async detectWaste(orgId: string) {
    const since = subDays(new Date(), 30);
    const detections = [];

    const unusedCredentials = await prisma.$queryRaw`
      SELECT 
        pc.id, pc.provider_id, p.name as provider_name,
        pc.last_synced_at, pc.created_at
      FROM provider_credentials pc
      JOIN providers p ON p.id = pc.provider_id
      WHERE pc.user_id IN (SELECT id FROM users WHERE org_id = ${orgId})
      AND (pc.last_synced_at IS NULL OR pc.last_synced_at < ${subDays(new Date(), 14)})
      AND pc.created_at < ${subDays(new Date(), 7)}
    `;

    for (const cred of unusedCredentials as any[]) {
      detections.push({
        orgId, detectionType: 'unused', severity: 'MEDIUM',
        providerId: cred.provider_id, credentialId: cred.id,
        title: `Unused ${cred.provider_name} integration`,
        description: `No sync activity for 14+ days. Consider removing this integration.`,
        estimatedWaste: 0,
        evidence: [{ lastSync: cred.last_synced_at, createdAt: cred.created_at }],
      });
    }

    const overProvisioned = await prisma.$queryRaw`
      SELECT 
        model_name,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COUNT(*) as request_count,
        COALESCE(AVG(cost_total), 0) as avg_cost_per_request
      FROM usage_logs
      WHERE org_id = ${orgId} AND timestamp >= ${since}
      GROUP BY model_name
      HAVING COUNT(*) < 100 AND COALESCE(SUM(cost_total), 0) > 500
      ORDER BY avg_cost_per_request DESC
    `;

    for (const model of overProvisioned as any[]) {
      detections.push({
        orgId, detectionType: 'over_provisioned', severity: 'HIGH',
        modelId: model.model_name,
        title: `Over-provisioned: ${model.model_name}`,
        description: `Low usage (${model.request_count} requests) but high cost ($${Number(model.total_cost).toFixed(2)}). Consider downgrading.`,
        estimatedWaste: Number(model.total_cost) * 0.6,
        evidence: [{ requestCount: model.request_count, avgCost: model.avg_cost_per_request }],
      });
    }

    const saved = [];
    for (const d of detections) {
      const created = await prisma.wasteDetection.create({ data: d });
      saved.push(created);
    }
    return saved;
  }
}