// backend/src/modules/diary/diary.routes.ts
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../middleware/requireAuth";
import { DiaryService } from "./diary.service";
import { updateStreak } from "../gamification/streak.service";

// ----- helpers -----
const getUidOr401 = (req: FastifyRequest, reply: FastifyReply) => {
  const uid = (req as any).userId as string | undefined;
  if (!uid) {
    reply.status(401).send({ message: "Unauthorized" });
    return undefined;
  }
  return uid;
};

// ----- zod schemas (route-level) -----
const NoteKind = z.enum(["EMOTIONAL", "POSITIVE"]);

const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  kind: NoteKind.optional(),
  shared: z.union([z.literal("true"), z.literal("false")]).optional(), // string in query
});

const CreateDiaryBody = z.object({
  title: z.string().min(3, "Title should be at least 3 characters"),
  content: z.string().min(10, "Content should be at least 10 characters"),
  kind: NoteKind,
  shared: z.boolean().optional(), // may be omitted entirely
});

const DeleteParams = z.object({
  id: z.string(),
});

// ----- routes -----
const diaryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", requireAuth);

  const prisma = new PrismaClient();
  const svc = new DiaryService(prisma);

  // GET /api/v1/diary-notes
  fastify.get("/", async (request, reply) => {
    const uid = getUidOr401(request, reply);
    if (!uid) return;

    const q = ListQuery.parse(request.query);
    try {
      const data = await svc.list(uid, {
        limit: q.limit,
        cursor: q.cursor,
        kind: q.kind,
        shared: q.shared,
      } as any);
      reply.send(data); // { items, nextCursor? }
    } catch (err) {
      request.log.error({ err }, "GET /diary-notes failed");
      reply.status(500).send({ message: "Internal Server Error" });
    }
  });

  // POST /api/v1/diary-notes
  fastify.post<{ Body: z.infer<typeof CreateDiaryBody> }>(
    "/",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;

      const body = CreateDiaryBody.parse(request.body);

      // *** IMPORTANT: omit `shared` when undefined to satisfy exactOptionalPropertyTypes
      const bodyForSvc = {
        title: body.title,
        content: body.content,
        kind: body.kind,
        ...(body.shared !== undefined ? { shared: body.shared } : {}),
      };

      try {
        const created = await svc.create(uid, bodyForSvc as any);
        await updateStreak(uid);
        reply.code(201).send(created); // { id, title, content, shared, createdAt, kind }
      } catch (err) {
        request.log.error({ err }, "POST /diary-notes failed");
        reply.status(500).send({ message: "Internal Server Error" });
      }
    }
  );

  // DELETE /api/v1/diary-notes/:id
  fastify.delete<{ Params: z.infer<typeof DeleteParams> }>(
    "/:id",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;

      const { id } = DeleteParams.parse(request.params);
      try {
        const res = await svc.deleteOwned(uid, id);
        if (!res) {
          return reply.status(404).send({ message: "Not found" });
        }
        reply.status(204).send();
      } catch (err) {
        request.log.error({ err }, "DELETE /diary-notes/:id failed");
        reply.status(500).send({ message: "Internal Server Error" });
      }
    }
  );

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
};

export default diaryRoutes;
