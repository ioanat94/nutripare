'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { saveNutritionSettings } from '@/lib/firestore';
import type { FirestoreUser } from '@/types/firestore';
import { BUILTIN_RULESETS } from '@/utils/thresholds';

interface AuthContextValue {
  user: FirestoreUser | null;
  loading: boolean;
  emailVerified: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
          const newUser: FirestoreUser = {
            id: firebaseUser.uid,
            displayName:
              firebaseUser.displayName ??
              firebaseUser.email?.split('@')[0] ??
              'User',
          };
          await setDoc(docRef, newUser);

          await saveNutritionSettings(firebaseUser.uid, {
            visibleRows: ['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'],
            rowOrder: ['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'],
            showCrown: true,
            showFlag: true,
            rulesets: BUILTIN_RULESETS,
          });

          setUser(newUser);
        } else {
          setUser(snapshot.data() as FirestoreUser);
        }
        setEmailVerified(firebaseUser.emailVerified);
      } else {
        setUser(null);
        setEmailVerified(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
