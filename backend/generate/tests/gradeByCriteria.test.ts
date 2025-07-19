import { gradeByCriteria } from "../gradeByCriteria";
import { SeniorContext, CriterionScore, RepoFile, DiffFile } from "../../schemas/analysis";
import { queryData } from "../../schemas/query";
import { LLM, createLLMFromEnv } from "../../schemas/LLM";
import * as utils from "../utils";

import * as dotenv from "dotenv";
dotenv.config();

jest.mock("../utils");

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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return empty array for empty criteria", async () => {
    const result = await gradeByCriteria({
      context: mockContext,
      criteria: [],
    });

    expect(result).toEqual([]);
  });

  it("should return default scores when no LLM client is provided", async () => {
    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: "Code Quality",
      score: 50,
      justification: "No LLM client provided",
      suggestions: ["Manual review required"],
      weight: 8,
    });
    expect(result[1]).toEqual({
      name: "Security",
      score: 50,
      justification: "No LLM client provided",
      suggestions: ["Manual review required"],
      weight: 9,
    });
    expect(result[2]).toEqual({
      name: "Performance",
      score: 50,
      justification: "No LLM client provided",
      suggestions: ["Manual review required"],
      weight: 6,
    });
  });

  it("should return default scores when LLM client has no ai property", async () => {
    const invalidLLM = { ai: null } as any;

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: invalidLLM,
    });

    expect(result).toHaveLength(3);
    expect(result[0].score).toBe(50);
    expect(result[0].justification).toBe("No LLM client provided");
  });

  it("should parse and return LLM scores when valid JSON response is provided", async () => {
    const mockResponse = JSON.stringify([
      {
        name: "Code Quality",
        score: 85,
        justification: "Code follows good practices with clear naming and structure",
        suggestions: ["Add more comments", "Extract complex logic into separate functions"]
      },
      {
        name: "Security",
        score: 92,
        justification: "No obvious security vulnerabilities found",
        suggestions: ["Add input validation", "Consider rate limiting"]
      },
      {
        name: "Performance",
        score: 78,
        justification: "Code is generally efficient but could be optimized",
        suggestions: ["Cache frequently accessed data", "Use async/await properly"]
      }
    ]);

    (utils.generate as jest.Mock).mockResolvedValue(mockResponse);

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(utils.generate).toHaveBeenCalledWith(
      mockLLM.ai,
      expect.stringContaining("Code Quality")
    );
    expect(utils.generate).toHaveBeenCalledWith(
      mockLLM.ai,
      expect.stringContaining("Security")
    );
    expect(utils.generate).toHaveBeenCalledWith(
      mockLLM.ai,
      expect.stringContaining("Performance")
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: "Code Quality",
      score: 85,
      justification: "Code follows good practices with clear naming and structure",
      suggestions: ["Add more comments", "Extract complex logic into separate functions"],
      weight: 8,
    });
    expect(result[1]).toEqual({
      name: "Security",
      score: 92,
      justification: "No obvious security vulnerabilities found",
      suggestions: ["Add input validation", "Consider rate limiting"],
      weight: 9,
    });
    expect(result[2]).toEqual({
      name: "Performance",
      score: 78,
      justification: "Code is generally efficient but could be optimized",
      suggestions: ["Cache frequently accessed data", "Use async/await properly"],
      weight: 6,
    });
  });

  it("should handle invalid JSON response from LLM", async () => {
    const invalidJsonResponse = "This is not valid JSON response";

    (utils.generate as jest.Mock).mockResolvedValue(invalidJsonResponse);

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: "Code Quality",
      score: 75,
      justification: expect.stringContaining("LLM response could not be parsed"),
      suggestions: ["Review the code manually for this criterion"],
      weight: 8,
    });
  });

  it("should handle non-array JSON response from LLM", async () => {
    const nonArrayResponse = JSON.stringify({
      message: "This is an object, not an array"
    });

    (utils.generate as jest.Mock).mockResolvedValue(nonArrayResponse);

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(result).toHaveLength(3);
    expect(result[0].score).toBe(75);
    expect(result[0].justification).toContain("LLM response could not be parsed");
  });

  it("should handle LLM errors gracefully", async () => {
    const errorMessage = "LLM API failed";
    (utils.generate as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: "Code Quality",
      score: 50,
      justification: `Error evaluating criteria: ${errorMessage}`,
      suggestions: ["Manual review required due to evaluation error"],
      weight: 8,
    });
  });

  it("should clamp scores to valid range (0-100)", async () => {
    const mockResponse = JSON.stringify([
      {
        name: "Code Quality",
        score: 150, // Invalid high score
        justification: "Perfect code",
        suggestions: []
      },
      {
        name: "Security",
        score: -10, // Invalid low score
        justification: "Poor security",
        suggestions: ["Fix everything"]
      },
      {
        name: "Performance",
        score: 75, // Valid score
        justification: "Good performance",
        suggestions: []
      }
    ]);

    (utils.generate as jest.Mock).mockResolvedValue(mockResponse);

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(result[0].score).toBe(100); // Clamped to 100
    expect(result[1].score).toBe(0);   // Clamped to 0
    expect(result[2].score).toBe(75);  // Unchanged
  });

  it("should handle partial LLM response and use fallback for missing criteria", async () => {
    const partialResponse = JSON.stringify([
      {
        name: "Code Quality",
        score: 85,
        justification: "Good quality",
        suggestions: ["Keep it up"]
      }
      // Missing Security and Performance criteria
    ]);

    (utils.generate as jest.Mock).mockResolvedValue(partialResponse);

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: mockCriteria,
      llmClient: mockLLM,
    });

    expect(result).toHaveLength(3);
    expect(result[0].score).toBe(85); // From LLM response
    expect(result[1].score).toBe(50); // Fallback for missing
    expect(result[2].score).toBe(50); // Fallback for missing
  });

  it("should use real LLM if API key is available", async () => {
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, skipping real LLM test");
      return;
    }

    const realLLM = createLLMFromEnv();
    const singleCriterion: queryData[] = [
      {
        criteria_label: "Code Quality",
        definition: "Code should be clean and readable",
        importance: 8,
      }
    ];

    const result = await gradeByCriteria({
      context: mockContext,
      criteria: singleCriterion,
      llmClient: realLLM,
    });

    console.error("RESULT:", result);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Code Quality");
    expect(result[0].score).toBeGreaterThanOrEqual(0);
    expect(result[0].score).toBeLessThanOrEqual(100);
    expect(result[0].justification).toBeTruthy();
    expect(result[0].weight).toBe(8);
  }, 15000);
});
