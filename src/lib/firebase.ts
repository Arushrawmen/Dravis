/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase Client SDK Initialization
 * Self-contained static configuration for 100% robust Hostinger production builds
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "esoteric-petal-q48x0",
  appId: "1:643663663851:web:e9f8a12928083c99b8a4ae",
  apiKey: "AIzaSyCFeSetoVF1eJASDiRskKzGGn8Ikk6_fw",
  authDomain: "esoteric-petal-q48x0.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dravis-9cbd734a-e70b-4638-bbac-0a08477bcccd",
  storageBucket: "esoteric-petal-q48x0.firebasestorage.app",
  messagingSenderId: "643663663851",
  measurementId: "",
  oAuthClientId: "643663663851-5j2o7jcdb4k4rser325mdtir1r8vaouc.apps.googleusercontent.com",
  recaptchaSiteKey: "",
};

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
