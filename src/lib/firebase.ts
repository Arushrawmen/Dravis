/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase Client SDK Initialization
 * Loads configuration statically from firebase-applet-config.json
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton safely without duplicating app instances
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Client Authentication
export const auth = getAuth(app);

// Google Auth Provider for Sign-In with Popup
export const googleAuthProvider = new GoogleAuthProvider();

// Scopes for basic profile and email
googleAuthProvider.addScope("email");
googleAuthProvider.addScope("profile");
googleAuthProvider.addScope("openid");

// Ensure consent prompt when requested
googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});
