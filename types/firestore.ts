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
}

export type ThresholdColor = 'positive' | 'info' | 'warning' | 'negative';

export interface NutritionRule {
  nutrient: string;
  direction: 'above' | 'below';
  value: number;
  rating: ThresholdColor;
}

export interface NutritionSettings {
  visibleNutrients: string[];
  showCrown: boolean;
  showFlag: boolean;
  rules: NutritionRule[];
  nutrientOrder?: string[];
}
