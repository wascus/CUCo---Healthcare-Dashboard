import { z } from "zod";
export const CreateGroupBody = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(280).optional(),
});
export const AddMemberBody = z.object({ memberId: z.string().uuid() });
export const ApproveMemberParams = z.object({ groupId: z.string(), memberId: z.string().uuid() });
export const RemoveMemberParams = ApproveMemberParams;
