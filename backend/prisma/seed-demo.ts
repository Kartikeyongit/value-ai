import { PrismaClient, RecSeverity, RecStatus, AlertType } from '@prisma/client';
import { subDays, addDays, format } from 'date-fns';

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = 'demo@valueai.io';
const DEMO_PASSWORD_HASH = '$2b$12$6lSp2nqxufBxAeVV9KUmKOr2PLnB5zJvsEFW6SP0/MzPJMVa2ggMi'; // bcrypt hash for 'demo1234'

// Provider configurations with realistic model sets
const PROVIDER_CONFIGS = [
  { slug: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-5.4', 'gpt-5.4-nano', 'text-embedding-3-large'], weights: [0.45, 0.25, 0.15, 0.10, 0.05] },
  { slug: 'anthropic', models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'], weights: [0.55, 0.15, 0.30] },
  { slug: 'google-gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-ultra'], weights: [0.40, 0.50, 0.10] },
  { slug: 'mistral', models: ['mistral-large', 'mistral-medium', 'mistral-small'], weights: [0.35, 0.35, 0.30] },
  { slug: 'cohere', models: ['command-r-plus', 'command-r', 'embed-english-v3'], weights: [0.30, 0.50, 0.20] },
  { slug: 'azure-openai', models: ['gpt-4o', 'gpt-4', 'text-embedding-ada-002'], weights: [0.60, 0.25, 0.15] },
  { slug: 'aws-bedrock', models: ['anthropic.claude-3-sonnet', 'amazon.titan', 'meta.llama3-70b'], weights: [0.50, 0.30, 0.20] },
  { slug: 'stability-ai', models: ['sd-xl', 'sd-3', 'sd-ultra'], weights: [0.50, 0.35, 0.15], type: 'image' },
  { slug: 'deepseek', models: ['deepseek-chat', 'deepseek-coder'], weights: [0.70, 0.30] },
  { slug: 'perplexity', models: ['pplx-7b', 'pplx-70b', 'pplx-online'], weights: [0.20, 0.30, 0.50] },
  { slug: 'xai-grok', models: ['grok-1', 'grok-1.5'], weights: [0.40, 0.60] },
  { slug: 'replicate', models: ['llama-2-70b', 'mistral-7b', 'flux-schnell'], weights: [0.30, 0.30, 0.40], type: 'image' },
  { slug: 'hugging-face', models: ['meta-llama-3-70b', 'mixtral-8x7b'], weights: [0.55, 0.45] },
  { slug: 'meta-llama', models: ['llama-3-70b', 'llama-3-8b', 'llama-3-405b'], weights: [0.40, 0.45, 0.15] },
  { slug: 'midjourney', models: ['midjourney-v6', 'midjourney-niji'], weights: [0.70, 0.30], type: 'image' },
];

// Team/project structure
const TEAMS = [
  { name: 'Engineering', color: '#6366f1', projects: ['API Gateway', 'Chat Service', 'Embedding Pipeline'] },
  { name: 'Data Science', color: '#8b5cf6', projects: ['Model Training', 'Experiment Runner', 'Evaluation Suite'] },
  { name: 'Product', color: '#ec4899', projects: ['Content Generator', 'Image Studio', 'Search Enhancement'] },
  { name: 'Marketing', color: '#f59e0b', projects: ['Copy Assistant', 'Ad Generator', 'Social Media Bot'] },
  { name: 'Customer Success', color: '#10b981', projects: ['Support Bot', 'Ticket Classifier', 'Sentiment Analyzer'] },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generateSeasonalMultiplier(date: Date): number {
  const day = date.getDay();
  const hour = date.getHours();
  const month = date.getMonth();

  // Weekend dip
  let multiplier = (day === 0 || day === 6) ? 0.35 : 1.0;

  // Business hours boost (9am-6pm)
  if (hour >= 9 && hour <= 18) multiplier *= 1.4;
  else if (hour >= 0 && hour <= 5) multiplier *= 0.15;
  else multiplier *= 0.6;

  // Monthly seasonality (Q4 spike)
  if (month >= 9) multiplier *= 1.25;
  if (month === 11) multiplier *= 1.4; // December holiday prep

  // Random daily variation
  multiplier *= randomBetween(0.7, 1.3);

  return multiplier;
}

async function main() {
  console.log('🌱 Seeding massive demo data...');

  // 1. Create demo organization and user
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Acme AI Corp',
      slug: 'demo-org',
      plan: 'ENTERPRISE',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { orgId: org.id },
    create: {
      email: DEMO_USER_EMAIL,
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Demo',
      lastName: 'User',
      role: 'ADMIN',
      orgId: org.id,
    },
  });

  console.log(`✅ Org: ${org.name} | User: ${user.email}`);

  // 2. Create teams and projects
  const teamRecords = [];
  const projectRecords = [];
  for (const teamDef of TEAMS) {
    const team = await prisma.team.create({
      data: { orgId: org.id, name: teamDef.name, color: teamDef.color },
    });
    teamRecords.push(team);
    for (const projName of teamDef.projects) {
      const project = await prisma.project.create({
        data: { orgId: org.id, teamId: team.id, name: projName },
      });
      projectRecords.push(project);
    }
  }
  console.log(`✅ Created ${teamRecords.length} teams, ${projectRecords.length} projects`);

  // 3. Create provider credentials (connect 10 out of 15 providers)
  const allProviders = await prisma.provider.findMany();
  const connectedProviders = allProviders.slice(0, 10);
  const credentialRecords = [];

  for (const provider of connectedProviders) {
    const credential = await prisma.providerCredential.create({
      data: {
        userId: user.id,
        providerId: provider.id,
        credentialType: 'API_KEY',
        encryptedKey: 'encrypted_demo_key_placeholder',
        keyLastFour: Math.random().toString(36).substring(2, 6),
        region: provider.regions[0] || 'us-east-1',
        isActive: true,
        lastSyncedAt: new Date(),
        lastSyncStatus: 'SUCCESS',
      },
    });
    credentialRecords.push({ credential, provider });
  }
  console.log(`✅ Connected ${credentialRecords.length} providers`);

  // 4. Generate massive usage logs (90 days, hourly granularity)
  console.log('📊 Generating usage logs (this may take a moment)...');
  const DAYS = 90;
  const HOURS_PER_DAY = 24;
  const totalHours = DAYS * HOURS_PER_DAY;
  const usageLogs = [];
  const now = new Date();

  // Pricing reference for cost calculation
  const pricingMap = await prisma.pricingModel.findMany({
    where: { isCurrent: true },
    include: { provider: true },
  });

  const getPrice = (providerId: string, modelId: string) => {
    const price = pricingMap.find(p => p.providerId === providerId && p.modelId === modelId);
    if (!price) return { input: 0.000005, output: 0.000015, image: 0.04 };
    return {
      input: Number(price.inputPrice) / 1_000_000,
      output: Number(price.outputPrice) / 1_000_000,
      image: price.imagePrice ? Number(price.imagePrice) : 0.04,
    };
  };

  let logCount = 0;
  for (let d = 0; d < DAYS; d++) {
    const date = subDays(now, d);
    const seasonalMult = generateSeasonalMultiplier(date);

    for (let h = 0; h < HOURS_PER_DAY; h++) {
      const hourDate = new Date(date);
      hourDate.setHours(h, 0, 0, 0);

      // Each hour, generate logs for random subset of providers
      const activeProviders = credentialRecords.filter(() => Math.random() < 0.7);

      for (const { credential, provider } of activeProviders) {
        const config = PROVIDER_CONFIGS.find(c => c.slug === provider.slug);
        if (!config) continue;

        const modelName = weightedRandom(config.models, config.weights);
        const isImage = config.type === 'image';
        const project = projectRecords[Math.floor(Math.random() * projectRecords.length)];

        // Base request count with seasonal multiplier
        const baseRequests = isImage
          ? Math.floor(randomBetween(5, 50) * seasonalMult)
          : Math.floor(randomBetween(20, 200) * seasonalMult);

        if (baseRequests <= 0) continue;

        const prices = getPrice(provider.id, modelName);

        if (isImage) {
          const cost = baseRequests * prices.image * randomBetween(0.8, 1.2);
          usageLogs.push({
            orgId: org.id,
            providerId: provider.id,
            credentialId: credential.id,
            projectId: project.id,
            modelId: modelName,
            modelName: modelName,
            tokensIn: 0,
            tokensOut: 0,
            tokensTotal: baseRequests,
            costInput: 0,
            costOutput: 0,
            costTotal: cost,
            latencyMs: Math.floor(randomBetween(1500, 8000)),
            statusCode: Math.random() < 0.98 ? 200 : 429,
            region: credential.region,
            requestType: 'image_generation',
            endpoint: '/v1/generations',
            timestamp: hourDate,
          });
        } else {
          const tokensIn = Math.floor(randomBetween(200, 4000) * randomBetween(0.8, 1.5));
          const tokensOut = Math.floor(randomBetween(150, 3000) * randomBetween(0.8, 1.5));
          const costIn = tokensIn * baseRequests * prices.input;
          const costOut = tokensOut * baseRequests * prices.output;
          const totalCost = costIn + costOut;

          usageLogs.push({
            orgId: org.id,
            providerId: provider.id,
            credentialId: credential.id,
            projectId: project.id,
            modelId: modelName,
            modelName: modelName,
            tokensIn: tokensIn * baseRequests,
            tokensOut: tokensOut * baseRequests,
            tokensTotal: (tokensIn + tokensOut) * baseRequests,
            costInput: costIn,
            costOutput: costOut,
            costTotal: totalCost,
            latencyMs: Math.floor(randomBetween(150, 3500)),
            statusCode: Math.random() < 0.97 ? 200 : Math.random() < 0.5 ? 429 : 500,
            region: credential.region,
            requestType: 'chat',
            endpoint: '/v1/chat/completions',
            timestamp: hourDate,
          });
        }

        logCount++;
        if (logCount % 5000 === 0) {
          console.log(`  ... ${logCount} logs generated`);
        }
      }
    }
  }

  // Batch insert in chunks of 1000
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < usageLogs.length; i += CHUNK_SIZE) {
    const chunk = usageLogs.slice(i, i + CHUNK_SIZE);
    await prisma.usageLog.createMany({ data: chunk, skipDuplicates: true });
  }
  console.log(`✅ Inserted ${usageLogs.length.toLocaleString()} usage logs`);

  // 5. Create billing records
  const billingRecords = [];
  for (let m = 0; m < 4; m++) {
    const period = format(subDays(now, m * 30), 'yyyy-MM');
    const periodStart = subDays(now, (m + 1) * 30);
    const periodEnd = subDays(now, m * 30);

    const periodSpend = await prisma.$queryRaw`
      SELECT COALESCE(SUM(cost_total), 0) as total FROM usage_logs
      WHERE org_id = ${org.id} AND timestamp >= ${periodStart} AND timestamp < ${periodEnd}
    `;

    billingRecords.push({
      orgId: org.id,
      period,
      amount: Number((periodSpend as any[])[0].total),
      currency: 'USD',
      status: m === 0 ? 'projected' : 'confirmed',
    });
  }

  await prisma.billingRecord.createMany({ data: billingRecords });
  console.log(`✅ Created ${billingRecords.length} billing records`);

  // 6. Create recommendations with realistic savings data
  const recommendations = [
    {
      orgId: org.id,
      category: 'MODEL_DOWNGRADE',
      severity: 'HIGH',
      title: 'Switch from GPT-4o to GPT-5.4-nano for 40% of traffic',
      description: 'Analysis shows 42% of your GPT-4o requests are simple Q&A tasks with low complexity scores. GPT-5.4-nano would handle these at 1/33rd the cost with <5% quality degradation.',
      currentMonthlyCost: 4850.00,
      recommendedMonthlyCost: 2450.00,
      monthlySavings: 2400.00,
      savingsPercent: 49.48,
      annualSavings: 28800.00,
      currentProvider: connectedProviders[0]?.id || 'openai',
      recommendedProvider: connectedProviders[0]?.id || 'openai',
      currentModel: 'gpt-4o',
      recommendedModel: 'gpt-5.4-nano',
      confidenceScore: 0.92,
      status: 'ACTIVE',
      evidence: [{ trafficShare: 0.42, qualityImpact: 0.05, costReduction: 0.97 }],
    },
    {
      orgId: org.id,
      category: 'VOLUME_DISCOUNT',
      severity: 'CRITICAL',
      title: 'Enterprise tier unlocks 35% discount on OpenAI',
      description: 'Your monthly OpenAI spend of $4,850 exceeds the $4,000 Enterprise tier threshold. Upgrading would immediately reduce all rates by 35% with no commitment change.',
      currentMonthlyCost: 4850.00,
      recommendedMonthlyCost: 3152.50,
      monthlySavings: 1697.50,
      savingsPercent: 35.00,
      annualSavings: 20370.00,
      currentPlan: 'Pay-as-you-go',
      recommendedPlan: 'Enterprise Tier',
      currentProvider: connectedProviders[0]?.id || 'openai',
      confidenceScore: 0.98,
      status: 'ACTIVE',
      evidence: [{ currentSpend: 4850, threshold: 4000, discountRate: 0.35 }],
    },
    {
      orgId: org.id,
      category: 'DUPLICATE_USAGE',
      severity: 'MEDIUM',
      title: 'Consolidate Claude usage: OpenAI + Bedrock',
      description: 'Your Engineering team uses Claude 3.5 Sonnet via Anthropic ($1,240/mo) while Data Science uses the same model via AWS Bedrock ($980/mo). Consolidating to one provider unlocks volume pricing.',
      currentMonthlyCost: 2220.00,
      recommendedMonthlyCost: 1554.00,
      monthlySavings: 666.00,
      savingsPercent: 30.00,
      annualSavings: 7992.00,
      currentProvider: connectedProviders[1]?.id || 'anthropic',
      recommendedProvider: connectedProviders[6]?.id || 'aws-bedrock',
      confidenceScore: 0.85,
      status: 'ACTIVE',
      evidence: [{ anthropicSpend: 1240, bedrockSpend: 980, overlapModel: 'claude-3-5-sonnet' }],
    },
    {
      orgId: org.id,
      category: 'CAPACITY_RIGHTSIZING',
      severity: 'HIGH',
      title: 'Over-provisioned: Gemini Ultra usage at 8% of capacity',
      description: 'You are paying for Gemini Ultra reserved capacity (100K requests/mo) but only utilizing 8,200 requests. Downgrading to on-demand would save $1,800/mo with no performance impact.',
      currentMonthlyCost: 2100.00,
      recommendedMonthlyCost: 300.00,
      monthlySavings: 1800.00,
      savingsPercent: 85.71,
      annualSavings: 21600.00,
      currentPlan: 'Reserved Capacity 100K',
      recommendedPlan: 'Pay-as-you-go',
      currentProvider: connectedProviders[2]?.id || 'google-gemini',
      confidenceScore: 0.95,
      status: 'ACTIVE',
      evidence: [{ reservedCapacity: 100000, actualUsage: 8200, utilizationRate: 0.082 }],
    },
    {
      orgId: org.id,
      category: 'REGION_OPTIMIZATION',
      severity: 'MEDIUM',
      title: 'EU workloads should run on EU-West endpoints',
      description: '32% of your EU-based team traffic is hitting US-East endpoints, incurring 15% cross-region data transfer fees. Routing to EU-West-1 would eliminate these surcharges.',
      currentMonthlyCost: 850.00,
      recommendedMonthlyCost: 722.50,
      monthlySavings: 127.50,
      savingsPercent: 15.00,
      annualSavings: 1530.00,
      currentProvider: connectedProviders[5]?.id || 'azure-openai',
      confidenceScore: 0.78,
      status: 'ACTIVE',
      evidence: [{ euTrafficShare: 0.32, surchargeRate: 0.15, currentRegion: 'us-east-1', recommendedRegion: 'eu-west-1' }],
    },
    {
      orgId: org.id,
      category: 'UNUSED_RESOURCE',
      severity: 'LOW',
      title: 'Stale Hugging Face integration — 45 days inactive',
      description: 'The Hugging Face credential has not synced usage in 45 days. The integration is likely abandoned by a former team member.',
      currentMonthlyCost: 0,
      recommendedMonthlyCost: 0,
      monthlySavings: 0,
      savingsPercent: 0,
      annualSavings: 0,
      currentProvider: connectedProviders[11]?.id || 'unknown',
      confidenceScore: 0.88,
      status: 'ACTIVE',
      evidence: [{ daysInactive: 45, lastSync: subDays(now, 45) }],
    },
  ];

  await prisma.recommendation.createMany({ data: recommendations });
  console.log(`✅ Created ${recommendations.length} recommendations`);

  // 7. Create forecasts
  const forecasts = [];
  const dailySpend = await prisma.$queryRaw`
    SELECT DATE(timestamp) as date, COALESCE(SUM(cost_total), 0) as cost
    FROM usage_logs WHERE org_id = ${org.id}
    GROUP BY DATE(timestamp) ORDER BY date ASC
  `;

  const dailyCosts = (dailySpend as any[]).map(d => Number(d.cost)).filter((value) => Number.isFinite(value));
  const avgDaily = dailyCosts.length > 0 ? dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length : 0;
  const trend = 0.02; // 2% daily growth trend

  for (let i = 1; i <= 30; i++) {
    const projected = Number.isFinite(avgDaily)
      ? avgDaily * Math.pow(1 + trend, i)
      : 0;
    const variance = projected * 0.15;
    forecasts.push({
      orgId: org.id,
      period: format(addDays(now, i), 'yyyy-MM-dd'),
      periodType: 'day',
      projectedCost: projected,
      lowerBound: Math.max(0, projected - variance),
      upperBound: projected + variance,
      confidence: Math.max(0.6, 0.95 - i * 0.01),
      providerBreakdown: {},
      modelBreakdown: {},
    });
  }
  await prisma.forecast.createMany({ data: forecasts });
  console.log(`✅ Created ${forecasts.length} day-ahead forecasts`);

  // 8. Create waste detections
  const wasteDetections = [
    {
      orgId: org.id,
      detectionType: 'over_provisioned',
      severity: 'HIGH',
      providerId: connectedProviders[2]?.id,
      modelId: 'gemini-ultra',
      title: 'Gemini Ultra reserved capacity severely underutilized',
      description: 'Reserved for 100K requests/mo but only 8,200 used (8.2%). Immediate downgrade recommended.',
      estimatedWaste: 1800.00,
      evidence: [{ utilizationRate: 0.082, reservedCapacity: 100000, actualUsage: 8200 }],
    },
    {
      orgId: org.id,
      detectionType: 'duplicate',
      severity: 'MEDIUM',
      providerId: connectedProviders[1]?.id,
      modelId: 'claude-3-5-sonnet',
      title: 'Duplicate Claude usage across Anthropic and Bedrock',
      description: 'Same model accessed via two providers, fragmenting volume and preventing tier discounts.',
      estimatedWaste: 666.00,
      evidence: [{ provider1: 'anthropic', provider2: 'aws-bedrock', combinedSpend: 2220 }],
    },
    {
      orgId: org.id,
      detectionType: 'unused',
      severity: 'MEDIUM',
      providerId: connectedProviders[11]?.id,
      title: 'Hugging Face integration dormant for 45 days',
      description: 'No sync activity since creation. Likely abandoned credential.',
      estimatedWaste: 0,
      evidence: [{ daysSinceLastSync: 45 }],
    },
    {
      orgId: org.id,
      detectionType: 'downgrade',
      severity: 'HIGH',
      providerId: connectedProviders[0]?.id,
      modelId: 'gpt-4o',
      title: '42% of GPT-4o traffic eligible for GPT-5.4-nano downgrade',
      description: 'Low-complexity queries detected. Nano model would handle at 97% lower cost.',
      estimatedWaste: 2400.00,
      evidence: [{ eligibleTrafficShare: 0.42, qualityScoreThreshold: 0.85, costReduction: 0.97 }],
    },
  ];
  await prisma.wasteDetection.createMany({ data: wasteDetections });
  console.log(`✅ Created ${wasteDetections.length} waste detections`);

  // 9. Create alerts
  const alerts = [
    {
      userId: user.id,
      name: 'Monthly Budget Alert',
      description: 'Notify when monthly spend exceeds $8,000',
      alertType: 'BUDGET_THRESHOLD',
      thresholdValue: 8000,
      thresholdUnit: 'USD',
      comparison: 'gt',
      channels: ['email', 'slack'],
      emailRecipients: ['demo@valueai.io'],
      isActive: true,
    },
    {
      userId: user.id,
      name: 'Daily Spike Detector',
      description: 'Alert when daily spend is 2x above 30-day average',
      alertType: 'SPIKE_DETECTION',
      thresholdValue: 2,
      thresholdUnit: 'multiplier',
      comparison: 'gt',
      channels: ['email', 'webhook'],
      webhookUrl: 'https://hooks.slack.com/services/demo/webhook',
      isActive: true,
    },
    {
      userId: user.id,
      name: 'Anomaly: OpenAI Cost Surge',
      description: 'Detect unusual cost patterns on OpenAI provider',
      alertType: 'ANOMALY_DETECTION',
      thresholdValue: 500,
      thresholdUnit: 'USD',
      comparison: 'gt',
      providerId: connectedProviders[0]?.id,
      channels: ['email'],
      emailRecipients: ['demo@valueai.io'],
      isActive: true,
    },
    {
      userId: user.id,
      name: 'New Savings Opportunity',
      description: 'Alert when a new recommendation could save >$500/mo',
      alertType: 'NEW_RECOMMENDATION',
      thresholdValue: 500,
      thresholdUnit: 'USD',
      comparison: 'gt',
      channels: ['email', 'slack'],
      isActive: true,
    },
  ];
  await prisma.alert.createMany({ data: alerts });
  console.log(`✅ Created ${alerts.length} alerts`);

  // 10. Create webhooks
  const webhooks = [
    {
      userId: user.id,
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/FAKE/FAKE/FAKE_PLACEHOLDER',
      secret: 'whsec_demo_secret_key',
      events: ['usage.spike', 'cost.anomaly', 'recommendation.new'],
      isActive: true,
    },
    {
      userId: user.id,
      name: 'Discord Alerts',
      url: 'https://discord.com/api/webhooks/FAKE/FAKE_PLACEHOLDER',
      events: ['alert.triggered', 'forecast.exceeded'],
      isActive: true,
    },
  ];
  await prisma.webhook.createMany({ data: webhooks });
  console.log(`✅ Created ${webhooks.length} webhooks`);

  // 11. Create API keys
  const apiKeys = [
    { userId: user.id, name: 'Production API Key', keyHash: 'hash_placeholder_1', keyPrefix: 'va_prod', scopes: ['read:usage', 'read:analytics'], isActive: true },
    { userId: user.id, name: 'CI/CD Integration', keyHash: 'hash_placeholder_2', keyPrefix: 'va_ci', scopes: ['read:usage'], isActive: true, teamId: teamRecords[0]?.id },
  ];
  await prisma.apiKey.createMany({ data: apiKeys });
  console.log(`✅ Created ${apiKeys.length} API keys`);

  // Summary
  const totalUsageCost = await prisma.$queryRaw`
    SELECT COALESCE(SUM(cost_total), 0) as total FROM usage_logs WHERE org_id = ${org.id}
  `;
  const totalSavings = recommendations.filter(r => r.status === 'ACTIVE').reduce((s, r) => s + r.monthlySavings, 0);

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🎉 DEMO DATA SEED COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Organization:     ${org.name}`);
  console.log(`  User:             ${user.email} (password: any)`);
  console.log(`  Teams:            ${teamRecords.length}`);
  console.log(`  Projects:         ${projectRecords.length}`);
  console.log(`  Providers:        ${credentialRecords.length} connected`);
  console.log(`  Usage Logs:       ${usageLogs.length.toLocaleString()} records`);
  console.log(`  Total Spend:      $${Number((totalUsageCost as any[])[0].total).toFixed(2)}`);
  console.log(`  Recommendations:  ${recommendations.length} ($${totalSavings.toFixed(2)}/mo potential savings)`);
  console.log(`  Forecasts:        ${forecasts.length} days`);
  console.log(`  Waste Detections: ${wasteDetections.length}`);
  console.log(`  Alerts:           ${alerts.length}`);
  console.log(`  Webhooks:         ${webhooks.length}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('  Login with: demo@valueai.io / any password');
  console.log('  Backend:    http://localhost:3001');
  console.log('  Frontend:   http://localhost:3000');
  console.log('');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });