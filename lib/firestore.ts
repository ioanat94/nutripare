import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { NutritionSettings, SavedComparison, SavedProduct } from '@/types/firestore';

const VALID_RATINGS = new Set(['positive', 'info', 'warning', 'negative']);

export async function saveProduct(
  uid: string,
  product: { name: string; ean: string },
): Promise<void> {
  const col = collection(db, 'users', uid, 'products');
  const snapshot = await getDocs(query(col, where('ean', '==', product.ean)));
  if (!snapshot.empty) throw new Error('DUPLICATE');
  await addDoc(col, product);
}

export async function saveComparison(
  uid: string,
  comparison: { name: string; eans: string[] },
): Promise<void> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  const sortedInput = [...comparison.eans].sort().join(',');
  const isDuplicate = snapshot.docs.some(
    (d) =>
      [...(d.data().eans as string[])].sort().join(',') === sortedInput,
  );
  if (isDuplicate) throw new Error('DUPLICATE');
  await addDoc(col, comparison);
}

export async function getSavedProductEans(
  uid: string,
  eans: string[],
): Promise<Set<string>> {
  if (eans.length === 0) return new Set();
  const col = collection(db, 'users', uid, 'products');
  const snapshot = await getDocs(query(col, where('ean', 'in', eans)));
  return new Set(snapshot.docs.map((d) => d.data().ean as string));
}

export async function isComparisonSaved(
  uid: string,
  eans: string[],
): Promise<boolean> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  const sortedInput = [...eans].sort().join(',');
  return snapshot.docs.some(
    (d) =>
      [...(d.data().eans as string[])].sort().join(',') === sortedInput,
  );
}

export async function deleteProduct(uid: string, ean: string): Promise<void> {
  const col = collection(db, 'users', uid, 'products');
  const snapshot = await getDocs(query(col, where('ean', '==', ean)));
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
}

export async function deleteComparison(
  uid: string,
  eans: string[],
): Promise<void> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  const sortedInput = [...eans].sort().join(',');
  for (const doc of snapshot.docs) {
    if (
      [...(doc.data().eans as string[])].sort().join(',') === sortedInput
    ) {
      await deleteDoc(doc.ref);
    }
  }
}

export async function getSavedProducts(uid: string): Promise<SavedProduct[]> {
  const col = collection(db, 'users', uid, 'products');
  const snapshot = await getDocs(col);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as SavedProduct,
  );
}

export async function getSavedComparisons(
  uid: string,
): Promise<SavedComparison[]> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as SavedComparison,
  );
}

const DEFAULT_ROW_KEYS = [
  'kcals',
  'protein',
  'carbohydrates',
  'sugar',
  'fat',
  'saturated_fat',
  'fiber',
  'salt',
];

export async function getNutritionSettings(
  uid: string,
): Promise<NutritionSettings | null> {
  const ref = doc(db, 'users', uid, 'settings', 'nutrition');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const raw = snap.data() as Record<string, unknown> & { rules?: NutritionSettings['rules'] };

  const visibleRows: string[] =
    (raw.visibleRows as string[] | undefined) ??
    (raw.visibleNutrients as string[] | undefined) ??
    [...DEFAULT_ROW_KEYS];
  const rowOrder: string[] =
    (raw.rowOrder as string[] | undefined) ??
    (raw.nutrientOrder as string[] | undefined) ??
    [...DEFAULT_ROW_KEYS];

  if (!visibleRows.includes('computed_score')) visibleRows.push('computed_score');
  if (!rowOrder.includes('computed_score')) rowOrder.push('computed_score');

  return {
    visibleRows,
    showCrown: (raw.showCrown as boolean | undefined) ?? true,
    showFlag: (raw.showFlag as boolean | undefined) ?? true,
    rules: ((raw.rules ?? []) as NutritionSettings['rules']).filter((r) =>
      VALID_RATINGS.has(r.rating),
    ),
    rowOrder,
  };
}

export async function saveNutritionSettings(
  uid: string,
  settings: NutritionSettings,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'settings', 'nutrition');
  await setDoc(ref, settings);
}
