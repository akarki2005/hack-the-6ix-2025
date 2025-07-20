import { generateTests } from "../generateTests";
import { SeniorContext, RepoFile } from "../../schemas/analysis";
import { createLLMFromEnv } from "../../schemas/LLM";

import * as dotenv from "dotenv";
dotenv.config();

describe("generateTests", () => {
  const mockFiles: RepoFile[] = [
    {
      path: "routes/api.ts",
      content: `import express from 'express';\nconst router = express.Router();\nrouter.get('/api/test', (req, res) => { res.send('ok'); });\nexport function getApi() { return true; }`,
      language: "TypeScript",
    },
    {
      path: "services/userService.ts",
      content: `class UserService {\n  getUser() { return {}; }\n}\nexport function getUserService() { return new UserService(); }`,
      language: "TypeScript",
    },
    {
      path: "tests/userService.test.ts",
      content: `describe('userService', () => { it('works', () => {}); });`,
      language: "TypeScript",
    },
    {
      path: "validation/userValidation.ts",
      content: `import { z } from 'zod';\nexport const userSchema = z.object({ name: z.string() });\nexport function validateUser(u) { return userSchema.parse(u); }`,
      language: "TypeScript",
    },
    {
      path: "utils/errorHelper.ts",
      content: `export function errorHelper(msg) { throw new Error(msg); }`,
      language: "TypeScript",
    },
  ];

  const mockContext: SeniorContext = {
    diffFiles: [
      { path: "routes/api.ts", status: "modified", additions: 1, deletions: 0 },
      {
        path: "services/userService.ts",
        status: "added",
        additions: 1,
        deletions: 0,
      },
    ],
    relatedFiles: mockFiles,
    techStack: {
      languages: ["TypeScript"],
      frameworks: ["express"],
      libraries: [],
      testFrameworks: ["jest"],
      tooling: ["typescript"],
    },
  };

  it("should generate test files for changed files", async () => {
    const result = await generateTests({
      context: mockContext,
      dryRun: true,
    });
    expect(result.proposedTests.length).toBe(2);
    expect(result.proposedTests[0].path).toBe("routes/api.test.ts");
    expect(result.proposedTests[1].path).toBe("services/userService.test.ts");
    expect(result.coverageTargets).toContain("getApi");
    expect(result.coverageTargets).toContain("getUserService");
    expect(result.rationale).toMatch(/Proposed test for/);
  });

  it("should skip test files in relatedFiles", async () => {
    const contextWithTest: SeniorContext = {
      ...mockContext,
      diffFiles: [
        {
          path: "tests/userService.test.ts",
          status: "modified",
          additions: 1,
          deletions: 0,
        },
      ],
    };
    const result = await generateTests({
      context: contextWithTest,
      dryRun: true,
    });
    expect(result.proposedTests.length).toBe(0);
  });

  it("should generate LLM stub if llmClient is provided", async () => {
    const llm = createLLMFromEnv();
    const result = await generateTests({
      context: mockContext,
      dryRun: true,
      llmClient: llm,
    });
    console.log("llm result", result.proposedTests[0].content);
    expect(result.proposedTests[0].content).toBeTruthy();
  }, 50000);
});
