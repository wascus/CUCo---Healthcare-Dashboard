// src/modules/shop/shop.routes.ts
import type { FastifyPluginAsync } from "fastify";
import { getItemById, listItems } from "./shop.service";
import { itemSchema, listQuerySchema } from "./shop.model";
import { prisma } from "../../lib/prisma";

function getAuthUserId(req: any): string | null {
  // Your JWT cookie had: { sub: "<uuid>" }
  const u = req?.user;
  return (typeof u?.sub === "string" && u.sub) || u?.id || u?.userId || null;
}


const shopRoutes: FastifyPluginAsync = async (fastify) => {

 
  // GET /v1/shop/items
  fastify.get(
    "/items",
    {
      schema: {
        summary: "List shop items",
        tags: ["shop"],
        querystring: listQuerySchema,
        response: { 200: { type: "array", items: itemSchema } },
      },
    },
    async (req, reply) => {
      const items = await listItems(req.query as any);
      return reply.send(items);
    }
  );

  // GET /v1/shop/items/:id
  fastify.get("/items/:id", { /* schema */ }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = await getItemById(id);
    if (!item) return reply.code(404).send({ message: "Item not found" });
    return reply.send(item);
  });

  fastify.get(
    "/balance",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      if (!user) return reply.code(404).send({ message: "User not found" });
      const raw = (user.balance as any) ?? 0;
      const balance = typeof raw === "object" && raw?.toNumber ? raw.toNumber() : Number(raw) || 0;
      return { balance };
    }
  );

  fastify.post(
    "/balance/sync",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      const { balance } = (req.body as any) || {};
      if (typeof balance !== "number" || balance < 0) {
        return reply.code(400).send({ message: "Invalid balance value" });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { balance },
        select: { balance: true },
      });

      const raw = (updated.balance as any) ?? 0;
      const newBalance = typeof raw === "object" && raw?.toNumber ? raw.toNumber() : Number(raw) || 0;
      return { balance: newBalance };
    }
  );

  // POST /v1/shop/purchase/:itemId
  fastify.post(
    "/purchase/:itemId",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      const { itemId } = req.params as { itemId: string };

      try {
        const result = await prisma.$transaction(async (tx) => {
          const item = await tx.item.findUnique({ where: { id: itemId } });
          if (!item) {
            throw new Error("Item not found");
          }

          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            throw new Error("User not found");
          }

          const raw = (user.balance as any) ?? 0;
          const currentBalance = typeof raw === "object" && raw?.toNumber ? raw.toNumber() : Number(raw) || 0;

          console.log('[PURCHASE] User balance check:', { 
            userId, 
            raw, 
            currentBalance, 
            itemPrice: item.price,
            sufficient: currentBalance >= item.price 
          });

          if (currentBalance < item.price) {
            throw new Error("Insufficient balance");
          }

          await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: item.price } },
          });

          const inventoryEntry = await tx.inventoryItem.findUnique({
            where: { userId_itemId: { userId, itemId } },
          });

          if (inventoryEntry) {
            await tx.inventoryItem.update({
              where: { userId_itemId: { userId, itemId } },
              data: { quantity: { increment: 1 } },
              include: { item: true },
            });
          } else {
            await tx.inventoryItem.create({
              data: { userId, itemId, quantity: 1 },
              include: { item: true },
            });
          }

          return { success: true, itemName: item.name };
        });

        return reply.send(result);
      } catch (err: any) {
        const message = err?.message || "Purchase failed";
        if (message.includes("Insufficient")) {
          return reply.code(400).send({ message });
        }
        if (message.includes("not found")) {
          return reply.code(404).send({ message });
        }
        return reply.code(500).send({ message: "Internal server error" });
      }
    }
  );

};

export default shopRoutes;
