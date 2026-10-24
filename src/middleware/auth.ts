/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Backend Firebase Auth Verification Middleware
 * Validates in-memory Bearer ID Tokens to protect Cloud SQL API routes.
 */

import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
