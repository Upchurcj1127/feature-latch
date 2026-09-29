import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';

const app = new Hono();
const prisma = new PrismaClient();

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowMethods: ['GET', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-SDK-Key'],
  })
);

app.get('/health', (c) => {
  return c.json({ ok: true });
});

async function requireValidSdkKey(sdkKey: string | undefined) {
  if (!sdkKey) {
    return null;
  }

  const appRecord = await prisma.app.findUnique({
    where: { sdkKey },
  });

  return appRecord;
}

app.get('/v1/policy', async (c) => {
  const sdkKey = c.req.header('X-SDK-Key');
  const appRecord = await requireValidSdkKey(sdkKey);

  if (!appRecord) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return c.json(appRecord.policyJson);
});

app.put('/v1/policy', async (c) => {
  const sdkKey = c.req.header('X-SDK-Key');
  const appRecord = await requireValidSdkKey(sdkKey);

  if (!appRecord) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Policy body must be an object' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'Policy body must be an object' }, 400);
  }

  const updated = await prisma.app.update({
    where: { id: appRecord.id },
    data: { policyJson: body },
  });

  return c.json(updated.policyJson);
});

const port = Number(process.env.PORT ?? 3000);
console.log(`Feature Latch API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

export default app;
