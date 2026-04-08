const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'knowhive_access_token';
const REFRESH_KEY = 'knowhive_refresh_token';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const tokens = await res.json();
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...rest,
  });

  if (res.status === 401 && token && !endpoint.includes('/auth/')) {
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(`${API_URL}${endpoint}`, { headers, ...rest });
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({ message: retry.statusText }));
        throw new ApiError(retry.status, body.message || retry.statusText);
      }
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthTokens>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthTokens>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  refresh: (refreshToken: string) =>
    request<AuthTokens>('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: (token: string) =>
    request<User>('/api/auth/me', { token }),
};

// Organizations

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: { knowledgeBases: number; members: number };
  members?: OrgMember[];
  role?: string;
}

export interface OrgMember {
  id: string;
  role: string;
  joinedAt?: string;
  user: { id: string; name: string; email: string };
}

export const organizations = {
  list: (token: string) =>
    request<Organization[]>('/api/organizations', { token }),

  get: (token: string, slug: string) =>
    request<Organization>(`/api/organizations/${slug}`, { token }),

  create: (token: string, data: { name: string }) =>
    request<Organization>('/api/organizations', { method: 'POST', body: JSON.stringify(data), token }),

  update: (token: string, slug: string, data: { name: string }) =>
    request<Organization>(`/api/organizations/${slug}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  remove: (token: string, slug: string) =>
    request<void>(`/api/organizations/${slug}`, { method: 'DELETE', token }),
};

// Members

export const members = {
  list: (token: string, slug: string) =>
    request<OrgMember[]>(`/api/organizations/${slug}/members`, { token }),

  add: (token: string, slug: string, data: { email: string; role: string }) =>
    request<OrgMember>(`/api/organizations/${slug}/members`, { method: 'POST', body: JSON.stringify(data), token }),

  updateRole: (token: string, slug: string, memberId: string, data: { role: string }) =>
    request<OrgMember>(`/api/organizations/${slug}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  remove: (token: string, slug: string, memberId: string) =>
    request<void>(`/api/organizations/${slug}/members/${memberId}`, { method: 'DELETE', token }),
};

// Knowledge Bases

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  _count?: { documents: number };
}

export const knowledgeBases = {
  list: (token: string, slug: string) =>
    request<KnowledgeBase[]>(`/api/organizations/${slug}/knowledge-bases`, { token }),

  get: (token: string, slug: string, kbId: string) =>
    request<KnowledgeBase>(`/api/organizations/${slug}/knowledge-bases/${kbId}`, { token }),

  create: (token: string, slug: string, data: { name: string; description?: string }) =>
    request<KnowledgeBase>(`/api/organizations/${slug}/knowledge-bases`, { method: 'POST', body: JSON.stringify(data), token }),

  remove: (token: string, slug: string, kbId: string) =>
    request<void>(`/api/organizations/${slug}/knowledge-bases/${kbId}`, { method: 'DELETE', token }),
};

// Documents

export interface Document {
  id: string;
  title: string;
  content?: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  knowledgeBaseId: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: { id: string; name: string; email: string };
}

export const documents = {
  list: (token: string, slug: string, kbId: string) =>
    request<Document[]>(`/api/organizations/${slug}/knowledge-bases/${kbId}/documents`, { token }),

  get: (token: string, slug: string, kbId: string, docId: string) =>
    request<Document>(`/api/organizations/${slug}/knowledge-bases/${kbId}/documents/${docId}`, { token }),

  create: (token: string, slug: string, kbId: string, data: { title: string; content: string }) =>
    request<Document>(`/api/organizations/${slug}/knowledge-bases/${kbId}/documents`, { method: 'POST', body: JSON.stringify(data), token }),

  update: (token: string, slug: string, kbId: string, docId: string, data: { title?: string; content?: string }) =>
    request<Document>(`/api/organizations/${slug}/knowledge-bases/${kbId}/documents/${docId}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  remove: (token: string, slug: string, kbId: string, docId: string) =>
    request<void>(`/api/organizations/${slug}/knowledge-bases/${kbId}/documents/${docId}`, { method: 'DELETE', token }),
};

// Search

export interface SearchResult {
  content: string;
  score: number;
  documentId: string;
  documentTitle: string;
}

export const search = {
  query: (token: string, slug: string, kbId: string, data: { query: string; limit?: number }) =>
    request<SearchResult[]>(`/api/organizations/${slug}/knowledge-bases/${kbId}/search`, { method: 'POST', body: JSON.stringify(data), token }),
};

export { ApiError };
