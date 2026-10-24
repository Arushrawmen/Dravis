/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Contacts REST API Client (Google People API v1 - people.googleapis.com)
 */

import { getAccessToken } from "./googleAuth";

export interface GoogleContactEmail {
  value: string;
  type?: string;
  primary?: boolean;
}

export interface GoogleContactPhone {
  value: string;
  type?: string;
  canonicalForm?: string;
  primary?: boolean;
}

export interface GoogleContactOrg {
  name?: string;
  title?: string;
  department?: string;
}

export interface GoogleContactAddress {
  formattedValue?: string;
  type?: string;
  city?: string;
  country?: string;
}

export interface GoogleContact {
  resourceName: string; // e.g. "people/c123456"
  etag: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  photoUrl?: string;
  emails: GoogleContactEmail[];
  phones: GoogleContactPhone[];
  organizations: GoogleContactOrg[];
  addresses: GoogleContactAddress[];
}

const PEOPLE_BASE_URL = "https://people.googleapis.com/v1";
const PERSON_FIELDS = "names,emailAddresses,phoneNumbers,photos,organizations,addresses,biographies";

export class GoogleContactsApiClient {
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please sign in with Google to access your Contacts.");
    }
    return { Authorization: `Bearer ${token}` };
  }

  // 1. List user's contacts
  public async listContacts(options?: {
    pageSize?: number;
    pageToken?: string;
    sortOrder?: "LAST_MODIFIED_DESCENDING" | "FIRST_NAME_ASCENDING" | "LAST_NAME_ASCENDING";
  }): Promise<{ contacts: GoogleContact[]; nextPageToken?: string; totalPeople?: number }> {
    const headers = await this.getAuthHeader();
    const params = new URLSearchParams();
    params.set("personFields", PERSON_FIELDS);
    params.set("pageSize", String(options?.pageSize || 100));
    params.set("sortOrder", options?.sortOrder || "FIRST_NAME_ASCENDING");
    if (options?.pageToken) params.set("pageToken", options.pageToken);

    const url = `${PEOPLE_BASE_URL}/people/me/connections?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch contacts: ${res.statusText}`);
    }

    const data = await res.json();
    const connections: any[] = data.connections || [];

    const contacts: GoogleContact[] = connections.map((person) => this.mapPerson(person));
    return {
      contacts,
      nextPageToken: data.nextPageToken,
      totalPeople: data.totalPeople || data.totalItems || contacts.length,
    };
  }

  // 2. Search contacts
  public async searchContacts(query: string, pageSize: number = 30): Promise<GoogleContact[]> {
    if (!query.trim()) return [];
    const headers = await this.getAuthHeader();
    const params = new URLSearchParams();
    params.set("readMask", PERSON_FIELDS);
    params.set("query", query.trim());
    params.set("pageSize", String(pageSize));

    const url = `${PEOPLE_BASE_URL}/people:searchContacts?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to search contacts: ${res.statusText}`);
    }

    const data = await res.json();
    const results: any[] = data.results || [];
    return results.map((r) => this.mapPerson(r.person));
  }

  // 3. Create a new Google Contact
  public async createContact(contactData: {
    givenName: string;
    familyName?: string;
    email?: string;
    phone?: string;
    organization?: string;
    jobTitle?: string;
    address?: string;
  }): Promise<GoogleContact> {
    const headers = await this.getAuthHeader();

    const body: any = {
      names: [
        {
          givenName: contactData.givenName.trim(),
          familyName: contactData.familyName?.trim() || "",
        },
      ],
    };

    if (contactData.email?.trim()) {
      body.emailAddresses = [
        {
          value: contactData.email.trim(),
          type: "home",
        },
      ];
    }

    if (contactData.phone?.trim()) {
      body.phoneNumbers = [
        {
          value: contactData.phone.trim(),
          type: "mobile",
        },
      ];
    }

    if (contactData.organization?.trim() || contactData.jobTitle?.trim()) {
      body.organizations = [
        {
          name: contactData.organization?.trim() || "",
          title: contactData.jobTitle?.trim() || "",
        },
      ];
    }

    if (contactData.address?.trim()) {
      body.addresses = [
        {
          formattedValue: contactData.address.trim(),
          type: "home",
        },
      ];
    }

    const res = await fetch(`${PEOPLE_BASE_URL}/people:createContact?personFields=${PERSON_FIELDS}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create contact: ${res.statusText}`);
    }

    const person = await res.json();
    return this.mapPerson(person);
  }

  // 4. Delete a contact (Destructive - Requires explicit user confirmation)
  public async deleteContact(resourceName: string): Promise<void> {
    const headers = await this.getAuthHeader();
    const encodedName = resourceName.startsWith("people/") ? resourceName : `people/${resourceName}`;
    const url = `${PEOPLE_BASE_URL}/${encodedName}:deleteContact`;

    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete contact: ${res.statusText}`);
    }
  }

  // Helper mapper
  private mapPerson(person: any): GoogleContact {
    const nameObj = person.names?.[0] || {};
    const displayName =
      nameObj.displayName ||
      [nameObj.givenName, nameObj.familyName].filter(Boolean).join(" ") ||
      person.emailAddresses?.[0]?.value ||
      person.phoneNumbers?.[0]?.value ||
      "Unknown Contact";

    return {
      resourceName: person.resourceName || "",
      etag: person.etag || "",
      displayName,
      givenName: nameObj.givenName,
      familyName: nameObj.familyName,
      photoUrl: person.photos?.[0]?.url,
      emails: (person.emailAddresses || []).map((e: any) => ({
        value: e.value,
        type: e.type,
        primary: Boolean(e.metadata?.primary),
      })),
      phones: (person.phoneNumbers || []).map((p: any) => ({
        value: p.value,
        type: p.type,
        canonicalForm: p.canonicalForm,
        primary: Boolean(p.metadata?.primary),
      })),
      organizations: (person.organizations || []).map((o: any) => ({
        name: o.name,
        title: o.title,
        department: o.department,
      })),
      addresses: (person.addresses || []).map((a: any) => ({
        formattedValue: a.formattedValue,
        type: a.type,
        city: a.city,
        country: a.country,
      })),
    };
  }
}

export const googleContactsApi = new GoogleContactsApiClient();
