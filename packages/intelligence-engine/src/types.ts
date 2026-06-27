export interface IntelligenceAdapter { classify(prompt: string, context: Record<string,unknown>): Promise<string>; }
