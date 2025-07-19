import {
  GenerateSeniorStyleSheet,
} from "../generateSeniorStyleSheet";
import { SeniorContext, RepoFile } from "../../schemas/analysis";
import { createLLMFromEnv } from "../../schemas/LLM";

import * as dotenv from "dotenv";
dotenv.config();

describe("GenerateSeniorStyleSheet", () => {
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
    {
      path: "tests/userService.test.ts",
      content: `describe('userService', () => { it('works', () => {}); });`,
      language: "TypeScript",
    },
    {
      path: "validation/userValidation.ts",
      content: `import { z } from 'zod';
export const userSchema = z.object({ name: z.string() });
export function validateUser(u) { return userSchema.parse(u); }`,
      language: "TypeScript",
    },
    {
      path: "utils/errorHelper.ts",
      content: `export function errorHelper(msg) { throw new Error(msg); }`,
      language: "TypeScript",
    },
  ];

  const mockContext: SeniorContext = {
    diffFiles: [],
    relatedFiles: mockFiles,
    techStack: {
      languages: ["TypeScript"],
      frameworks: ["express"],
      libraries: [],
      testFrameworks: ["jest"],
      tooling: ["typescript"],
    },
  };

  it("should generate a style sheet with correct metrics and exemplars", async () => {
    const result = await GenerateSeniorStyleSheet({ seniorContext: mockContext });
    expect(result.quantitative.testsAdded).toBe(1);
    expect(result.quantitative.errorHelperUsage).toBe(1);
    expect(result.quantitative.validationCoveragePct).toBeGreaterThan(0);
    expect(result.exemplars.route.path).toBe("routes/api.ts");
    expect(result.exemplars.service.path).toBe("services/userService.ts");
    expect(result.exemplars.test.path).toBe("tests/userService.test.ts");
    expect(result.exemplars.validation.path).toBe(
      "validation/userValidation.ts"
    );
    expect(result.namingExamples).toContain("getApi");
    expect(result.namingExamples).toContain("getUserService");
  });

  it("should use fallback exemplars if no match is found", async () => {
    const minimalContext: SeniorContext = {
      diffFiles: [],
      relatedFiles: [
        {
          path: "misc/other.ts",
          content: "export function foo() {}",
          language: "TypeScript",
        },
      ],
      techStack: {
        languages: ["TypeScript"],
        frameworks: [],
        libraries: [],
        testFrameworks: [],
        tooling: [],
      },
    };
    const result = await GenerateSeniorStyleSheet({ seniorContext: minimalContext });
    expect(result.exemplars.route.path).toBe("misc/other.ts");
    expect(result.exemplars.service.path).toBe("misc/other.ts");
    expect(result.exemplars.test.path).toBe("misc/other.ts");
    expect(result.exemplars.validation.path).toBe("misc/other.ts");
  });

  it("should generate LLM-powered summaries if LLM is provided", async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, skipping LLM test");
      return;
    }
    const llm = createLLMFromEnv();
    const result = await GenerateSeniorStyleSheet({
      seniorContext: mockContext,
      llmClient: llm,
    });
    console.log(result.layering);
    // Check that the LLM summaries are non-empty and not the fallback string
    expect(result.layering).toBeTruthy();
    expect(result.layering).not.toMatch(
      /^Uses clear separation|^Standard practice/
    );
    expect(result.validation).toBeTruthy();
    expect(result.validation).not.toMatch(
      /^Validation is performed|^Standard practice/
    );
    expect(result.errorHandling).toBeTruthy();
    expect(result.errorHandling).not.toMatch(
      /^Error handling uses|^Standard practice/
    );
    expect(result.naming).toBeTruthy();
    expect(result.naming).not.toMatch(/^Naming follows|^Standard practice/);
  }, 10000);
});
