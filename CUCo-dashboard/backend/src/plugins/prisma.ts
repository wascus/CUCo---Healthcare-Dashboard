import fp from "fastify-plugin";
import { prisma } from "../lib/prisma";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export default fp(async (fastify) => {
  fastify.decorate("prisma", prisma);
  
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
