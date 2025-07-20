import { z } from "zod";
import { querySchema } from "./query";
import { UserSchema } from "./user";

export const CandidateSchema = z.object({
  name: z.string(),
  githubUsername: z.string(),
});

export const CriterionSchema = z.object({
  name: z.string(),
  description: z.string(),
  weight: z.number(),
});

export const SubmitRequestSchema = z.object({
repoOwner: z.string(),
repoName: z.string(),
candidates: z.array(CandidateSchema),
criteria: z.array(CriterionSchema),
auth0Id: z.string(),
userName: z.string(),
userEmail: z.string().email(),
});

export type SubmitRequestData = z.infer<typeof SubmitRequestSchema>;

export const SubmitResponseSchema = z.object({
  ok: z.boolean(),
  assessmentId: z.string().optional(),
});

export type SubmitResponseData = z.infer<typeof SubmitResponseSchema>;