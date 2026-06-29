export type AIHandler = (context: Record<string,unknown>, prompt: string) => Promise<string>;
export interface IntelligenceAdapter { classify(prompt: string, context: Record<string,unknown>): Promise<string>; }
