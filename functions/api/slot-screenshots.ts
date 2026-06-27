import { getPrisma, type Env } from '../_lib/prisma';
import { jsonResponse, safeHandler } from '../_lib/currentUser';

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequestGet = safeHandler<PagesContext>(async ({ request, env }: PagesContext) => {
  const url = new URL(request.url);
  const consulate = url.searchParams.get('consulate') || undefined;
  const visaType = url.searchParams.get('visaType') || undefined;

  const prisma = getPrisma(env);
  const rows = await (prisma as any).slotScreenshot.findMany({
    where: {
      ...(consulate ? { consulate } : {}),
      ...(visaType ? { visaType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    omit: { submittedBy: true },
  });
  return jsonResponse({ data: rows });
});

export const onRequestPost = safeHandler<PagesContext>(async ({ request, env }: PagesContext) => {
  const body = await request.json() as {
    consulate?: string;
    visaType?: string;
    slotDate?: string;
    imageUrl?: string;
    notes?: string;
    submittedBy?: string;
  };

  const { consulate, visaType, imageUrl } = body;
  if (!consulate || !visaType || !imageUrl) {
    return jsonResponse({ error: 'consulate, visaType, and imageUrl are required.' }, { status: 400 });
  }

  const prisma = getPrisma(env);
  const row = await (prisma as any).slotScreenshot.create({
    data: {
      consulate: body.consulate!,
      visaType: body.visaType!,
      slotDate: body.slotDate ? new Date(body.slotDate) : null,
      imageUrl: body.imageUrl!,
      notes: body.notes || null,
      submittedBy: body.submittedBy || null,
    },
  });
  return jsonResponse({ success: true, id: row.id });
});
