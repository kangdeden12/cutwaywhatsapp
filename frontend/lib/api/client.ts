// Client API terpusat — mengikuti kontrak endpoint di Artefak 02.
// TODO (lanjutan Claude Code): tambahkan interceptor auto-refresh token
// saat access token kedaluwarsa (401), dan penyimpanan token yang aman
// (httpOnly cookie lewat Next.js Route Handler, bukan localStorage).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface ApiErrorBody {
  error?: { code: string; message: string; details?: unknown[] };
}

export class ApiError extends Error {
  code: string;
  details?: unknown[];
  constructor(body: ApiErrorBody, status: number) {
    super(body.error?.message ?? `Permintaan gagal (${status})`);
    this.code = body.error?.code ?? 'UNKNOWN_ERROR';
    this.details = body.error?.details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('cw_access_token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; fullName: string }) =>
    request<{ userId: string; verificationRequired: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string; requires2fa: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ id: string; email: string; fullName: string }>('/users/me'),
};
