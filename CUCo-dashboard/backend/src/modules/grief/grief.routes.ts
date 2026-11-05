
import type { FastifyPluginAsync } from "fastify";
import { griefService } from "./grief.service";
import { requireAuth } from "../../middleware/requireAuth";
import type { Placement as DBPlacement, TopicStatus as DBStatus } from "@prisma/client";
import { updateStreak } from "../gamification/streak.service";

/** FE uses lowercase; DB uses uppercase */
const PlacementEnumLC = ["base", "middle", "summit"] as const;
const StatusEnumLC = ["text", "check", "tear", "image"] as const;
const PlacementEnumAny = ["BASE", "MIDDLE", "SUMMIT", ...PlacementEnumLC] as const;
const StatusEnumAny = ["TEXT", "CHECK", "TEAR", "IMAGE", ...StatusEnumLC] as const;

type FEPlacement = (typeof PlacementEnumLC)[number];
type FEStatus = (typeof StatusEnumLC)[number];

/* ---------- mappers ---------- */
function toDBPlacement(p: string | undefined): DBPlacement {
  const u = (p ?? "").toUpperCase();
  return (["BASE", "MIDDLE", "SUMMIT"].includes(u) ? u : "BASE") as DBPlacement;
}
function toDBStatus(s: string | undefined): DBStatus {
  const u = (s ?? "").toUpperCase();
  return (["TEXT", "CHECK", "TEAR", "IMAGE"].includes(u) ? u : "TEXT") as DBStatus;
}
function toFEPlacement(p: DBPlacement): FEPlacement {
  return p.toLowerCase() as FEPlacement;
}
function toFEStatus(s: DBStatus): FEStatus {
  return s.toLowerCase() as FEStatus;
}

function mapRowToFE(row: any) {
  // Expect griefService rows to include topic title or customTitle
  return {
    id: row.id,
    topicId: row.topicId,
    title: row.customTitle ?? row.topic?.title ?? row.title,
    isCustom: !!row.customTitle,
    placement: toFEPlacement(row.placement),
    status: toFEStatus(row.status),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    shared: !!row.shared,
    description: row.description ?? null,
  };
}

/* ---------- JSON Schemas ---------- */
const TopicSchemaFE: any = {
  type: "object",
  required: ["id", "topicId", "title", "placement", "status", "createdAt", "updatedAt", "isCustom"],
  properties: {
    id: { type: "string" },
    topicId: { type: "string", nullable: true },
    title: { type: "string" },
    isCustom: { type: "boolean" },
    placement: { type: "string", enum: [...PlacementEnumLC] },
    status: { type: "string", enum: [...StatusEnumLC] },
    createdAt: { type: "string", nullable: true },
    updatedAt: { type: "string", nullable: true },
    shared: { type: "boolean" },
    description: { type: "string", nullable: true },
  },
};

