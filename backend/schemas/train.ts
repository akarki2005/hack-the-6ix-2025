import { z } from "zod";

export const trainRequestSchema = z.object({
  github_link: z.url(),
});

export type trainRequestData = z.infer<typeof trainRequestSchema>;

export const trainResponseSchema = z.object({
  ok: z.boolean(),
});

export type trainResponseData = z.infer<typeof trainResponseSchema>;
