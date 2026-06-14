import { prisma } from '../../lib/prisma';
import { subDays } from 'date-fns';
import axios from 'axios';

export class AlertEngine {
  static async processAlerts() {
    const alerts = await prisma.alert.findMany({ where: { isActive: true }, include: { user: true } });
    for (const alert of alerts) {
      const triggered = await this.checkAlert(alert);
      if (triggered) {
        await this.sendNotifications(alert, triggered);
        await prisma.alertHistory.create({
          data: { alertId: alert.id, value: triggered.value, message: triggered.message, sentTo: alert.channels },
        });
        await prisma.alert.update({
          where: { id: alert.id },
          data: { lastTriggeredAt: new Date(), triggerCount: { increment: 1 } },
        });
      }
    }
  }

  private static async checkAlert(alert: any) {
    const since = subDays(new Date(), 30);
    let currentValue = 0;

    switch (alert.alertType) {
      case 'BUDGET_THRESHOLD':
        const spend = await prisma.$queryRaw`
          SELECT COALESCE(SUM(cost_total), 0) as total FROM usage_logs
          WHERE org_id = ${alert.user.orgId} AND timestamp >= ${since}
        `;
        currentValue = Number((spend as any[])[0].total);
        break;
      case 'SPIKE_DETECTION':
        const today = await prisma.$queryRaw`
          SELECT COALESCE(SUM(cost_total), 0) as total FROM usage_logs
          WHERE org_id = ${alert.user.orgId} AND DATE(timestamp) = CURRENT_DATE
        `;
        const avgDaily = await prisma.$queryRaw`
          SELECT COALESCE(AVG(daily_cost), 0) as avg FROM (
            SELECT DATE(timestamp) as date, SUM(cost_total) as daily_cost
            FROM usage_logs WHERE org_id = ${alert.user.orgId} AND timestamp >= ${subDays(new Date(), 30)}
            GROUP BY DATE(timestamp)
          ) subq
        `;
        const todayVal = Number((today as any[])[0].total);
        const avgVal = Number((avgDaily as any[])[0].avg);
        if (avgVal > 0 && todayVal > avgVal * 2) {
          return { value: todayVal, message: `Daily spend $${todayVal.toFixed(2)} is 2x above average $${avgVal.toFixed(2)}` };
        }
        return null;
    }

    const threshold = Number(alert.thresholdValue);
    const shouldTrigger = alert.comparison === 'gt' ? currentValue > threshold :
                         alert.comparison === 'lt' ? currentValue < threshold :
                         alert.comparison === 'gte' ? currentValue >= threshold : currentValue <= threshold;

    if (shouldTrigger) {
      return { value: currentValue, message: `${alert.name} triggered. Current: $${currentValue.toFixed(2)}, Threshold: $${threshold.toFixed(2)}` };
    }
    return null;
  }

  private static async sendNotifications(alert: any, triggered: any) {
    if (alert.channels.includes('webhook') && alert.webhookUrl) {
      try {
        await axios.post(alert.webhookUrl, {
          alert: alert.name, message: triggered.message, value: triggered.value, timestamp: new Date().toISOString(),
        });
      } catch (e) { console.error('Webhook failed:', e); }
    }
  }
}