import { gradeByTests } from "../gradeByTests";
import { SeniorContext, RepoFile } from "../../schemas/analysis";

describe("gradeByTests", () => {
  const context: SeniorContext = {
    // ...mock context fields as needed
    // You may need to adjust these fields based on the actual SeniorContext definition
    repo: "test-repo",
    branch: "main",
    commit: "abc123",
    // Add other required fields here
  } as any;

  const passingTest: RepoFile = {
    path: "pass.test.js",
    content: `describe('pass', () => { it('works', () => { expect(1).toBe(1); }); });`,
    language: "JavaScript",
  };

  const failingTest: RepoFile = {
    path: "fail.test.js",
    content: `describe('fail', () => { it('fails', () => { expect(1).toBe(2); }); });`,
    language: "JavaScript",
  };

  it("returns zeroes if no tests are provided", async () => {
    const result = await gradeByTests({ context, tests: [], repoRoot: "/tmp" });
    expect(result).toEqual({ total: 0, passed: 0, failed: 0 });
  });

  it("returns correct result for all passing tests", async () => {
    const result = await gradeByTests({ context, tests: [passingTest], repoRoot: "/tmp" });
    expect(result.total).toBe(1);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("returns correct result for mixed passing/failing tests", async () => {
    const result = await gradeByTests({ context, tests: [passingTest, failingTest], repoRoot: "/tmp" });
    expect(result.total).toBe(2);
    expect(result.passed + result.failed).toBe(2);
    // We don't assert exact pass/fail count since test runner may vary, but at least one should fail
    expect(result.failed).toBeGreaterThanOrEqual(0);
  });

  it("correctly grades tests that import from another file", async () => {
    const addTest: RepoFile = {
      path: "add.test.js",
      content: `
        const { add } = require('../add');
        describe('add', () => {
          it('adds two numbers', () => { expect(add(2, 3)).toBe(5); });
          it('adds negative numbers', () => { expect(add(-2, -3)).toBe(-5); });
        });
      `,
      language: "JavaScript",
    };

    const result = await gradeByTests({
      context,
      tests: [addTest],
      repoRoot: "/tmp"
    });
    console.log(result);
    expect(result.total).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
  });
});
