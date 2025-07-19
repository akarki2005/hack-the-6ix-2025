import { GenerateSeniorStyleSheet } from "../generateSeniorStyleSheet";
import { SeniorContext, RepoFile } from "../../schemas/analysis";

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

  it("should generate a style sheet with correct metrics and exemplars", () => {
    const result = GenerateSeniorStyleSheet({ seniorContext: mockContext });
    expect(result.quantitative.testsAdded).toBe(1);
    expect(result.quantitative.errorHelperUsage).toBe(1);
    expect(result.quantitative.validationCoveragePct).toBeGreaterThan(0);
    expect(result.exemplars.route.path).toBe("routes/api.ts");
    expect(result.exemplars.service.path).toBe("services/userService.ts");
    expect(result.exemplars.test.path).toBe("tests/userService.test.ts");
    expect(result.exemplars.validation.path).toBe("validation/userValidation.ts");
    expect(result.namingExamples).toContain("getApi");
    expect(result.namingExamples).toContain("getUserService");
  });

  it("should use fallback exemplars if no match is found", () => {
    const minimalContext: SeniorContext = {
      diffFiles: [],
      relatedFiles: [
        { path: "misc/other.ts", content: "export function foo() {}", language: "TypeScript" },
      ],
      techStack: {
        languages: ["TypeScript"],
        frameworks: [],
        libraries: [],
        testFrameworks: [],
        tooling: [],
      },
    };
    const result = GenerateSeniorStyleSheet({ seniorContext: minimalContext });
    expect(result.exemplars.route.path).toBe("misc/other.ts");
    expect(result.exemplars.service.path).toBe("misc/other.ts");
    expect(result.exemplars.test.path).toBe("misc/other.ts");
    expect(result.exemplars.validation.path).toBe("misc/other.ts");
  });
}); 