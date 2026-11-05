import { z } from "zod";

/** Enums must match your Prisma enums */
export const RelationshipTypeEnum = z.enum([
  "BEST_FRIEND",
  "GOOD_FRIEND",
  "PARTNER",
  "PARENT",
  "CHILD",
  "SIBLING",
  "AUNT_UNCLE",
  "COUSIN",        
  "THERAPIST",
  "DOCTOR",
  "OTHER",
]);

export const AccessLevelEnum = z.enum([
  "NONE",
  "POSITIVE_ONLY",
  "NEGATIVE_ONLY",
  "FULL",
  "CUSTOM",
]);

export const ConnectionStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "BLOCKED",
  "REVOKED",
]);

export const CreateForUser = z.object({
  targetUserId: z.string().min(1),
  relationship: RelationshipTypeEnum,
  accessLevel: AccessLevelEnum,
  // label is derived on the server from relationship, but allow explicit override
  label: z.string().max(64).nullable().optional(),
  invitedVia: z.string().max(32).nullable().optional(),
});
export type CreateForUserInput = z.infer<typeof CreateForUser>;

export const CreateForContact = z.object({
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
  }),
  relationship: RelationshipTypeEnum,
  accessLevel: AccessLevelEnum,
  label: z.string().max(64).nullable().optional(),
  invitedVia: z.string().max(32).nullable().optional(),
});
export type CreateForContactInput = z.infer<typeof CreateForContact>;

export const InviteByEmail = z.object({
  email: z.string().email(),
  relationship: RelationshipTypeEnum,
  accessLevel: AccessLevelEnum,
  label: z.string().max(64).nullable().optional(),
});
export type InviteByEmailInput = z.infer<typeof InviteByEmail>;

export const UpdateConnection = z.object({
  relationship: RelationshipTypeEnum.optional(),
  accessLevel: AccessLevelEnum.optional(),
  label: z.string().max(64).nullable().optional(),
  /** Timed access support (backend persists only expiresAt) */
  expiresAt: z.string().datetime().nullable().optional(),
  /** The base level (e.g. FULL) for a CUSTOM access type */
  customBase: AccessLevelEnum.nullable().optional(),
  /** Optional misc */
  note: z.string().max(2000).nullable().optional(),
});
export type UpdateConnectionInput = z.infer<typeof UpdateConnection>;

export const RespondToInvite = z.object({
  action: z.enum(["accept", "decline"]),
});
export type RespondToInviteInput = z.infer<typeof RespondToInvite>;

export const IdParam = z.object({ id: z.string().min(1) });
export type IdParamInput = z.infer<typeof IdParam>;
