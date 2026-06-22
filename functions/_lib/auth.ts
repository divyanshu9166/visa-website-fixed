// All of this uses only the Web Crypto API (globalThis.crypto.subtle), which
// is natively available in the Cloudflare Workers runtime — no bcrypt/argon2
// npm package needed (those rely on native bindings that don't run in
// Workers). PBKDF2-SHA256 with 100k iterations is a solid, audited choice
// for this runtime.

const PBKDF2_ITERATIONS = 100_000;
const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = hexToBuffer(saltHex);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  // Constant-time-ish comparison (hex strings, equal length expected)
  const a = bufferToHex(derivedBits);
  if (a.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

export function newSessionToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export function setSessionCookie(headers: Headers, token: string, secure = true) {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  );
}

export function clearSessionCookie(headers: Headers, secure = true) {
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
  );
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function isSecureRequest(request: Request): boolean {
  // wrangler pages dev (local) serves over http://localhost — don't mark the
  // cookie Secure there, or browsers will silently refuse to store it.
  return new URL(request.url).protocol === 'https:';
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
