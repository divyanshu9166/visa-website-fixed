import { getPrisma, type Env } from '../../../../_lib/prisma';
import { getCurrentUser, jsonResponse, safeHandler } from '../../../../_lib/currentUser';
import { isValidTable, TRACKER_TABLES } from '../../../../_lib/trackerTables';

interface PagesContext {
  request: Request;
  env: Env;
  params: { table: string; id: string };
}

export const onRequestDelete = safeHandler<PagesContext>(async ({ request, env, params }: PagesContext) => {
  const table = params.table;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Sign in required.' }, { status: 401 });

  const prisma = getPrisma(env);
  const delegate = (prisma as any)[TRACKER_TABLES[table].model];

  // Verify ownership before deleting — never trust the id alone.
  const existing = await delegate.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id) {
    return jsonResponse({ error: 'Case not found.' }, { status: 404 });
  }

  await delegate.delete({ where: { id: params.id } });
  return jsonResponse({ ok: true });
});
