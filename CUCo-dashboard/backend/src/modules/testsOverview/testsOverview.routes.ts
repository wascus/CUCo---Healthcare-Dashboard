// modules/testsOverview/testsOverview.routes.ts
import type { FastifyPluginAsync } from "fastify";
import { testsOverviewService } from "./testsOverview.service";
import { requireAuth } from "../../middleware/requireAuth";
import type { EmotionName as DBEmotionName } from "@prisma/client";
import { updateStreak } from "../gamification/streak.service";
import type { EmotionEntryFE } from "./testsOverview.model";

const EmotionEnum = [
  "Joy",
  "Sadness",
  "Anger",
  "Fear",
  "Hope",
  "Love",
  "Guilt",
  "Acceptance",
  "Confusion",
  "Gratitude",
] as const;

type EmotionName = (typeof EmotionEnum)[number];

function mapRowToFE(row: any): EmotionEntryFE {
  return {
    id: row.id,
    emotion: row.emotion,
    color: row.color,
    intensity: row.intensity,
    note: row.note ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

const listResponseSchema: any = {
  type: "object",
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "emotion", "color", "intensity", "createdAt"],
        properties: {
          id: { type: "string" },
          emotion: { type: "string", enum: [...EmotionEnum] },
          color: { type: "string" },
          intensity: { type: "number", minimum: 1, maximum: 10 },
          note: { type: "string", nullable: true },
          createdAt: { type: "string" },
        },
      },
    },
    total: { type: "number" },
  },
};

const postBodySchema: any = {
  type: "object",
  required: ["emotion", "color", "intensity"],
  properties: {
    emotion: { type: "string", enum: [...EmotionEnum] },
    color: { type: "string" },
    intensity: { type: "number", minimum: 1, maximum: 10 },
    note: { type: "string", nullable: true },
  },
};

export const testsOverviewRoutes: FastifyPluginAsync = async (app) => {
  // prefix suggestion in app.ts: app.register(testsOverviewRoutes, { prefix: "/api/v1/tests-overview" });

  /* --------- GET /emotions --------- */
  app.get<{ Querystring: { limit?: string } }>(
    "/emotions",
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: "object",
          properties: { limit: { type: "string" } },
        } as any,
        response: { 200: listResponseSchema },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const limit = Number.parseInt(req.query.limit ?? "50", 10);
      const rows = await testsOverviewService.list(userId, isFinite(limit) ? limit : 50);
      return reply.send({
        items: rows.map(mapRowToFE),
        total: rows.length,
      });
    }
  );

  /* --------- POST /emotions --------- */
  app.post<{
    Body: { emotion: EmotionName | DBEmotionName; color: string; intensity: number; note?: string | null };
  }>(
    "/emotions",
    {
      preHandler: [requireAuth],
      schema: {
        body: postBodySchema,
        response: { 200: (listResponseSchema.properties.items.items as any) },
      },
    },
    async (req, reply) => {
      const userId = (req as any).userId as string;
      const body = req.body;
      // Normalize just in case callers pass wrong casing
      const emotion = (String(body.emotion) as EmotionName) as DBEmotionName;

      const created = await testsOverviewService.create(userId, {
        emotion,
        color: body.color,
        intensity: body.intensity,
        note: body.note ?? null,
      });

      await updateStreak(userId);

      return reply.send(mapRowToFE(created));
    }
  );
};

export default testsOverviewRoutes;
