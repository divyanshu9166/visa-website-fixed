import { getPrisma, type Env } from '../../../_lib/prisma';
import { getCurrentUser, jsonResponse, safeHandler } from '../../../_lib/currentUser';
import { isValidTable, sanitizePayload, TRACKER_TABLES } from '../../../_lib/trackerTables';

interface PagesContext {
  request: Request;
  env: Env;
  params: { table: string };
}

// Public read — anyone can see the community-aggregated data (no PII beyond
// what the submitter chose to enter; user_id is never exposed in responses).
export const onRequestGet = safeHandler<PagesContext>(async ({ env, params }: PagesContext) => {
  const table = params.table;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const prisma = getPrisma(env);
  const delegate = (prisma as any)[TRACKER_TABLES[table].model];
  const rows = await delegate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2000,
    omit: { userId: true },
  });

  return jsonResponse(rows);
});

// Create — requires a signed-in user; the row is always attributed to the
// session's user, never a client-supplied user id.
export const onRequestPost = safeHandler<PagesContext>(async ({ request, env, params }: PagesContext) => {
  const table = params.table;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Sign in required.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const data = sanitizePayload(table, body);
  const prisma = getPrisma(env);
  const delegate = (prisma as any)[TRACKER_TABLES[table].model];

  try {
    const row = await delegate.create({ data: { ...data, userId: user.id } });
    return jsonResponse(row, { status: 201 });
  } catch (err: any) {
    return jsonResponse({ error: 'Could not save case. Check required fields.' }, { status: 400 });
  }
});
