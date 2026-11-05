import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../middleware/requireAuth";
import { listViewersForUser, getSharedTopicsFromOwner } from "./viewers.service";

const viewersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", requireAuth);

  // GET /api/v1/viewers
  app.get("/", async (req, reply) => {
    const meId = (req as any).userId as string;
    const items = await listViewersForUser(meId);
    reply.send({ items });
  });

  // GET /api/v1/viewers/:ownerId/topics
  app.get<{ Params: { ownerId: string } }>("/:ownerId/topics", async (req, reply) => {
    const meId = (req as any).userId as string;
    const { ownerId } = req.params;
    const items = await getSharedTopicsFromOwner(ownerId, meId);
    reply.send({ items });
  });
};

export default viewersRoutes;
