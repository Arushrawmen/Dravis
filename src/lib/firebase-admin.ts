/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase Admin SDK Initialization
 * Uses direct static import of firebase-applet-config.json as mandated by skill guidelines.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "../../firebase-applet-config.json";

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
