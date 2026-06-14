import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const providers = [
  { slug: 'openai', name: 'OpenAI', category: 'LLM', regions: ['us-east-1', 'eu-west-1'], oauthEnabled: false },
  { slug: 'anthropic', name: 'Anthropic', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'google-gemini', name: 'Google Gemini', category: 'LLM', regions: ['us-central1', 'europe-west1'], oauthEnabled: true },
  { slug: 'mistral', name: 'Mistral', category: 'LLM', regions: ['eu-west-1'], oauthEnabled: false },
  { slug: 'cohere', name: 'Cohere', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'azure-openai', name: 'Azure OpenAI', category: 'LLM', regions: ['eastus', 'westeurope'], oauthEnabled: true },
  { slug: 'aws-bedrock', name: 'AWS Bedrock', category: 'LLM', regions: ['us-east-1', 'eu-west-1'], oauthEnabled: true },
  { slug: 'stability-ai', name: 'Stability AI', category: 'IMAGE', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'deepseek', name: 'DeepSeek', category: 'LLM', regions: ['ap-east-1'], oauthEnabled: false },
  { slug: 'perplexity', name: 'Perplexity', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'xai-grok', name: 'xAI Grok', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'replicate', name: 'Replicate', category: 'IMAGE', regions: ['us-west-1'], oauthEnabled: false },
  { slug: 'hugging-face', name: 'Hugging Face', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'meta-llama', name: 'Meta Llama', category: 'LLM', regions: ['us-east-1'], oauthEnabled: false },
  { slug: 'midjourney', name: 'Midjourney', category: 'IMAGE', regions: ['us-east-1'], oauthEnabled: false },
];

const pricingModels = [
  { providerSlug: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o', category: 'CHAT', inputPrice: 5.00, outputPrice: 15.00, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'openai', modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', category: 'CHAT', inputPrice: 0.15, outputPrice: 0.60, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'openai', modelId: 'gpt-5.4', modelName: 'GPT-5.4', category: 'CHAT', inputPrice: 2.50, outputPrice: 10.00, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'openai', modelId: 'gpt-5.4-nano', modelName: 'GPT-5.4 Nano', category: 'CHAT', inputPrice: 0.05, outputPrice: 0.20, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'anthropic', modelId: 'claude-3-5-sonnet', modelName: 'Claude 3.5 Sonnet', category: 'CHAT', inputPrice: 3.00, outputPrice: 15.00, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'anthropic', modelId: 'claude-3-haiku', modelName: 'Claude 3 Haiku', category: 'CHAT', inputPrice: 0.25, outputPrice: 1.25, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'google-gemini', modelId: 'gemini-1.5-pro', modelName: 'Gemini 1.5 Pro', category: 'CHAT', inputPrice: 3.50, outputPrice: 10.50, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'google-gemini', modelId: 'gemini-1.5-flash', modelName: 'Gemini 1.5 Flash', category: 'CHAT', inputPrice: 0.35, outputPrice: 1.05, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'mistral', modelId: 'mistral-large', modelName: 'Mistral Large', category: 'CHAT', inputPrice: 2.00, outputPrice: 6.00, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'deepseek', modelId: 'deepseek-chat', modelName: 'DeepSeek Chat', category: 'CHAT', inputPrice: 0.14, outputPrice: 0.28, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'aws-bedrock', modelId: 'anthropic.claude-3-sonnet', modelName: 'Claude 3 Sonnet (Bedrock)', category: 'CHAT', inputPrice: 3.00, outputPrice: 15.00, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'stability-ai', modelId: 'sd-xl', modelName: 'Stable Diffusion XL', category: 'IMAGE_GENERATION', inputPrice: 0, outputPrice: 0, imagePrice: 0.04, planTier: 'PAY_AS_YOU_GO' },
  { providerSlug: 'midjourney', modelId: 'midjourney-v6', modelName: 'Midjourney V6', category: 'IMAGE_GENERATION', inputPrice: 0, outputPrice: 0, imagePrice: 0.08, planTier: 'PAY_AS_YOU_GO' },
];

async function main() {
  console.log('Seeding database...');
  for (const p of providers) {
    await prisma.provider.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  for (const pm of pricingModels) {
    const provider = await prisma.provider.findUnique({ where: { slug: pm.providerSlug } });
    if (!provider) continue;
    await prisma.pricingModel.create({
      data: {
        providerId: provider.id, modelId: pm.modelId, modelName: pm.modelName,
        category: pm.category, inputPrice: pm.inputPrice, outputPrice: pm.outputPrice,
        imagePrice: pm.imagePrice || null, planTier: pm.planTier, effectiveFrom: new Date('2024-01-01'),
      },
    });
  }
  console.log('Seed completed');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
