/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Workspace OAuth & Firebase Authentication Service
 * Strictly conforms to in-memory access token security guidelines.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with Gmail Workspace scopes
export const provider = new GoogleAuthProvider();

export const GOOGLE_WORKSPACE_SCOPES = [
  // Gmail Scopes
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  // Google Drive Scopes
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  // Google Calendar Scopes
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  // Google Contacts (People API) Scopes
  "https://www.googleapis.com/auth/contacts",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/directory.readonly",
  "https://www.googleapis.com/auth/user.addresses.read",
  "https://www.googleapis.com/auth/user.birthday.read",
  "https://www.googleapis.com/auth/user.emails.read",
  "https://www.googleapis.com/auth/user.gender.read",
  "https://www.googleapis.com/auth/user.organization.read",
  "https://www.googleapis.com/auth/user.phonenumbers.read",
];

export const GMAIL_SCOPES = GOOGLE_WORKSPACE_SCOPES;
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];
export const CONTACTS_SCOPES = [
  "https://www.googleapis.com/auth/contacts",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/directory.readonly",
  "https://www.googleapis.com/auth/user.addresses.read",
  "https://www.googleapis.com/auth/user.birthday.read",
  "https://www.googleapis.com/auth/user.emails.read",
  "https://www.googleapis.com/auth/user.gender.read",
  "https://www.googleapis.com/auth/user.organization.read",
  "https://www.googleapis.com/auth/user.phonenumbers.read",
];

// Register all scopes with GoogleAuthProvider
GOOGLE_WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Set custom parameters to prompt user for consent if needed
provider.setCustomParameters({
  prompt: "consent",
  access_type: "offline",
});

// Flag to track sign-in in progress
let isSigningIn = false;

// Strictly in-memory caching for OAuth Access Token (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be triggered from a user click / gesture
export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to obtain OAuth access token from Firebase Auth credential");
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("[Google Workspace Auth Error]:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCachedUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};
