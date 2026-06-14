export interface ProviderConfig {
  id: string;
  slug: string;
  name: string;
  category: string;
  oauthEnabled: boolean;
  regions: string[];
}

export interface UsageMetrics {
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  costInput: number;
  costOutput: number;
  costTotal: number;
  latencyMs: number;
  requests: number;
}

export interface CostBreakdown {
  provider: string;
  model: string;
  cost: number;
  percentage: number;
}

export interface ForecastData {
  period: string;
  projectedCost: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface WasteItem {
  type: string;
  severity: string;
  title: string;
  description: string;
  estimatedWaste: number;
  evidence: any[];
}

export interface RecommendationItem {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  monthlySavings: number;
  savingsPercent: number;
  currentPlan?: string;
  recommendedPlan?: string;
  currentProvider?: string;
  recommendedProvider?: string;
  confidenceScore: number;
  status: string;
}
