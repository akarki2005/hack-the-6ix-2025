import { z } from "zod";
import { querySchema } from "./query";
import { UserSchema } from "./user";

export const SubmitRequestSchema = z.object({
  github_link: z.url(),
  queries: z.array(querySchema),
  users: z.array(UserSchema),
});

export type SubmitRequestData = z.infer<typeof SubmitRequestSchema>;

export const SubmitResponseSchema = z.object({
  ok: z.boolean(),
});

export type SubmitResponseData = z.infer<typeof SubmitResponseSchema>;
