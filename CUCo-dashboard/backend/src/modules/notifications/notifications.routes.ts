import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../middleware/requireAuth";
import * as svc from "./notifications.service";

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/notifications
  fastify.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    const meId = (req as any).userId as string;
    const take = Math.min(200, Number((req.query as any)?.take ?? 50) || 50);
    const items = await svc.listMyNotifications(meId, take);
    reply.send(items);
  });

  // PATCH /api/v1/notifications/:id/read
  fastify.patch<{ Params: { id: string } }>(
    "/:id/read",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const meId = (req as any).userId as string;
      const { id } = (req.params as any) || {};
      if (!id || typeof id !== "string") {
        return reply.code(400).send({ message: "Missing or invalid id param" });
      }
      const item = await svc.markNotificationRead(meId, id);
      if (!item) return reply.code(404).send({ message: "Notification not found" });
      reply.send(item);
    }
  );

  // PATCH /api/v1/notifications/read-all
  fastify.patch("/read-all", { preHandler: [requireAuth] }, async (req, reply) => {
    const meId = (req as any).userId as string;
    await svc.markAllRead(meId);
    reply.send({ ok: true });
  });

  // DELETE /api/v1/notifications/:id  (hard delete)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const meId = (req as any).userId as string;
      const { id } = (req.params as any) || {};
      if (!id || typeof id !== "string") {
        return reply.code(400).send({ message: "Missing or invalid id param" });
      }
      const ok = await svc.deleteNotification(meId, id);
      if (!ok) return reply.code(404).send({ message: "Notification not found" });
      reply.code(204).send();
    }
  );
};

export default notificationsRoutes;
