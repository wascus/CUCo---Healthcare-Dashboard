import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import {
  CreateGroupBody,
  AddMemberBody,
  ApproveMemberParams,
  RemoveMemberParams,
} from "./groups.schemas";
import {
  createGroup,
  listGroupsOwned,
  addMember,
  approveMember,
  removeMember,
  listGroupMembers,
} from "./groups.service";

const getUidOr401 = (req: FastifyRequest, reply: FastifyReply) => {
  const uid = (req as any).userId as string | undefined;
  if (!uid) {
    reply.status(401).send({ message: "Unauthorized" });
    return undefined;
  }
  return uid;
};

const groupsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", requireAuth);

  // POST /api/v1/groups
  fastify.post<{ Body: z.infer<typeof CreateGroupBody> }>(
    "/groups",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;
      const body = CreateGroupBody.parse(request.body);

      const group = await createGroup(uid, {
        name: body.name,
        description: body.description ?? null,
      });

      reply.code(201).send(group);
    }
  );

  // GET /api/v1/groups
  fastify.get("/groups", async (request, reply) => {
    const uid = getUidOr401(request, reply);
    if (!uid) return;
    const groups = await listGroupsOwned(uid);
    reply.send({ items: groups });
  });

  // POST /api/v1/groups/:groupId/members
  fastify.post<{ Params: { groupId: string }; Body: z.infer<typeof AddMemberBody> }>(
    "/groups/:groupId/members",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;
      const { groupId } = z.object({ groupId: z.string() }).parse(request.params);
      const body = AddMemberBody.parse(request.body);
      const res = await addMember(uid, groupId, body.memberId);
      reply.code(201).send(res);
    }
  );

  // POST /api/v1/groups/:groupId/members/:memberId/approve
  fastify.post<{ Params: z.infer<typeof ApproveMemberParams> }>(
    "/groups/:groupId/members/:memberId/approve",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;
      const { groupId, memberId } = ApproveMemberParams.parse(request.params);
      await approveMember(uid, groupId, memberId);
      reply.status(204).send();
    }
  );

  // DELETE /api/v1/groups/:groupId/members/:memberId
  fastify.delete<{ Params: z.infer<typeof RemoveMemberParams> }>(
    "/groups/:groupId/members/:memberId",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;
      const { groupId, memberId } = RemoveMemberParams.parse(request.params);
      await removeMember(uid, groupId, memberId);
      reply.status(204).send();
    }
  );

  // GET /api/v1/groups/:groupId/members
  fastify.get<{ Params: { groupId: string } }>(
    "/groups/:groupId/members",
    async (request, reply) => {
      const uid = getUidOr401(request, reply);
      if (!uid) return;
      const { groupId } = z.object({ groupId: z.string() }).parse(request.params);
      const items = await listGroupMembers(uid, groupId);
      reply.send({ items });
    }
  );
};

export default groupsRoutes;