const griefRoutes: FastifyPluginAsync = async (app) => {
  /* ===== List my topics (FE expects lowercase enums) ===== */
  app.get(
    "/topics",
    {
      preHandler: [requireAuth],
      schema: { response: { 200: { type: "array", items: TopicSchemaFE } } },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const rows = await griefService.list(userId);
      return reply.send(rows.map(mapRowToFE));
    }
  );

  /* ===== Create custom topic (MUST come before /topics) ===== */
  app.post<{
    Body: {
      customTitle: string;
      placement?: FEPlacement | DBPlacement | string;
      status?: FEStatus | DBStatus | string;
      shared?: boolean;
      description?: string | null;
    };
  }>(
    "/topics/custom",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["customTitle"],
          properties: {
            customTitle: { type: "string" },
            placement: { type: "string", enum: [...PlacementEnumAny] },
            status: { type: "string", enum: [...StatusEnumAny] },
            shared: { type: "boolean" },
            description: { type: "string", nullable: true },
          },
        } as any,
        response: { 200: TopicSchemaFE },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { customTitle, placement, status, shared, description } = req.body;

      const created = await griefService.createCustom(userId, {
        customTitle,
        placement: toDBPlacement(placement),
        status: toDBStatus(status),
        shared: shared ?? false,
        description: description ?? null,
      });

      await updateStreak(userId);

      return reply.send(mapRowToFE(created));
    }
  );

  /* ===== Create (add catalog topic to mountain) ===== */
  app.post<{
    Body: {
      topicId: string;
      placement?: FEPlacement | DBPlacement | string;
      status?: FEStatus | DBStatus | string;
      shared?: boolean;
      description?: string | null;
    };
  }>(
    "/topics",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["topicId"],
          properties: {
            topicId: { type: "string" },
            placement: { type: "string", enum: [...PlacementEnumAny] },
            status: { type: "string", enum: [...StatusEnumAny] },
            shared: { type: "boolean" },
            description: { type: "string", nullable: true },
          },
        } as any,
        response: { 200: TopicSchemaFE },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { topicId, placement, status, shared, description } = req.body;

      const created = await griefService.create(userId, {
        topicId,
        placement: toDBPlacement(placement),
        status: toDBStatus(status),
        shared: shared ?? false,
        description: description ?? null,
      });

      await updateStreak(userId);

      return reply.send(mapRowToFE(created));
    }
  );

  /* ===== Update placement (case-normalized) ===== */
  app.put<{ Params: { id: string }; Body: { placement: FEPlacement | DBPlacement | string } }>(
    "/topics/:id",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", required: ["id"], properties: { id: { type: "string" } } } as any,
        body: {
          type: "object",
          required: ["placement"],
          properties: { placement: { type: "string", enum: [...PlacementEnumAny] } },
        } as any,
        response: { 200: TopicSchemaFE },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { id } = req.params;
      const { placement } = req.body;

      try {
        const updated = await griefService.updatePlacement(userId, id, toDBPlacement(placement));
        return reply.send(mapRowToFE(updated));
      } catch (e: any) {
        if (e?.message === "NOT_FOUND") return reply.code(404).send({ message: "Not found" });
        throw e;
      }
    }
  );

  /* ===== Delete by row id ===== */
  app.delete<{ Params: { id: string } }>(
    "/topics/:id",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", required: ["id"], properties: { id: { type: "string" } } } as any,
        response: { 204: { type: "null" } },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { id } = req.params;

      try {
        await griefService.remove(userId, id);
        return reply.code(204).send();
      } catch (e: any) {
        if (e?.message === "NOT_FOUND") return reply.code(404).send({ message: "Not found" });
        throw e;
      }
    }
  );

  /* ===== Delete by catalog topicId (drag off to list) ===== */
  app.delete<{ Params: { topicId: string } }>(
    "/topics/by-topic/:topicId",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", required: ["topicId"], properties: { topicId: { type: "string" } } } as any,
        response: { 204: { type: "null" } },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { topicId } = req.params;

      try {
        await griefService.removeByTopicId(userId, topicId);
        return reply.code(204).send();
      } catch (e: any) {
        if (e?.message === "NOT_FOUND") return reply.code(404).send({ message: "Not found" });
        throw e;
      }
    }
  );

  /* ===== Toggle share flag ===== */
  app.patch<{ Params: { id: string }; Body: { shared: boolean } }>(
    "/topics/:id/shared",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", required: ["id"], properties: { id: { type: "string" } } } as any,
        body: {
          type: "object",
          required: ["shared"],
          properties: { shared: { type: "boolean" } },
        } as any,
        response: { 200: TopicSchemaFE },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { id } = req.params;
      const { shared } = req.body;

      try {
        const updated = await griefService.updateShared(userId, id, shared);
        return reply.send(mapRowToFE(updated));
      } catch (e: any) {
        return reply.code(500).send({ message: e?.message ?? "Failed to update" });
      }
    }
  );

  /* ===== Update description ===== */
  app.patch<{ Params: { id: string }; Body: { description?: string | null } }>(
    "/topics/:id/description",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", required: ["id"], properties: { id: { type: "string" } } } as any,
        body: {
          type: "object",
          properties: { description: { type: "string", nullable: true } },
        } as any,
        response: { 200: TopicSchemaFE },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const { id } = req.params;
      const description = (req.body?.description ?? null) as string | null;

      try {
        const updated = await griefService.updateDescription(userId, id, description);
        return reply.send(mapRowToFE(updated));
      } catch (e: any) {
        if (e?.message === "NOT_FOUND") return reply.code(404).send({ message: "Not found" });
        throw e;
      }
    }
  );
};

export default griefRoutes;
