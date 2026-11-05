import type { FastifyPluginAsync } from "fastify";
import {
  getOrCreateStreak,
  updateStreak,
  getStreakStats,
  getMultiplierForUser,
  getAllStreaks,
  resetStreakIfNeeded,
} from "./streak.service";
import { streakSchema, streakStatsSchema } from "./streak.model";

function getAuthUserId(req: any): string | null {
  const u = req?.user;
  return (typeof u?.sub === "string" && u.sub) || u?.id || u?.userId || null;
}

const streakRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/stats",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      try {
        const stats = await getStreakStats(userId);
        return reply.send(stats);
      } catch (err) {
        return reply.code(500).send({ message: "Failed to fetch streak stats" });
      }
    }
  );

  fastify.get(
    "/",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      try {
        const streak = await getOrCreateStreak(userId);
        return reply.send(streak);
      } catch (err) {
        return reply.code(500).send({ message: "Failed to fetch streak" });
      }
    }
  );

  fastify.post(
    "/check",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      try {
        await resetStreakIfNeeded(userId);
        const streak = await updateStreak(userId);
        const stats = await getStreakStats(userId);
        
        return reply.send({
          streak,
          stats,
        });
      } catch (err) {
        console.error("Streak check error:", err);
        return reply.code(500).send({ message: "Failed to update streak" });
      }
    }
  );

  fastify.get(
    "/multiplier",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      try {
        const multiplier = await getMultiplierForUser(userId);
        return reply.send({ multiplier });
      } catch (err) {
        return reply.code(500).send({ message: "Failed to fetch multiplier" });
      }
    }
  );

  fastify.get(
    "/all",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.code(401).send({ message: "Unauthorized" });

      try {
        const streaks = await getAllStreaks();
        return reply.send(streaks);
      } catch (err) {
        return reply.code(500).send({ message: "Failed to fetch streaks" });
      }
    }
  );
};

export default streakRoutes;
