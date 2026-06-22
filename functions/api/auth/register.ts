import { getPrisma, type Env } from '../../_lib/prisma';
import { hashPassword, newSessionToken, sessionExpiry, setSessionCookie, isSecureRequest } from '../../_lib/auth';
import { jsonResponse, safeHandler } from '../../_lib/currentUser';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = safeHandler<PagesContext>(async ({ request, env }) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'A valid email is required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return jsonResponse({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const prisma = getPrisma(env);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonResponse({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = newSessionToken();
  await prisma.session.create({ data: { id: token, userId: user.id, expiresAt: sessionExpiry() } });

  const headers = new Headers();
  setSessionCookie(headers, token, isSecureRequest(request));

  return jsonResponse({ email: user.email }, { status: 201, headers });
});
