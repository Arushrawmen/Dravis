/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Drive REST API v3 Client Service (drive.googleapis.com)
 */

import { getAccessToken } from "./googleAuth";

export interface DriveAboutInfo {
  user: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  storageQuota: {
    limit?: string; // in bytes
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
  maxUploadSize?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  starred: boolean;
  trashed: boolean;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  owners?: Array<{ displayName: string; emailAddress: string; photoLink?: string }>;
  capabilities?: {
    canDelete?: boolean;
    canDownload?: boolean;
    canEdit?: boolean;
    canShare?: boolean;
    canTrash?: boolean;
  };
  isFolder: boolean;
}

const DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

export class GoogleDriveApiClient {
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please sign in with Google to access your Google Drive.");
    }
    return { Authorization: `Bearer ${token}` };
  }

  // 1. Get About Info & Storage Quota
  public async getAbout(): Promise<DriveAboutInfo> {
    const headers = await this.getAuthHeader();
    const url = `${DRIVE_BASE_URL}/about?fields=user,storageQuota,maxUploadSize`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Drive information: ${res.statusText}`);
    }
    return res.json();
  }

  // 2. List Files & Folders
  public async listFiles(options?: {
    q?: string;
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    folderId?: string;
    includeTrashed?: boolean;
  }): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
    const headers = await this.getAuthHeader();
    const params = new URLSearchParams();

    let queryParts: string[] = [];
    if (!options?.includeTrashed) {
      queryParts.push("trashed = false");
    }

    if (options?.folderId && options.folderId !== "root") {
      queryParts.push(`'${options.folderId}' in parents`);
    } else if (options?.folderId === "root") {
      queryParts.push(`'root' in parents`);
    }

    if (options?.q) {
      queryParts.push(options.q);
    }

    if (queryParts.length > 0) {
      params.set("q", queryParts.join(" and "));
    }

    params.set("pageSize", String(options?.pageSize || 30));
    params.set(
      "fields",
      "nextPageToken, files(id, name, mimeType, description, starred, trashed, parents, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, modifiedTime, size, owners, capabilities)"
    );
    params.set("orderBy", options?.orderBy || "folder,modifiedTime desc");

    const url = `${DRIVE_BASE_URL}/files?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Drive files: ${res.statusText}`);
    }

    const data = await res.json();
    const files: DriveFileItem[] = (data.files || []).map((f: any) => ({
      ...f,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
    }));

    return { files, nextPageToken: data.nextPageToken };
  }

  // 3. Search Files with Keyword
  public async searchFiles(keyword: string): Promise<DriveFileItem[]> {
    const clean = keyword.replace(/'/g, "\\'");
    const q = `name contains '${clean}' or fullText contains '${clean}'`;
    const res = await this.listFiles({ q, pageSize: 25 });
    return res.files;
  }

  // 4. Get File Metadata
  public async getFile(fileId: string): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const url = `${DRIVE_BASE_URL}/files/${fileId}?fields=id,name,mimeType,description,starred,trashed,parents,webViewLink,webContentLink,iconLink,thumbnailLink,createdTime,modifiedTime,size,owners,capabilities`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch file metadata: ${res.statusText}`);
    }
    const data = await res.json();
    return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
  }

  // 5. Create a Folder in Google Drive
  public async createFolder(name: string, parentFolderId?: string): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const metadata: any = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentFolderId && parentFolderId !== "root") {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch(`${DRIVE_BASE_URL}/files`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create folder in Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return { ...data, isFolder: true };
  }

  // 6. Upload File (Multipart upload supporting text, code, blobs, images)
  public async uploadFile(params: {
    name: string;
    mimeType: string;
    content: string | Blob;
    parentFolderId?: string;
  }): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata: any = {
      name: params.name,
      mimeType: params.mimeType,
    };
    if (params.parentFolderId && params.parentFolderId !== "root") {
      metadata.parents = [params.parentFolderId];
    }

    let bodyData: any;
    if (typeof params.content === "string") {
      bodyData =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${params.mimeType}\r\n\r\n` +
        params.content +
        closeDelimiter;
    } else {
      // Blob handling
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const formData = new FormData();
      formData.append("metadata", metadataBlob);
      formData.append("file", params.content);

      const res = await fetch(
        `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to upload file to Drive: ${res.statusText}`);
      }
      const data = await res.json();
      return { ...data, isFolder: false };
    }

    const res = await fetch(
      `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: bodyData,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to upload file to Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return { ...data, isFolder: false };
  }

  // 7. Toggle Starred status
  public async toggleStar(fileId: string, starred: boolean): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ starred }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update star in Drive: ${res.statusText}`);
    }
    const data = await res.json();
    return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
  }

  // 8. Move File to Trash (Requires user confirmation)
  public async trashFile(fileId: string): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trashed: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to move file to Trash in Drive: ${res.statusText}`);
    }
    const data = await res.json();
    return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
  }

  // 9. Restore File from Trash
  public async untrashFile(fileId: string): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trashed: false }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to restore file in Drive: ${res.statusText}`);
    }
    const data = await res.json();
    return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
  }

  // 10. Permanently Delete File (Destructive - Requires user confirmation)
  public async deletePermanently(fileId: string): Promise<void> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to permanently delete file from Drive: ${res.statusText}`);
    }
  }

  // 11. Empty Trash (Destructive - Requires user confirmation)
  public async emptyTrash(): Promise<void> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${DRIVE_BASE_URL}/files/trash`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to empty Drive Trash: ${res.statusText}`);
    }
  }

  // 12. Copy File
  public async copyFile(fileId: string, newName?: string): Promise<DriveFileItem> {
    const headers = await this.getAuthHeader();
    const body: any = {};
    if (newName) body.name = newName;

    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}/copy`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to copy file in Drive: ${res.statusText}`);
    }
    const data = await res.json();
    return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
  }
}

export const googleDriveApi = new GoogleDriveApiClient();
