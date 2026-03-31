import { ThresholdColor } from './firestore';

type ThresholdDirection = 'above' | 'below';

interface ThresholdCondition {
  color: ThresholdColor;
  when: ThresholdDirection;
  value: number;
}

export type NutrientThresholds = Record<string, ThresholdCondition[]>;
