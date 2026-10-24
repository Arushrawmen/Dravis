/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase Authentication Context & Provider
 * Manages ID tokens strictly in memory (NEVER in localStorage/sessionStorage)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken as getFirebaseIdToken,
} from "firebase/auth";
import { auth, googleAuthProvider } from "../lib/firebase";

export interface AuthContextType {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // In-memory token storage (never localStorage / sessionStorage)
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Retrieve fresh ID token in memory
  const getIdToken = useCallback(
    async (forceRefresh: boolean = false): Promise<string | null> => {
      if (!auth.currentUser) return null;
      try {
        const token = await getFirebaseIdToken(auth.currentUser, forceRefresh);
        setIdToken(token);
        return token;
      } catch (err) {
        console.error("Failed to retrieve Firebase ID token:", err);
        return null;
      }
    },
    []
  );

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await getFirebaseIdToken(currentUser);
          setIdToken(token);
        } catch {
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In with popup
  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setUser(result.user);
      const token = await getFirebaseIdToken(result.user);
      setIdToken(token);
    } catch (err: any) {
      console.error("Firebase Sign-In error:", err);
      throw err;
    }
  }, []);

  // Sign out & clear in-memory tokens
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIdToken(null);
    } catch (err: any) {
      console.error("Firebase Sign-Out error:", err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        signInWithGoogle,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
