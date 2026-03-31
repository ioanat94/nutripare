import type {
  NutritionRule,
  NutritionSettings,
  Report,
  ReportStatus,
  SavedComparison,
  SavedProduct,
} from '@/types/firestore';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { DEFAULT_NUTRITION_ROWS } from '@/utils/constants';
import { db } from '@/lib/firebase';
import { getDefaultRules } from '@/utils/getDefaultRules';

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
): Promise<string> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  const sortedInput = [...comparison.eans].sort().join(',');
  const isDuplicate = snapshot.docs.some(
    (d) => [...(d.data().eans as string[])].sort().join(',') === sortedInput,
  );
  if (isDuplicate) throw new Error('DUPLICATE');
  const docRef = await addDoc(col, comparison);
  return docRef.id;
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

export async function findSavedComparison(
  uid: string,
  eans: string[],
): Promise<{ id: string; name: string; rulesetId?: string } | null> {
  const col = collection(db, 'users', uid, 'comparisons');
  const snapshot = await getDocs(col);
  const sortedInput = [...eans].sort().join(',');
  for (const d of snapshot.docs) {
    if ([...(d.data().eans as string[])].sort().join(',') === sortedInput) {
      return {
        id: d.id,
        name: d.data().name as string,
        rulesetId: d.data().rulesetId as string | undefined,
      };
    }
  }
  return null;
}

export async function isComparisonSaved(
  uid: string,
  eans: string[],
): Promise<boolean> {
  const result = await findSavedComparison(uid, eans);
  return result !== null;
}

export async function updateComparisonRuleset(
  uid: string,
  comparisonId: string,
  rulesetId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'comparisons', comparisonId);
  await updateDoc(ref, { rulesetId });
}

export async function updateComparisonEans(
  uid: string,
  id: string,
  eans: string[],
): Promise<void> {
  const ref = doc(db, 'users', uid, 'comparisons', id);
  await updateDoc(ref, { eans });
}

export async function deleteComparisonById(
  uid: string,
  id: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'comparisons', id);
  await deleteDoc(ref);
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
    if ([...(doc.data().eans as string[])].sort().join(',') === sortedInput) {
      await deleteDoc(doc.ref);
    }
  }
}

export async function renameComparison(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'comparisons', id);
  await updateDoc(ref, { name });
}

export async function getSavedProducts(uid: string): Promise<SavedProduct[]> {
  const col = collection(db, 'users', uid, 'products');
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedProduct);
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

export async function getNutritionSettings(
  uid: string,
): Promise<NutritionSettings | null> {
  const ref = doc(db, 'users', uid, 'settings', 'nutrition');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const raw = snap.data() as Record<string, unknown>;

  const visibleRows: string[] = (raw.visibleRows as string[] | undefined) ??
    (raw.visibleNutrients as string[] | undefined) ?? [
      ...DEFAULT_NUTRITION_ROWS,
    ];
  const rowOrder: string[] = (raw.rowOrder as string[] | undefined) ??
    (raw.nutrientOrder as string[] | undefined) ?? [...DEFAULT_NUTRITION_ROWS];

  if (!visibleRows.includes('computed_score'))
    visibleRows.push('computed_score');
  if (!rowOrder.includes('computed_score')) rowOrder.push('computed_score');

  let rulesets: NutritionSettings['rulesets'];
  if (raw.rulesets) {
    rulesets = (raw.rulesets as NutritionSettings['rulesets']).map((rs) => ({
      ...rs,
      rules: (rs.rules ?? []).filter((r: NutritionRule) =>
        VALID_RATINGS.has(r.rating),
      ),
    }));
  } else {
    const oldRules = ((raw.rules ?? []) as NutritionRule[]).filter((r) =>
      VALID_RATINGS.has(r.rating),
    );
    rulesets =
      oldRules.length > 0
        ? [{ id: 'default', name: 'Default', rules: oldRules }]
        : [{ id: 'default', name: 'Default', rules: getDefaultRules() }];
  }

  return {
    visibleRows,
    showCrown: (raw.showCrown as boolean | undefined) ?? true,
    showFlag: (raw.showFlag as boolean | undefined) ?? true,
    rulesets,
    rowOrder,
  };
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const productDocs = await getDocs(collection(db, 'users', uid, 'products'));
  await Promise.all(productDocs.docs.map((d) => deleteDoc(d.ref)));

  const comparisonDocs = await getDocs(
    collection(db, 'users', uid, 'comparisons'),
  );
  await Promise.all(comparisonDocs.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, 'users', uid, 'settings', 'nutrition'));
  await deleteDoc(doc(db, 'users', uid));
}

export async function saveNutritionSettings(
  uid: string,
  settings: NutritionSettings,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'settings', 'nutrition');
  await setDoc(ref, settings);
}

export async function getAllReports(): Promise<Report[]> {
  const snapshot = await getDocs(collection(db, 'reports'));
  return snapshot.docs.map((d) => ({ code: d.id, ...d.data() }) as Report);
}

export async function updateReportStatus(
  code: string,
  status: ReportStatus,
): Promise<void> {
  await updateDoc(doc(db, 'reports', code), { status });
}
