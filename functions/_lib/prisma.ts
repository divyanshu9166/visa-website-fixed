import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export interface Env {
  DATABASE_URL: string;
}

export class ConfigError extends Error {}

// Pages Functions run per-request on Workers; there's no long-lived Node
// process, so we cache the client per-isolate (it persists across requests
// within the same isolate, which is the standard Workers pattern) rather than
// creating a brand new client on every single request.
let cached: ReturnType<typeof buildClient> | null = null;
let cachedUrl: string | null = null;

function buildClient(databaseUrl: string) {
  return new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate());
}

export function getPrisma(env: Env) {
  if (!env.DATABASE_URL) {
    throw new ConfigError(
      'DATABASE_URL is not set. Add it in Cloudflare Pages > Settings > Environment Variables ' +
      '(and in .dev.vars for local `wrangler pages dev`). See README.md for the full Prisma Postgres setup guide.'
    );
  }
  // Rebuild if the URL changes (covers local dev hot-reload edge cases); in
  // production this only ever runs once per isolate.
  if (!cached || cachedUrl !== env.DATABASE_URL) {
    cached = buildClient(env.DATABASE_URL);
    cachedUrl = env.DATABASE_URL;
  }
  return cached;
}
