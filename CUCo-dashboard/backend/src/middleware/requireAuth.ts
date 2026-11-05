import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "token";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  // 1) Try Authorization: Bearer <token>
  let token: string | undefined;
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) token = h.slice(7);

  // 2) Fallback to cookie
  if (!token) token = (req as any).cookies?.[COOKIE_NAME];

  if (!token) {
    return reply.status(401).send({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id?: string; sub?: string; email?: string };
    const id = payload.id ?? payload.sub;
    if (!id) return reply.status(401).send({ error: "Invalid token" });

    // set both shapes for old/new code paths
    (req as any).userId = id;
    (req as any).user = { id, email: payload.email };

    // prevent caching of user-scoped data
    reply.header("Cache-Control", "no-store");
    reply.header("Vary", "Cookie");
  } catch {
    return reply.status(401).send({ error: "Not authenticated" });
  }
}
