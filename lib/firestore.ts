import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

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
