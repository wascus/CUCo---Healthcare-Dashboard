
import type { FastifyPluginAsync } from "fastify";
import {
  CreateTaskBodySchema,
  UpdateTaskBodySchema,
  CreateTaskBodyType,
  UpdateTaskBodyType,
} from "./tasks.model";
import { TasksService } from "./tasks.service";
import { updateStreak } from "../gamification/streak.service";

const tasksRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new TasksService(fastify.prisma);

  const getUserId = (req: any): string | null => {
    return req.user?.id || req.user?.userId || req.user?.sub || null;
  };

  // All routes in this plugin require authentication
  fastify.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });

  // GET /v1/tasks
  fastify.get("/", async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const tasks = await service.list(userId);
    return reply.send(tasks);
  });

  // POST /v1/tasks
  fastify.post(
    "/",
    { schema: { body: CreateTaskBodySchema } },
    async (request, reply) => {
      const userId = getUserId(request);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      const body = request.body as CreateTaskBodyType;
      const task = await service.create(userId, body);
      await updateStreak(userId);
      return reply.code(201).send(task);
    }
  );

  // PATCH /v1/tasks/:id
  fastify.patch(
    "/:id",
    { schema: { body: UpdateTaskBodySchema } },
    async (request, reply) => {
      const userId = getUserId(request);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const body = request.body as UpdateTaskBodyType;
      const task = await service.update(userId, id, body);

      if (!task) return reply.code(404).send({ message: "Task not found" });
      return reply.send(task);
    }
  );

  // DELETE /v1/tasks/:id
  fastify.delete("/:id", async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) return reply.code(401).send({ message: "Unauthorized" });

    const { id } = request.params as { id: string };
    const success = await service.delete(userId, id);

    if (!success) return reply.code(404).send({ message: "Task not found" });
    return reply.code(204).send();
  });
};

export default tasksRoutes;
