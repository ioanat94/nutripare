import type {
  OFFProductResponse,
  ProductNutrition,
} from '@/types/openfoodfacts';

function isValidEanCheckDigit(code: string): boolean {
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function parseEanInput(raw: string): {
  valid: string[];
  invalid: string[];
} {
  const tokens = [
    ...new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (/^\d{8}(\d{5})?$/.test(token) && isValidEanCheckDigit(token)) {
      valid.push(token);
    } else {
      invalid.push(token);
    }
  }
  return { valid, invalid };
}

function resolveProductName(product: OFFProductResponse['product']): string {
  if (!product) return '';
  if (product.product_name) return product.product_name;
  if (product.product_name_en) return product.product_name_en;
  if (product.product_name_fi) return product.product_name_fi;
  const fallback = Object.entries(product).find(
    ([k, v]) => k.startsWith('product_name_') && typeof v === 'string' && v,
  );
  return fallback ? (fallback[1] as string) : '';
}

export function mapProduct(
  raw: OFFProductResponse,
  code: string,
): ProductNutrition {
  const n = raw.product?.nutriments ?? {};
  return {
    code,
    product_name: resolveProductName(raw.product),
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

export async function fetchProduct(
  code: string,
): Promise<ProductNutrition | null> {
  const res = await fetch(`/api/product/${code}`);
  if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`);
  const json: OFFProductResponse = await res.json();
  if (json.status === 0) return null;
  return mapProduct(json, code);
}
