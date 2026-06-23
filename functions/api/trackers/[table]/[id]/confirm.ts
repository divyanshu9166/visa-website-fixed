import { getPrisma, type Env } from '../../../../_lib/prisma';
import { getCurrentUser, jsonResponse, safeHandler } from '../../../../_lib/currentUser';
import { isValidTable } from '../../../../_lib/trackerTables';

interface PagesContext {
  request: Request;
  env: Env;
  params: { table: string; id: string };
}

// GET — public: returns the confirmation count and whether the current user
// (if signed in) has confirmed this case.
export const onRequestGet = safeHandler<PagesContext>(async ({ request, env, params }: PagesContext) => {
  const { table, id } = params;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const prisma = getPrisma(env);
  const count = await prisma.caseConfirmation.count({
    where: { caseTable: table, caseId: id },
  });

  let confirmedByMe = false;
  const user = await getCurrentUser(request, env);
  if (user) {
    const mine = await prisma.caseConfirmation.findUnique({
      where: { userId_caseTable_caseId: { userId: user.id, caseTable: table, caseId: id } },
    });
    confirmedByMe = !!mine;
  }

  return jsonResponse({ count, confirmedByMe });
});

// POST — auth required: creates a confirmation (idempotent, 409 if already exists).
export const onRequestPost = safeHandler<PagesContext>(async ({ request, env, params }: PagesContext) => {
  const { table, id } = params;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Sign in required.' }, { status: 401 });

  const prisma = getPrisma(env);

  try {
    await prisma.caseConfirmation.create({
      data: { userId: user.id, caseTable: table, caseId: id },
    });
    return jsonResponse({ ok: true }, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation — user already confirmed this case
    if (err?.code === 'P2002') {
      return jsonResponse({ error: 'Already confirmed.' }, { status: 409 });
    }
    throw err;
  }
});

// DELETE — auth required: removes the user's confirmation.
export const onRequestDelete = safeHandler<PagesContext>(async ({ request, env, params }: PagesContext) => {
  const { table, id } = params;
  if (!isValidTable(table)) return jsonResponse({ error: 'Unknown tracker.' }, { status: 404 });

  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Sign in required.' }, { status: 401 });

  const prisma = getPrisma(env);

  try {
    await prisma.caseConfirmation.delete({
      where: { userId_caseTable_caseId: { userId: user.id, caseTable: table, caseId: id } },
    });
  } catch {
    // Not found — already deleted or never existed; that's fine
  }

  return jsonResponse({ ok: true });
});
