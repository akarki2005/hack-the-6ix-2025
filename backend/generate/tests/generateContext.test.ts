import generateContext from "../generateContext";
import * as utils from "../utils";
import * as fs from "fs";
import * as path from "path";
import { DiffFile } from "../../schemas/analysis";

jest.mock("fs");
jest.mock("../utils");

const mockFiles = {
  "/repo/file1.ts": 'import x from "./file2";\nconsole.log("file1");',
  "/repo/file2.ts": 'console.log("file2");',
  "/repo/endpoint.ts": 'router.get("/api/test", (req, res) => {});',
  "/repo/package.json": JSON.stringify({
    dependencies: { express: "^4.0.0", lodash: "^4.17.21" },
    devDependencies: { jest: "^29.0.0", typescript: "^4.0.0" },
  }),
};

const mockWalkFiles = jest.fn(() => [
  "/repo/file1.ts",
  "/repo/file2.ts",
  "/repo/endpoint.ts",
  "/repo/package.json",
]);

const mockReadJSON = jest.fn((filePath) => {
  if (filePath.endsWith("package.json")) {
    return JSON.parse(mockFiles["/repo/package.json"]);
  }
  return null;
});

const getMockFile = (filePath: string) => {
  // Remove Windows drive letter and normalize slashes
  let normalized = filePath.replace(/^([a-zA-Z]:)/, "");
  normalized = normalized.replace(/\\/g, "/");
  return mockFiles[filePath] || mockFiles[normalized];
};

beforeAll(() => {
  (utils.walkFiles as jest.Mock).mockImplementation(mockWalkFiles);
  (utils.readJSON as jest.Mock).mockImplementation(mockReadJSON);
  (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
    const file = getMockFile(filePath);
    if (file) return file;
    throw new Error("File not found: " + filePath);
  });
  (fs.existsSync as jest.Mock).mockImplementation(
    (filePath) => !!getMockFile(filePath)
  );
});

afterAll(() => {
  jest.resetAllMocks();
});

describe("generateContext", () => {
  it("should generate context and tech stack from diffFiles", () => {
    const diffFiles: DiffFile[] = [
      { path: "file1.ts", status: "modified", additions: 1, deletions: 0 },
      { path: "file2.ts", status: "added", additions: 1, deletions: 0 },
    ];
    const repoRoot = "/repo";
    const result = generateContext({ diffFiles, repoRoot });
    // Check diffFiles
    expect(result.diffFiles).toEqual(diffFiles);
    // Check relatedFiles contains the expected files
    const relatedPaths = result.relatedFiles.map((f) => f.path);
    expect(relatedPaths).toContain("file1.ts");
    expect(relatedPaths).toContain("file2.ts");
    // Check relatedFiles content
    const file1 = result.relatedFiles.find((f) => f.path === "file1.ts");
    expect(file1?.content).toContain("console.log");
    // Check techStack
    expect(result.techStack.languages).toContain("TypeScript");
    expect(result.techStack.frameworks).toContain("express");
    expect(result.techStack.libraries).toContain("lodash");
    expect(result.techStack.tooling).toContain("typescript");
    expect(result.techStack.testFrameworks).toContain("jest");
  });

  it("should handle empty diffFiles", () => {
    const result = generateContext({ diffFiles: [], repoRoot: "/repo" });
    expect(Array.isArray(result.relatedFiles)).toBe(true);
    expect(result.techStack.languages.length).toBeGreaterThan(0);
  });

  it("should not fail if package.json is missing", () => {
    (utils.readJSON as jest.Mock).mockImplementationOnce(() => null);
    const diffFiles: DiffFile[] = [
      { path: "file1.ts", status: "modified", additions: 1, deletions: 0 },
    ];
    const repoRoot = "/repo";
    const result = generateContext({ diffFiles, repoRoot });
    expect(result.techStack.frameworks).toEqual([]);
  });
});
