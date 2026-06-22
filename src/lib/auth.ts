// Thin client for our own /api/auth/* endpoints (Cloudflare Pages Functions +
// Prisma Postgres — see functions/api/auth/). Session state lives in an
// HttpOnly cookie set by the server, so there's no token to manage here.

export interface SessionUser {
  email: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  return postJson('/api/auth/register', { email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return postJson('/api/auth/login', { email, password });
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}
