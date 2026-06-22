import { getPrisma, type Env } from '../../_lib/prisma';
import { verifyPassword, newSessionToken, sessionExpiry, setSessionCookie, isSecureRequest } from '../../_lib/auth';
import { jsonResponse, safeHandler } from '../../_lib/currentUser';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = safeHandler<PagesContext>(async ({ request, env }: PagesContext) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const prisma = getPrisma(env);
  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic error whether the email doesn't exist or the password is
  // wrong, so we don't leak which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonResponse({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const token = newSessionToken();
  await prisma.session.create({ data: { id: token, userId: user.id, expiresAt: sessionExpiry() } });

  const headers = new Headers();
  setSessionCookie(headers, token, isSecureRequest(request));

  return jsonResponse({ email: user.email }, { status: 200, headers });
});
