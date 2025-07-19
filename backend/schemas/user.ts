import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  stage: z.enum(["waiting", "finished"]),
});

export type UserData = z.infer<typeof UserSchema>;
