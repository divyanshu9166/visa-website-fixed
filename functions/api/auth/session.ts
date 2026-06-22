import type { Env } from '../../_lib/prisma';
import { getCurrentUser, jsonResponse, safeHandler } from '../../_lib/currentUser';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestGet = safeHandler<PagesContext>(async ({ request, env }: PagesContext) => {
  const user = await getCurrentUser(request, env);
  return jsonResponse({ user: user ? { email: user.email } : null });
});
