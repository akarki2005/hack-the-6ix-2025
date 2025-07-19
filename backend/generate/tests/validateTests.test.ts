import validateTests from "../validateTests";
import { RepoFile } from "../../schemas/analysis";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("validateTests", () => {
  const mockTestFiles: RepoFile[] = [
    {
      path: "foo.test.js",
      content: `describe('foo', () => { it('works', () => { expect(1).toBe(1); }); });`,
      language: "JavaScript",
    },
    {
      path: "bar.test.js",
      content: `describe('bar', () => { it('fails', () => { expect(1).not.toBe(2); }); });`,
      language: "JavaScript",
    },
  ];

  it("should run tests in a provided testDir (files already written)", async () => {
    // Create a temp dir and write test files
    const testDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "validate-tests-dir-")
    );
    for (const file of mockTestFiles) {
      const outPath = path.join(testDir, file.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, file.content, "utf8");
    }
    // Call validateTests with testDir
    const result = await validateTests({ testFiles: mockTestFiles, testDir });
    console.log("result", result);
    expect(result.result.total).toBe(2);
    expect(result.result.passed + result.result.failed).toBe(2);
    expect(
      Array.isArray(result.result.failedTests) ||
        result.result.failedTests === undefined
    ).toBe(true);
    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("should write and run tests if testDir is not provided", async () => {
    const result = await validateTests({ testFiles: mockTestFiles });
    expect(result.result.total).toBe(2);
    expect(result.result.passed + result.result.failed).toBe(2);
    expect(
      Array.isArray(result.result.failedTests) ||
        result.result.failedTests === undefined
    ).toBe(true);
  });
});
