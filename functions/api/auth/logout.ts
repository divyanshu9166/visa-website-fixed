import { getPrisma, type Env } from '../../_lib/prisma';
import { getSessionTokenFromRequest, clearSessionCookie, isSecureRequest } from '../../_lib/auth';
import { jsonResponse, safeHandler } from '../../_lib/currentUser';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestPost = safeHandler<PagesContext>(async ({ request, env }: PagesContext) => {
  const token = getSessionTokenFromRequest(request);
  if (token) {
    const prisma = getPrisma(env);
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
  }

  const headers = new Headers();
  clearSessionCookie(headers, isSecureRequest(request));
  return jsonResponse({ ok: true }, { status: 200, headers });
});
