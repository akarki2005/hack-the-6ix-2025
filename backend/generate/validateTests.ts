import { runCLI } from "jest";
import * as fs from "fs";
import * as path from "path";
import type {
  RepoFile,
  TestResults as SchemaTestResult,
} from "../schemas/analysis";
import type {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from "@jest/test-result";
import { execSync } from "child_process";

interface ValidateTestsInput {
  testFiles: RepoFile[];
  testDir: string;
  repoRoot?: string; // Path to original repo for copying dependencies
}

interface ValidateTestsOutput {
  result: SchemaTestResult;
}

// Helper function to detect project file types
function detectProjectFileTypes(
  testFiles: RepoFile[],
  repoRoot?: string
): {
  hasTypeScript: boolean;
  hasJSX: boolean;
  hasReact: boolean;
  testExtensions: string[];
} {
  let hasTypeScript = false;
  let hasJSX = false;
  let hasReact = false;
  const testExtensions = new Set<string>();

  // Check test files
  testFiles.forEach((file) => {
    const ext = path.extname(file.path);
    testExtensions.add(ext.substring(1)); // Remove the dot

    if (file.content.includes("React") || file.content.includes("jsx")) {
      hasJSX = true;
      hasReact = true;
    }

    if (
      ext === ".ts" ||
      ext === ".tsx" ||
      file.content.includes(": ") ||
      file.content.includes("interface ")
    ) {
      hasTypeScript = true;
    }
  });

  // Check original repo if available
  if (repoRoot && fs.existsSync(repoRoot)) {
    try {
      const packageJsonPath = path.join(repoRoot, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        if (allDeps.react || allDeps["@types/react"]) hasReact = true;
        if (allDeps.typescript || allDeps["ts-jest"]) hasTypeScript = true;
      }
    } catch (e) {
      console.warn("[validateTests] Could not read repo package.json:", e);
    }
  }

  return {
    hasTypeScript,
    hasJSX,
    hasReact,
    testExtensions: Array.from(testExtensions),
  };
}

// Helper function to copy repo dependencies and configs
function copyRepoConfig(repoRoot: string, testDir: string) {
  const filesToCopy = [
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "tsconfig.json",
    "jsconfig.json",
    ".babelrc",
    "babel.config.js",
    "babel.config.json",
  ];

  filesToCopy.forEach((fileName) => {
    const srcPath = path.join(repoRoot, fileName);
    const destPath = path.join(testDir, fileName);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[validateTests] Copied ${fileName}`);
    }
  });
}

// Helper function to create dynamic Jest configuration
function createJestConfig(
  projectInfo: ReturnType<typeof detectProjectFileTypes>
): string {
  const { testExtensions, hasReact } = projectInfo;

  // Build test patterns based on detected extensions (but always allow every flavour)
  const testPatterns = testExtensions.length
    ? testExtensions.flatMap((ext) => [`**/*.test.${ext}`, `**/*.spec.${ext}`])
    : ["**/*.test.[jt]s?(x)", "**/*.spec.[jt]s?(x)"];

  // One transformer – babel-jest – compiles JS, JSX, TS, TSX in one go.
  const transform = {
    "^.+\\.[jt]sx?$": "babel-jest",
  } as Record<string, string>;

  const config: any = {
    testEnvironment: hasReact ? "jsdom" : "node",
    testMatch: testPatterns,
    transform,
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.test.{js,jsx,ts,tsx}",
      "!src/**/*.spec.{js,jsx,ts,tsx}",
    ],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/../src/$1",
      // Ensure all modules (including testing libraries) use the same React instance
      "^react$": "<rootDir>/../../node_modules/react",
      "^react-dom$": "<rootDir>/../../node_modules/react-dom",
    },
    // Look in the parent node_modules first to prevent duplicate installs
    moduleDirectories: [
      "node_modules",
      "../node_modules",
      "../../node_modules",
    ],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  };

  return `module.exports = ${JSON.stringify(config, null, 2)};`;
}

// Helper function to create setup files
function createSetupFiles(testDir: string, hasReact: boolean) {
  if (hasReact) {
    const setupContent = `// Jest setup file
import '@testing-library/jest-dom';

// —— GLOBAL NEXT.JS MOCKS ——

// next/router mock
jest.mock('next/router', () => {
  const push = jest.fn();
  const mockRouter = {
    push,
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    prefetch: jest.fn().mockResolvedValue(undefined),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };
  return { useRouter: jest.fn(() => mockRouter) };
});

// Expose useRouter globally for legacy tests that reference it without import
global.useRouter = require('next/router').useRouter;

// next/link mock – renders a plain <a>
jest.mock('next/link', () => {
  return ({ children, href }) => <a href={typeof href === 'string' ? href : ''}>{children}</a>;
});

// next/image mock – render standard img
jest.mock('next/image', () => {
  /* eslint-disable jsx-a11y/alt-text */
  return (props) => <img {...props} />;
});

// —— ENVIRONMENT SHIMS ——

// localStorage shim for jsdom
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => (store[k] = String(v)),
      removeItem: (k) => delete store[k],
      clear: () => (store = {}),
    };
  })(),
});

