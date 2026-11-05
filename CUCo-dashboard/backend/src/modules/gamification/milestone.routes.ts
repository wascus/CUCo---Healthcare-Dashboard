import type { FastifyPluginAsync } from "fastify";
import {
  getUserMilestones,
  claimMilestoneReward,
  checkAndUpdateMilestones,
  markMilestoneCompleted,
} from "./milestone.service";

function getAuthUserId(req: any): string | null {
  const u = req?.user;
  return (typeof u?.sub === "string" && u.sub) || u?.id || u?.userId || null;
}

const milestoneRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const userId = getAuthUserId(req);
        if (!userId) return reply.code(401).send({ message: "Unauthorized" });

        const milestones = await getUserMilestones(userId);
        return reply.send(milestones);
      } catch (error) {
        console.error("Error fetching milestones:", error);
        return reply.code(500).send({
          message: "Failed to fetch milestones",
        });
      }
    }
  );

  fastify.post<{ Params: { milestoneId: string } }>(
    "/:milestoneId/claim",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = getAuthUserId(request);
        if (!userId) return reply.code(401).send({ message: "Unauthorized" });

        const { milestoneId } = request.params;

        const result = await claimMilestoneReward(userId, milestoneId);
        return reply.send(result);
      } catch (error: any) {
        console.error("Error claiming milestone reward:", error);
        return reply.code(400).send({
          message: error?.message || "Failed to claim milestone reward",
        });
      }
    }
  );

  fastify.post(
    "/check",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = getAuthUserId(request);
        if (!userId) return reply.code(401).send({ message: "Unauthorized" });

        await checkAndUpdateMilestones(userId);
        const milestones = await getUserMilestones(userId);
        return reply.send(milestones);
      } catch (error) {
        console.error("Error checking milestones:", error);
        return reply.code(500).send({
          message: "Failed to check milestones",
        });
      }
    }
  );

  fastify.post<{ Params: { milestoneKey: string } }>(
    "/:milestoneKey/complete",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      try {
        const userId = getAuthUserId(request);
        if (!userId) return reply.code(401).send({ message: "Unauthorized" });

        const { milestoneKey } = request.params;

        const result = await markMilestoneCompleted(userId, milestoneKey);
        return reply.send(result);
      } catch (error: any) {
        console.error("Error marking milestone complete:", error);
        return reply.code(400).send({
          message: error?.message || "Failed to mark milestone complete",
        });
      }
    }
  );
};

export default milestoneRoutes;
