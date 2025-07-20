import { z } from "zod";

export const gradeRequestSchema = z.object({
  github_link: z.url(),
  user: z.string(),
  repo: z.string(),
});

export type gradeRequestData = z.infer<typeof gradeRequestSchema>;

export const gradeResponseSchema = z.object({
  ok: z.boolean(),
});

export type gradeResponseData = z.infer<typeof gradeResponseSchema>;
