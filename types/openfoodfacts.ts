export interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fat_100g?: number;
  'saturated-fat_100g'?: number;
  fiber_100g?: number;
  salt_100g?: number;
}

export interface OFFProductResponse {
  status: number;
  status_verbose: string;
  product?: {
    code: string;
    product_name: string;
    nutriments: OFFNutriments;
  };
}

export interface ProductNutrition {
  code: string;
  product_name: string;
  kcals?: number;
  protein?: number;
  carbohydrates?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  fiber?: number;
  salt?: number;
}
