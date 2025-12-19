
export type CalcMode = 'standard' | 'scientific' | 'ai';

export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  isAi?: boolean;
  explanation?: string;
}

export interface AiResponse {
  answer: string;
  explanation: string;
  steps: string[];
}
