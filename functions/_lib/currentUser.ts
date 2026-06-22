import { getPrisma, ConfigError, type Env } from './prisma';
import { getSessionTokenFromRequest } from './auth';

export async function getCurrentUser(request: Request, env: Env) {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const prisma = getPrisma(env);
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  return session.user;
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/**
 * Wraps a Pages Function handler so a missing/misconfigured DATABASE_URL (or
 * any other unexpected error) always comes back as a clean JSON response the
 * frontend can detect and explain, instead of an opaque Workers 500 page.
 */
export function safeHandler<C extends { request: Request; env: Env }>(
  handler: (ctx: C) => Promise<Response>
) {
  return async (ctx: C): Promise<Response> => {
    try {
      return await handler(ctx);
    } catch (err: any) {
      if (err instanceof ConfigError) {
        return jsonResponse({ error: err.message }, { status: 503 });
      }
      console.error(err);
      return jsonResponse({ error: 'Internal server error.' }, { status: 500 });
    }
  };
}
