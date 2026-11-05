import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../middleware/requireAuth";
import {
  CreateForUser,
  CreateForContact,
  InviteByEmail,
  UpdateConnection,
  RespondToInvite,
  IdParam,
  type CreateForUserInput,
  type CreateForContactInput,
  type InviteByEmailInput,
  type UpdateConnectionInput,
  type IdParamInput,
} from "./connections.schemas";
import {
  listConnections,
  createConnectionForUser,
  createConnectionForContact,
  inviteByEmail,
  updateConnection,
  removeConnection,
  respondToInvite,
  renewConnection,
  getRequestsHistory,
} from "./connections.service";

const connectionsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", requireAuth);

  app.get("/connections", async (req, reply) => {
    const meId = (req as any).userId as string;
    const list = await listConnections(meId);
    reply.send(list);
  });

  app.post<{ Body: CreateForUserInput }>("/connections/user", async (req, reply) => {
    const meId = (req as any).userId as string;
    const parsed = CreateForUser.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid body", errors: parsed.error.flatten() });
    const created = await createConnectionForUser(meId, parsed.data);
    reply.code(201).send(created);
  });

  app.post<{ Body: CreateForContactInput }>("/connections/contact", async (req, reply) => {
    const meId = (req as any).userId as string;
    const parsed = CreateForContact.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid body", errors: parsed.error.flatten() });
    const created = await createConnectionForContact(meId, parsed.data);
    reply.code(201).send(created);
  });

  app.post<{ Body: InviteByEmailInput }>("/connections/invite", async (req, reply) => {
    const meId = (req as any).userId as string;
    const parsed = InviteByEmail.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid body", errors: parsed.error.flatten() });
    const created = await inviteByEmail(meId, parsed.data);
    reply.code(201).send(created);
  });

  app.patch<{ Params: IdParamInput; Body: UpdateConnectionInput }>(
    "/connections/:id",
    async (req, reply) => {
      const meId = (req as any).userId as string;
      const { id } = IdParam.parse(req.params);
      const parsed = UpdateConnection.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ message: "Invalid body", errors: parsed.error.flatten() });
      const updated = await updateConnection(meId, id, parsed.data);
      reply.send(updated);
    }
  );
  app.post<{ Params: { id: string }; Body: { expiresAt?: string | null } }>(
    "/connections/:id/renew",
    async (req, reply) => {
      const meId = (req as any).userId as string;
      const { id } = req.params;
      const { expiresAt } = (req.body ?? {}) as { expiresAt?: string | null };
      const r = await renewConnection(meId, id, expiresAt);
      reply.send(r);
    }
  );
  // DELETE revoke
  app.delete<{ Params: IdParamInput }>("/connections/:id", async (req, reply) => {
    const meId = (req as any).userId as string;
    const { id } = IdParam.parse(req.params);
    const res = await removeConnection(meId, id);
    reply.send(res);
  });

  app.post<{ Params: IdParamInput; Body: { action: "accept" | "decline" } }>(
    "/connections/:id/respond",
    async (req, reply) => {
      const meId = (req as any).userId as string;
      const { id } = IdParam.parse(req.params);
      const parsed = RespondToInvite.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ message: "Invalid body", errors: parsed.error.flatten() });
      const result = await respondToInvite(meId, id, parsed.data.action);
      reply.send(result);
    }
  );

   /* ===== List my connections ===== */
   app.get(
    "/requests/history",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const meId = (req as any).userId as string;
    const q = (req.query as any) || {};
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 10)));

    const data = await getRequestsHistory({ userId: meId, page, pageSize });
    console.log(data);
    
    reply.send(data); // { items, total }
    }
  );

};


export default connectionsRoutes;
