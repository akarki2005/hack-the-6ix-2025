import { gradeByCriteria } from "../gradeByCriteria";
import { SeniorContext, CriterionScore, RepoFile, DiffFile } from "../../schemas/analysis";
import { queryData } from "../../schemas/query";
import { LLM, createLLMFromEnv } from "../../schemas/LLM";
import * as utils from "../utils";

import * as dotenv from "dotenv";
dotenv.config();

describe("gradeByCriteria", () => {
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

  const mockCriteria: queryData[] = [
    {
      criteria_label: "Code Quality",
      definition: "Code should be clean, readable, and follow best practices",
      importance: 8,
    },
    {
      criteria_label: "Security",
      definition: "Code should follow security best practices and avoid vulnerabilities",
      importance: 9,
    },
    {
      criteria_label: "Performance",
      definition: "Code should be efficient and performant",
      importance: 6,
    },
  ];

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

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: realLLM,
    });

    console.log(result);

    expect(result.length).toBe(3);
    expect(result[0].name).toBe("Code Quality");
    expect(result[0].score).toBeGreaterThanOrEqual(0);
    expect(result[0].score).toBeLessThanOrEqual(100);
    expect(result[0].justification).toBeTruthy();
    expect(result[0].weight).toBe(8);
  }, 15000);
});
