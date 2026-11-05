import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  // Register cookie exactly once in the whole app
  fastify.register(cookie);

  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    cookie: { cookieName: "token", signed: false }, // reads JWT from "token" cookie
  });

  // Auth guard usable in routes: { preHandler: fastify.authenticate }
  fastify.decorate("authenticate", async function (req, reply) {
    try {
      await req.jwtVerify(); // pulls token from cookie per config above
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });
});
