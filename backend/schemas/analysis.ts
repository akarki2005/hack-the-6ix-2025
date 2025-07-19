import { z } from "zod";

// RepoFile Schema
export const RepoFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  language: z.string().optional(),
});

// DiffFile Schema
export const DiffFileSchema = z.object({
  path: z.string(),
  status: z.enum(["added", "removed", "modified", "renamed"]),
  patch: z.string().optional(),
  additions: z.number(),
  deletions: z.number(),
  previousPath: z.string().optional(),
});

// TechStack Schema
export const TechStackSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  libraries: z.array(z.string()),
  testFrameworks: z.array(z.string()),
  tooling: z.array(z.string()),
});

// SeniorContext Schema
export const SeniorContextSchema = z.object({
  diffFiles: z.array(DiffFileSchema),
  relatedFiles: z.array(RepoFileSchema),
  techStack: TechStackSchema,
});

// SeniorStyleSheet Schema
export const SeniorStyleSheetSchema = z.object({
  layering: z.string(),
  validation: z.string(),
  errorHandling: z.string(),
  naming: z.string(),
  modularity: z.object({
    maxFunctionLoc: z.number(),
    duplicationRule: z.string(),
  }),
  testing: z.string(),
  logging: z.string(),
  security: z.string(),
  apiContract: z.string(),
  exemplars: z.record(z.string(), RepoFileSchema.optional()), // dictionary of good code
  quantitative: z.object({
    avgFunctionLoc: z.number().optional(),
    testsAdded: z.number().optional(),
    errorHelperUsage: z.number().optional(),
    validationCoveragePct: z.number().optional(),
  }),
  namingExamples: z.array(z.string()).optional(),
  rawSourceMeta: z
    .object({
      prNumber: z.number().optional(),
      baseRef: z.string().optional(),
      headRef: z.string().optional(),
    })
    .optional(),
});

// UserCriterion Schema
export const UserCriterionSchema = z.object({
  name: z.string(),
  definition: z.string(),
  importance: z.number(),
});

// CriterionScore Schema
export const CriterionScoreSchema = z.object({
  name: z.string(),
  score: z.number(),
  justification: z.string(),
  suggestions: z.array(z.string()).optional(),
  weight: z.number().optional(),
});

// TestResult Schema
export const TestResultSchema = z.object({
  total: z.number(),
  passed: z.number(),
  failed: z.number(),
  durationMs: z.number().optional(),
  failedTests: z
    .array(
      z.object({
        name: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

// GradeReport Schema
export const GradeReportSchema = z.object({
  byUserCriteria: z.array(CriterionScoreSchema).optional(),
  bySeniorCriteria: z.array(CriterionScoreSchema).optional(),
  tests: TestResultSchema.optional(),
  overall: z
    .object({
      weightedScore: z.number().optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
});

export type RepoFile = z.infer<typeof RepoFileSchema>;
export type DiffFile = z.infer<typeof DiffFileSchema>;
export type TechStack = z.infer<typeof TechStackSchema>;
export type SeniorContext = z.infer<typeof SeniorContextSchema>;
export type SeniorStyleSheet = z.infer<typeof SeniorStyleSheetSchema>;
export type UserCriterion = z.infer<typeof UserCriterionSchema>;
export type CriterionScore = z.infer<typeof CriterionScoreSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type GradeReport = z.infer<typeof GradeReportSchema>;
