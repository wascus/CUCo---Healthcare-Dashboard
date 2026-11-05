// src/modules/inventory/inventory.routes.ts
import type { FastifyInstance } from 'fastify';
import { listQuerySchema, upsertBodySchema } from './inventory.model';
import {
  addToInventory,
  getInventoryLine,
  listInventoryForUser,
  getUserBalance,
} from './inventory.service';

export default async function inventoryRoutes(fastify: FastifyInstance) {
  // Match grief.routes.ts style: wrapper function + register scope + prefix
  await fastify.register(async (r) => {
    // ---- auth helper (used if fastify.authenticate is not decorated) ----
    const requireAuth = async (req: any, reply: any) => {
      try {
        // If @fastify/jwt is registered with cookieName, this verifies from the cookie.
        // Otherwise it will also accept Authorization: Bearer <token>.
        await (req as any).jwtVerify();
      } catch {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    };

    // ---- common user id extraction (after jwtVerify(), payload lives on req.user) ----
    const getUserId = (req: any): string | null => {
      return (
        req.user?.id ||           // common custom payload
        req.user?.userId ||       // another common field name
        req.user?.sub ||          // standard JWT subject
        req.session?.user?.id ||  // fallbacks for session-based auth
        req.session?.userId ||
        req.userId ||
        req.auth?.userId ||
        null
      );
    };

    // GET /v1/inventory — list current user's inventory
    r.get(
      '/',
      {
        schema: {
          summary: 'List current user inventory',
          tags: ['inventory'],
          querystring: listQuerySchema,
        },
      },
      async (req, reply) => {
        try {
          // Verify JWT from cookie
          await (req as any).jwtVerify();
        } catch (err) {
          // Not authenticated - return empty array for backwards compatibility
          console.log('[INVENTORY GET] JWT verification failed, returning empty array');
          return reply.send([]);
        }

        const userId = getUserId(req);
        if (!userId) {
          console.log('[INVENTORY GET] No userId found after JWT verify, returning empty array');
          return reply.send([]);
        }

        const { includeItem = true, limit = 200, offset = 0 } = (req.query as any) ?? {};
        const rows = await listInventoryForUser(userId, { includeItem, limit, offset });
        return reply.send(rows);
      }
    );

    // GET /v1/inventory/:itemId — requires auth
    r.get(
      '/:itemId',
      { schema: { tags: ['inventory'] } },
      async (req, reply) => {
        const userId = getUserId(req);
        if (!userId) return reply.code(401).send({ message: 'Unauthorized' });

        const { itemId } = req.params as { itemId: string };
        const row = await getInventoryLine(userId, itemId);
        return row ? reply.send(row) : reply.code(404).send({ message: 'Not found' });
      }
    );

    // POST /v1/inventory/upsert — add/remove an item from inventory (requires auth)
    r.post(
      '/upsert',
      {
        schema: {
          summary: 'Add/remove an item from inventory',
          tags: ['inventory'],
          body: upsertBodySchema,
        },
        // protect this route
        onRequest: [((fastify as any).authenticate ?? requireAuth)],
      },
      async (req, reply) => {
        const userId = getUserId(req);
        if (!userId) return reply.code(401).send({ message: 'Unauthorized' });

        const result = await addToInventory(userId, (req as any).body);
        return reply.send(result);
      }
    );

  });
}
