import type { OFFProductResponse, ProductNutrition } from '@/types/openfoodfacts';

export function parseEanInput(raw: string): string[] {
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
}

export function mapProduct(raw: OFFProductResponse, code: string): ProductNutrition {
  const n = raw.product?.nutriments ?? {};
  return {
    code,
    product_name: raw.product?.product_name ?? '',
    kcals: n['energy-kcal_100g'],
    protein: n.proteins_100g,
    carbohydrates: n.carbohydrates_100g,
    sugar: n.sugars_100g,
    fat: n.fat_100g,
    saturated_fat: n['saturated-fat_100g'],
    fiber: n.fiber_100g,
    salt: n.salt_100g,
  };
}

export async function fetchProduct(code: string): Promise<ProductNutrition | null> {
  const res = await fetch(`/api/product/${code}`);
  const json: OFFProductResponse = await res.json();
  if (json.status === 0) return null;
  return mapProduct(json, code);
}
