export interface PainPoint {
  title: string
  impact: string
  sourceValidation: string
  difficulty: string
  tam: string
  demand: string
  aiSolution: string
}

export interface ResearchResponse {
  market: string
  sourceSignals: Record<string, string>
  painPoints: PainPoint[]
}

export interface BuildPath {
  type: string
  name: string
  tagline: string
  description: string
  buildTime: string
  priceRange: string
  revenueTarget: string
  tools: string[]
  features: string[]
  idealCustomer: string
  unfairAdvantage: string
}

export interface BuildResponse {
  painDeep: string
  competitorGap: string
  sourceEvidence: Record<string, string>
  buildPaths: BuildPath[]
}

export interface SearchHistoryRow {
  id: number
  query: string
  pain_count: number
  created_at: string
}

export interface StarredRow {
  id: number
  query: string
  pain_title: string
  pain_impact: string
  difficulty: string
  tam: string
  demand: string
  ai_solution: string
  buildPaths: unknown[]
  created_at: string
}

export interface StatsResponse {
  totalSearches: number
  opportunitiesFound: number
  painPoints: number
  buildPaths: number
  starredCount: number
}
