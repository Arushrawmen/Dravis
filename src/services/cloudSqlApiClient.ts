/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Client-Side API Client for Cloud SQL Service Layer (Project: gen-lang-client-0889094097)
 * Strictly passes fresh in-memory Firebase Auth ID Tokens in the Authorization header.
 * Stores NO credentials or tokens in localStorage or sessionStorage.
 */

import { auth } from "../lib/firebase";

export interface DatabaseRecord {
  id: number;
  userId?: number;
  title: string;
  category: string;
  payload?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class CloudSqlApiClient {
  /**
   * Retrieve in-memory ID token from active Firebase auth session
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("[CloudSqlApiClient] Could not retrieve Firebase ID token:", err);
      }
    }

    return headers;
  }

  private async safeJson(res: Response): Promise<any> {
    try {
      const text = await res.text();
      if (text && text.trim().startsWith("{")) {
        return JSON.parse(text);
      }
      return { success: res.ok, status: res.status };
    } catch {
      return { success: false, error: "Invalid response from server" };
    }
  }

  /**
   * Synchronize authenticated user profile to Cloud SQL
   */
  public async syncUser(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/db/sync-user", {
        method: "POST",
        headers,
      });
      return await this.safeJson(res);
    } catch (err: any) {
      return { success: false, error: err.message || "Network request failed" };
    }
  }

  /**
   * Retrieve all records strictly belonging to the authenticated user
   */
  public async getRecords(): Promise<{ success: boolean; records?: DatabaseRecord[]; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/db/records", {
        method: "GET",
        headers,
      });
      return await this.safeJson(res);
    } catch (err: any) {
      return { success: false, error: err.message || "Network request failed" };
    }
  }

  /**
   * Create a new database record securely linked to authenticated user
   */
  public async createRecord(
    title: string,
    category = "GENERAL",
    payload?: any
  ): Promise<{ success: boolean; record?: DatabaseRecord; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/db/records", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          category,
          payload: typeof payload === "object" ? JSON.stringify(payload) : payload,
        }),
      });
      return await this.safeJson(res);
    } catch (err: any) {
      return { success: false, error: err.message || "Network request failed" };
    }
  }

  /**
   * Update a database record
   */
  public async updateRecord(
    recordId: number,
    data: Partial<{ title: string; category: string; payload: string; status: string }>
  ): Promise<{ success: boolean; record?: DatabaseRecord; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`/api/db/records/${recordId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      return await this.safeJson(res);
    } catch (err: any) {
      return { success: false, error: err.message || "Network request failed" };
    }
  }

  /**
   * Delete a database record
   */
  public async deleteRecord(recordId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`/api/db/records/${recordId}`, {
        method: "DELETE",
        headers,
      });
      return await this.safeJson(res);
    } catch (err: any) {
      return { success: false, error: err.message || "Network request failed" };
    }
  }
}

export const cloudSqlApiClient = new CloudSqlApiClient();
