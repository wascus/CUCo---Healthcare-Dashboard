import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => void | Promise<void>;
  }

  interface FastifyRequest {

    user?: {id:string;email?:string} | null;
    userId?: string | null;
  }

  interface FastifySchema {
    tags?: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    security?: Array<Record<string, string[]>>;
    hide?: boolean;
  }
}
