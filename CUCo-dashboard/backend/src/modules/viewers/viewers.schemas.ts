import { z } from "zod";

export const SharePermission = z.enum(["VIEW", "COMMENT", "EDIT"]);

export const UpsertSharesBody = z.object({
  users: z.array(z.object({
    userId: z.string().uuid(),
    permission: SharePermission.optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })).optional(),
  groups: z.array(z.object({
    groupId: z.string().min(1),
    permission: SharePermission.optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })).optional(),
}).refine(v => (v.users?.length ?? 0) + (v.groups?.length ?? 0) > 0, {
  message: "Provide at least one user or group",
});

export const ListSharesParams = z.object({
  userTopicId: z.string().uuid(),
});
export const RevokeShareParams = z.object({
  shareId: z.string().min(1),
});

// Viewer cards returned for “who is sharing with me”
export const ViewerCardZ = z.object({
  id: z.string(), // owner user id
  acceptedAt: z.string(),
  label: z.string().nullable(), 
  fromUser: z.object({
    id: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    email: z.string().nullable(),
  }),
});
export type ViewerCard = z.infer<typeof ViewerCardZ>;

// Topics visible to current user from a specific owner
export const SharedTopicZ = z.object({
  id: z.string(),
  topicId: z.string(),
  title: z.string(),
  placement: z.enum(["base","middle","summit"]),
  status: z.enum(["text","check","tear","image"]),
  description: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
});
export type SharedTopic = z.infer<typeof SharedTopicZ>;
