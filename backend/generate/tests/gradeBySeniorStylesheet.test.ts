import { gradeBySeniorStyleSheet } from "../gradeBySeniorStyleSheet";
import {
  SeniorContext,
  SeniorStyleSheet,
  RepoFile,
  DiffFile,
} from "../../schemas/analysis";
import { LLM, createLLMFromEnv } from "../../schemas/LLM";
import * as utils from "../utils"; // kept for symmetry with the other test

import * as dotenv from "dotenv";
dotenv.config();

describe("gradeBySeniorStyleSheet", () => {
  const mockFiles: RepoFile[] = [
    {
      path: "routes/api.ts",
      content: `import express from 'express';
const router = express.Router();
router.get('/api/test', (req, res) => { res.send('ok'); });
export function getApi() { return true; }`,
      language: "TypeScript",
    },
    {
      path: "services/userService.ts",
      content: `class UserService {
  getUser() { return {}; }
}
export function getUserService() { return new UserService(); }`,
      language: "TypeScript",
    },
  ];

  const mockDiffFiles: DiffFile[] = [
    { path: "routes/api.ts", status: "modified", additions: 5, deletions: 2 },
    { path: "services/userService.ts", status: "added", additions: 10, deletions: 0 },
  ];

  const mockContext: SeniorContext = {
    diffFiles: mockDiffFiles,
    relatedFiles: mockFiles,
    techStack: {
      languages: ["TypeScript"],
      frameworks: ["express"],
      libraries: ["lodash"],
      testFrameworks: ["jest"],
      tooling: ["typescript"],
    },
  };

  const mockStyleSheet: SeniorStyleSheet = {
    layering: "Separate routes, services, and validation layers.",
    validation: "Use zod schemas for input validation.",
    errorHandling: "Centralized error handling with custom helpers.",
    naming: "camelCase for functions, PascalCase for classes.",
    modularity: {
      maxFunctionLoc: 30,
      duplicationRule: "Avoid duplicate code; extract helpers.",
    },
    testing: "Comprehensive unit and integration tests.",
    logging: "Structured logging with context information.",
    security: "Follow OWASP top 10 best practices.",
    apiContract: "RESTful contracts with explicit status codes.",
    exemplars: {},
    quantitative: {
      avgFunctionLoc: 15,
      testsAdded: 5,
      errorHelperUsage: 2,
      validationCoveragePct: 80,
    },
    namingExamples: ["getApi", "getUserService"],
    rawSourceMeta: undefined,
  };

  const mockLLM: LLM = {
    ai: {
      models: {
        generateContent: jest.fn(),
      },
    } as any,
  };

  it("should use real LLM if API key is available", async () => {
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, skipping real LLM test");
      return;
    }

    const realLLM = createLLMFromEnv();

    const result = await gradeBySeniorStyleSheet({
      context: mockContext,
      seniorStyleSheet: mockStyleSheet,
      llmClient: realLLM,
    });

    console.log(result);

    expect(result.length).toBe(9);
    expect(result[0].name).toBe("Layering Architecture");
    expect(result[0].score).toBeGreaterThanOrEqual(0);
    expect(result[0].score).toBeLessThanOrEqual(100);
    expect(result[0].justification).toBeTruthy();
    expect(result[0].weight).toBe(10);
  }, 15000);
});