// fetch stub
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  );
}

// silence noisy console logs
global.console = { ...console, debug: jest.fn(), info: jest.fn() };
`;
    fs.writeFileSync(path.join(testDir, "jest.setup.js"), setupContent, "utf8");
  }

  // Create a basic babel config for JSX if needed
  if (hasReact) {
    const babelConfig = {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    };
    fs.writeFileSync(
      path.join(testDir, "babel.config.js"),
      `module.exports = ${JSON.stringify(babelConfig, null, 2)};`,
      "utf8"
    );

    // Create tsconfig.json for TypeScript + JSX if not already present
    const tsconfigPath = path.join(testDir, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
      const tsconfig = {
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
        },
        include: ["**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      };
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");
    }
  }
}

async function runJestAndParse(testDir: string): Promise<SchemaTestResult> {
  try {
    const { results } = (await runCLI(
      {
        _: [],
        $0: "jest",
        rootDir: testDir,
        runInBand: true,
        json: true,
        noStackTrace: true,
        silent: true,
        testMatch: ["**/*.test.[jt]s?(x)"],
      },
      [testDir]
    )) as { results: AggregatedResult };

    // Use Jest's built‑in totals
    const total = results.numTotalTests;
    const passed = results.numPassedTests;
    const failed = results.numFailedTests;

    // Flatten out any failed assertions
    const failedTests = results.testResults
      .flatMap((suite: TestResult) => suite.testResults as AssertionResult[])
      .filter((assertion) => assertion.status === "failed")
      .map((assertion) => ({
        name: assertion.title,
        message: assertion.failureMessages.join("\n"),
      }));

    return {
      total,
      passed,
      failed,
      failedTests: failedTests.length ? failedTests : [],
    };
  } catch (e: any) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      failedTests: [{ name: "Jest runCLI error", message: e.message }],
    };
  }
}

export default async function validateTests(
  props: ValidateTestsInput
): Promise<ValidateTestsOutput> {
  const { testFiles, repoRoot } = props;

  if (!fs.existsSync(props.testDir!)) {
    fs.mkdirSync(props.testDir!, { recursive: true });
  }

  console.log("[validateTests] Writing test files to:", props.testDir!);

  // Write test files to disk
  for (const file of testFiles) {
    const outPath = path.join(props.testDir!, file.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, file.content, "utf8");
    console.log(
      "[validateTests] Wrote file:",
      outPath,
      "Exists:",
      fs.existsSync(outPath)
    );
  }

  // Detect project characteristics
  const projectInfo = detectProjectFileTypes(testFiles, repoRoot);
  console.log("[validateTests] Detected project info:", projectInfo);

  // Copy original repo config and dependencies if available
  if (repoRoot && fs.existsSync(repoRoot)) {
    copyRepoConfig(repoRoot, props.testDir!);
  }

  // Create dynamic Jest configuration
  const jestConfig = createJestConfig(projectInfo);
  fs.writeFileSync(
    path.join(props.testDir!, "jest.config.js"),
    jestConfig,
    "utf8"
  );
  console.log("[validateTests] Created Jest config");

  // Create setup files
  createSetupFiles(props.testDir!, projectInfo.hasReact);

  try {
    const files = fs.readdirSync(props.testDir!);
    console.log("[validateTests] Directory contents:", files);
  } catch (e) {
    console.log("[validateTests] Could not read directory contents:", e);
  }

  // Remove any nested node_modules to ensure single dependency tree
  const localNodeModules = path.join(props.testDir!, "node_modules");
  if (fs.existsSync(localNodeModules)) {
    try {
      fs.rmSync(localNodeModules, { recursive: true, force: true });
      console.log(
        "[validateTests] Removed nested node_modules to avoid duplicates"
      );
    } catch (e) {
      console.warn("[validateTests] Failed to remove nested node_modules:", e);
    }
  }

  // Run Jest

  const result = await runJestAndParse(props.testDir!);
  return { result };
}
