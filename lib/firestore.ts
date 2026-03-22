import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { SavedComparison, SavedProduct } from '@/types/firestore';

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
