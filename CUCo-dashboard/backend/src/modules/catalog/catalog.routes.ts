import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma";

type CatalogTopic = {
  id: string;
  key: string;
  title: string;
  promptText?: string; 
  createdAt: string;   
};

const itemSchema: any = {
  type: "object",
  required: ["id", "key", "title", "createdAt"],
  properties: {
    id: { type: "string" },
    key: { type: "string" },
    title: { type: "string" },
    promptText: { type: "string", nullable: true },
    createdAt: { type: "string" },
  },
};

const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/grief-topics",
    {
      schema: { response: { 200: { type: "array", items: itemSchema } } },
    },
    async (_req, reply) => {
      const rows = await prisma.griefTopic.findMany({
        orderBy: [{ title: "asc" }],
        select: { id: true, key: true, title: true, promptText: true, createdAt: true },
      });

      const payload: CatalogTopic[] = rows.map((r) => ({
        id: r.id,
        key: r.key,
        title: r.title,
        ...(r.promptText ? { promptText: r.promptText } : {}),
        createdAt: r.createdAt.toISOString(),
      }));

      return reply.send(payload);
    }
  );
};

export default catalogRoutes;
