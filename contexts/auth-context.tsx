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
import type { FirestoreUser } from '@/types/firestore';

interface AuthContextValue {
  user: FirestoreUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

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
            products: [],
            comparisons: [],
          };
          await setDoc(docRef, newUser);
          setUser(newUser);
        } else {
          setUser(snapshot.data() as FirestoreUser);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
