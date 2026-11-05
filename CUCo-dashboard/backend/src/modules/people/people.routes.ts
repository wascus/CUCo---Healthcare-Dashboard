// // backend/src/modules/people/people.routes.ts
// import type { FastifyPluginAsync } from "fastify";
// import { requireAuth } from "../../middleware/requireAuth";
// import { peopleService } from "./people.service";

// // ---- JSON Schema enums as plain arrays (runtime) ----
// const PersonRoleEnum = ["individual", "friend", "doctor", "acquaintance"] as const;
// const EdgeTypeEnum = ["friend", "family", "doctor", "acquaintance"] as const;

// // ---- Schemas (cast to any so Fastify TS types don't get in the way) ----
// const PersonSchema: any = {
//   type: "object",
//   required: ["id", "fullName", "role"],
//   additionalProperties: false,
//   properties: {
//     id: { type: "string" },
//     fullName: { type: "string" },
//     role: { type: "string", enum: [...PersonRoleEnum] },
//     email: { type: "string" },
//     phone: { type: "string" },
//     avatarUrl: { type: "string" },
//     tags: { type: "array", items: { type: "string" } }
//   }
// };

// const EdgeSchema: any = {
//   type: "object",
//   required: ["from", "to", "type"],
//   additionalProperties: false,
//   properties: {
//     from: { type: "string" },
//     to: { type: "string" },
//     type: { type: "string", enum: [...EdgeTypeEnum] },
//     strength: { type: "number", minimum: 0, maximum: 1 }
//   }
// };

// const ListResponse: any = {
//   type: "object",
//   required: ["items", "total", "limit", "offset"],
//   properties: {
//     items: { type: "array", items: PersonSchema },
//     total: { type: "number" },
//     limit: { type: "number" },
//     offset: { type: "number" }
//   }
// };

// const RelationsResponse: any = {
//   type: "object",
//   required: ["personId", "nodes", "edges"],
//   properties: {
//     personId: { type: "string" },
//     nodes: { type: "array", items: PersonSchema },
//     edges: { type: "array", items: EdgeSchema }
//   }
// };

// // ---- Route types ----
// type ListQuery = {
//   search?: string;
//   limit?: number;   // Fastify/Ajv will coerce ints from querystring with our schema
//   offset?: number;
// };
// type IdParams = { id: string };

// const peopleRoutes: FastifyPluginAsync = async (app) => {
//   // GET /api/v1/people?search=&limit=&offset=
//   app.get<{ Querystring: ListQuery }>(
//     "/",
//     {
//       preHandler: [requireAuth],
//       schema: {
//         querystring: {
//           type: "object",
//           additionalProperties: false,
//           properties: {
//             search: { type: "string" },
//             limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
//             offset: { type: "integer", minimum: 0, default: 0 }
//           }
//         } as any,
//         response: { 200: ListResponse }
//       }
//     },
//     async (req, reply) => {
//       const { search, limit = 20, offset = 0 } = req.query || {};
//       const opts:{limit:number; offset:number; search?:string} = {limit,offset};
//       if (search !== undefined) opts.search = search;

//       const data = await peopleService.list(opts);
//       return reply.send(data);
//     }
//   );

//   // GET /api/v1/people/:id
//   app.get<{ Params: IdParams }>(
//     "/:id",
//     {
//       preHandler: [requireAuth],
//       schema: {
//         params: {
//           type: "object",
//           required: ["id"],
//           properties: { id: { type: "string" } }
//         } as any,
//         response: { 200: PersonSchema }
//       }
//     },
//     async (req, reply) => {
//       const p = await peopleService.getById(req.params.id);
//       if (!p) return reply.code(404).send({ message: "Not found" });
//       return reply.send(p);
//     }
//   );

//   // GET /api/v1/people/:id/relations
//   app.get<{ Params: IdParams }>(
//     "/:id/relations",
//     {
//       preHandler: [requireAuth],
//       schema: {
//         params: {
//           type: "object",
//           required: ["id"],
//           properties: { id: { type: "string" } }
//         } as any,
//         response: { 200: RelationsResponse }
//       }
//     },
//     async (req, reply) => {
//       const id = req.params.id;
//       const p = await peopleService.getById(id);
//       if (!p) return reply.code(404).send({ message: "Not found" });
//       const rel = await peopleService.getRelationsOf(id);
//       return reply.send(rel);
//     }
//   );
// };

// export default peopleRoutes;

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { prisma } from "../../lib/prisma";

const peopleRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/people/lookup",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const q = z.object({ email: z.string().email() }).safeParse(req.query);
      if (!q.success) return reply.code(400).send({ message: "Invalid email" });

      const email = q.data.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, username: true },
      });

      return reply.send({ found: !!user, user: user ?? null });
    }
  );
};

export default peopleRoutes;
