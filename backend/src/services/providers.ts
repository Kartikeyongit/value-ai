import { prisma } from '../lib/prisma';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import { UsageService } from './usage';

export class ProviderService {
  static async syncProvider(credentialId: string) {
    const credential = await prisma.providerCredential.findUnique({
      where: { id: credentialId },
      include: { provider: true },
    });

    if (!credential) throw new Error('Credential not found');

    const job = await prisma.syncJob.create({
      data: {
        credentialId,
        status: 'running',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsInserted: 0,
      },
    });

    try {
      // Decrypt key for sync (never log this)
      const key = decrypt(credential.encryptedKey);
      
      // Route to provider-specific sync implementation
      const records = await this.syncByProvider(credential.provider.slug, key, credential.region);
      
      // Ingest usage data
      let inserted = 0;
      for (const batch of this.chunkArray(records, 1000)) {
        const result = await UsageService.bulkIngest(credential.providerId, credentialId, batch);
        inserted += result.count;
      }

      await prisma.providerCredential.update({
        where: { id: credentialId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsProcessed: records.length,
          recordsInserted: inserted,
        },
      });

      logger.info(`Sync completed for ${credential.provider.name}: ${inserted} records`);
      return job;
    } catch (error: any) {
      await prisma.providerCredential.update({
        where: { id: credentialId },
        data: {
          lastSyncStatus: 'FAILED',
          syncError: error.message,
        },
      });

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  private static async syncByProvider(slug: string, key: string, region?: string | null): Promise<any[]> {
    // In production, these would call actual provider APIs
    // For MVP, we simulate realistic data based on provider patterns
    const generators: Record<string, () => any[]> = {
      openai: () => this.generateMockUsage('openai', ['gpt-4o', 'gpt-4o-mini', 'gpt-5.4', 'gpt-5.4-nano', 'text-embedding-3-large']),
      anthropic: () => this.generateMockUsage('anthropic', ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku']),
      'google-gemini': () => this.generateMockUsage('google-gemini', ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-ultra']),
      mistral: () => this.generateMockUsage('mistral', ['mistral-large', 'mistral-medium', 'mistral-small']),
      cohere: () => this.generateMockUsage('cohere', ['command-r-plus', 'command-r', 'embed-english-v3']),
      'azure-openai': () => this.generateMockUsage('azure-openai', ['gpt-4o', 'gpt-4', 'text-embedding-ada-002']),
      'aws-bedrock': () => this.generateMockUsage('aws-bedrock', ['anthropic.claude-3-sonnet', 'amazon.titan', 'meta.llama3-70b']),
      'stability-ai': () => this.generateMockUsage('stability-ai', ['sd-xl', 'sd-3', 'sd-ultra'], 'image'),
      deepseek: () => this.generateMockUsage('deepseek', ['deepseek-chat', 'deepseek-coder']),
      perplexity: () => this.generateMockUsage('perplexity', ['pplx-7b', 'pplx-70b', 'pplx-online']),
      'xai-grok': () => this.generateMockUsage('xai-grok', ['grok-1', 'grok-1.5']),
      replicate: () => this.generateMockUsage('replicate', ['llama-2-70b', 'mistral-7b', 'flux-schnell'], 'image'),
      'hugging-face': () => this.generateMockUsage('hugging-face', ['meta-llama-3-70b', 'mixtral-8x7b']),
      'meta-llama': () => this.generateMockUsage('meta-llama', ['llama-3-70b', 'llama-3-8b', 'llama-3-405b']),
      midjourney: () => this.generateMockUsage('midjourney', ['midjourney-v6', 'midjourney-niji'], 'image'),
    };

    const generator = generators[slug];
    if (!generator) {
      throw new Error(`Provider ${slug} not supported`);
    }

    return generator();
  }

  private static generateMockUsage(provider: string, models: string[], type: 'text' | 'image' = 'text'): any[] {
    const records = [];
    const now = new Date();
    const days = 30;
    
    for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      
      // Weekend dip
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 0.4 : 1.0;
      
      // Random variation
      const dailyVariation = 0.7 + Math.random() * 0.6;
      
      for (const model of models) {
        const requests = Math.floor((50 + Math.random() * 200) * baseMultiplier * dailyVariation);
        
        if (type === 'image') {
          const costPerImage = 0.02 + Math.random() * 0.08;
          records.push({
            modelId: model,
            modelName: model,
            tokensIn: 0,
            tokensOut: 0,
            tokensTotal: requests,
            costInput: 0,
            costOutput: 0,
            costTotal: requests * costPerImage,
            latencyMs: 2000 + Math.random() * 4000,
            statusCode: 200,
            region: 'us-east-1',
            requestType: 'image_generation',
            endpoint: '/v1/generations',
            timestamp: date.toISOString(),
          });
        } else {
          const avgTokensIn = 500 + Math.random() * 2000;
          const avgTokensOut = 300 + Math.random() * 1500;
          const inputPrice = (0.5 + Math.random() * 5) / 1_000_000;
          const outputPrice = (1.5 + Math.random() * 15) / 1_000_000;
          
          records.push({
            modelId: model,
            modelName: model,
            tokensIn: Math.floor(requests * avgTokensIn),
            tokensOut: Math.floor(requests * avgTokensOut),
            tokensTotal: Math.floor(requests * (avgTokensIn + avgTokensOut)),
            costInput: requests * avgTokensIn * inputPrice,
            costOutput: requests * avgTokensOut * outputPrice,
            costTotal: requests * (avgTokensIn * inputPrice + avgTokensOut * outputPrice),
            latencyMs: 200 + Math.random() * 2000,
            statusCode: 200,
            region: 'us-east-1',
            requestType: 'chat',
            endpoint: '/v1/chat/completions',
            timestamp: date.toISOString(),
          });
        }
      }
    }
    
    return records;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
