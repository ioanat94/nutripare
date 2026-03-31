export interface FirestoreUser {
  id: string;
  displayName: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  ean: string;
}

export interface SavedComparison {
  id: string;
  name: string;
  eans: string[];
  rulesetId?: string;
}

export type ThresholdColor = 'positive' | 'info' | 'warning' | 'negative';

export interface NutritionRule {
  nutrient: string;
  direction: 'above' | 'below';
  value: number;
  rating: ThresholdColor;
}

export interface NutritionRuleset {
  id: string;
  name: string;
  rules: NutritionRule[];
}

export interface NutritionSettings {
  visibleRows: string[];
  showCrown: boolean;
  showFlag: boolean;
  rulesets: NutritionRuleset[];
  rowOrder?: string[];
}

export type ReportStatus = 'open' | 'solved' | 'dismissed';
export type ReportReason = 'incorrect data' | 'missing product';
export interface Report {
  code: string;
  date: import('firebase/firestore').Timestamp;
  reason: ReportReason;
  status: ReportStatus;
}
