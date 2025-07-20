import validateTests from "../validateTests";
import { RepoFile } from "../../schemas/analysis";
import * as fs from "fs";
import * as path from "path";

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
  const testDir = path.resolve("./repo/tests");

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
    for (const file of mockTestFiles) {
      const outPath = path.join(testDir, file.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, file.content, "utf8");
    }
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("should run tests in a provided testDir (files already written)", async () => {
    // Call validateTests with testDir
    const result = await validateTests({ testFiles: mockTestFiles, testDir });
    console.log("result", result);
    expect(result.result.total).toBe(2);
    expect(result.result.passed + result.result.failed).toBe(2);
    expect(
      Array.isArray(result.result.failedTests) ||
        result.result.failedTests === undefined
    ).toBe(true);
  });
});
