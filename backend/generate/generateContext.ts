import { DiffFile, RepoFile, TechStack } from "../schemas/analysis";
import {
  codingFileExtensions,
  commonFrameworks,
  commonTestFrameworks,
  commonTooling,
  gitIgnoredPaths,
} from "./constants";
import { readJSON, walkFiles } from "./utils";
import * as fs from "fs";
import * as path from "path";

interface GenerateContextInput {
  diffFiles: DiffFile[]; // from GitHub /compare or /pulls/:num/files
  repoRoot: string; // local clone path
  maxRelatedFiles?: number; // cap (e.g. 20)
  relatedHops?: number; // import graph depth (default 1)
}

interface GenerateContextOutput {
  diffFiles: DiffFile[];
  relatedFiles: RepoFile[];
  techStack: TechStack;
}

export default function generateContext(
  props: GenerateContextInput
): GenerateContextOutput {
  const { diffFiles, repoRoot, maxRelatedFiles = 20, relatedHops = 1 } = props;

  // 1. Edited file paths (existing in head)
  const edited = new Set<string>();
  diffFiles.forEach((f) => {
    if (f.status !== "removed") {
      const abs = path.resolve(repoRoot, f.path);
      if (fs.existsSync(abs)) {
        edited.add(abs);
      } else {
        // Try to find the same file with a different JS/TS/JSX/TSX extension
        const { dir, name } = path.parse(abs);
        const candidate = [".js", ".jsx", ".ts", ".tsx"].map((ext) =>
          path.join(dir, name + ext)
        ).find((p) => fs.existsSync(p));
        if (candidate) {
          edited.add(candidate);
        }
      }
    }
  });

  // 2. Build file graph
  const codeExts = codingFileExtensions;
  const allFiles = walkFiles(repoRoot, codeExts, gitIgnoredPaths);

  // Map: file -> imports[]
  const importMap = new Map<string, string[]>();
  // Reverse map: file -> importedBy[]
  const reverseMap = new Map<string, string[]>();

  // Regex for imports: import ... from 'x'; or require('x')
  const importRegex =
    /(?:import\s.*?from\s+['"](.*?)['"])|(?:require\(['"](.*?)['"]\))/g;

  allFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const imports: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(content))) {
      const spec = m[1] || m[2];
      // only relative
      if (spec.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), spec);
        // try append exts
        for (const ext of codeExts) {
          const full = resolved + ext;
          if (fs.existsSync(full)) {
            imports.push(full);
            break;
          }
        }
      }
    }
    importMap.set(file, imports);
    imports.forEach((imp) => {
      reverseMap.set(imp, (reverseMap.get(imp) || []).concat(file));
    });
  });

  // 3. BFS to collect related files
  const related = new Set<string>(edited);
  let frontier = Array.from(edited);
  for (let hop = 0; hop < relatedHops; hop++) {
    const next: string[] = [];
    frontier.forEach((file) => {
      const neighbors = (importMap.get(file) || []).concat(
        reverseMap.get(file) || []
      );
      neighbors.forEach((nf) => {
        if (!related.has(nf)) {
          related.add(nf);
          next.push(nf);
        }
      });
    });
    frontier = next;
    if (related.size >= maxRelatedFiles) break;
  }

  // Trim to cap
  const relatedFilesAbs = Array.from(related).slice(0, maxRelatedFiles);

  // 4. Detect simple endpoint files (express router)
  const endpointPattern =
    /\b(?:router|app)\.(get|post|put|delete|patch)\(['"](\/api\/[\w/-]+)['"]/g;
  const endpoints = new Set<string>();
  allFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    if (endpointPattern.test(content)) endpoints.add(file);
  });
  // If any edited file is frontend (calls fetch/axios), include endpoints
  const callPattern = /\b(?:fetch|axios\.\w+)\(['"](\/api\/[\w/-]+)/g;
  let callMatches: RegExpExecArray | null;
  diffFiles.forEach((df) => {
    const abs = path.resolve(repoRoot, df.path);
    if (fs.existsSync(abs)) {
      const txt = fs.readFileSync(abs, "utf8");
      while ((callMatches = callPattern.exec(txt))) {
        // include all endpoint files
        endpoints.forEach((ep) => related.add(ep));
      }
    }
  });

  // 5. Build relatedFiles as RepoFile[]
  const relatedFiles: RepoFile[] = relatedFilesAbs.map((filePath) => {
    // Ensure path exists; try alternate extensions first
    let actualPath = filePath;
    if (!fs.existsSync(actualPath)) {
      const { dir, name } = path.parse(actualPath);
      const alt = [".js", ".jsx", ".ts", ".tsx"].map((ext) =>
        path.join(dir, name + ext)
      ).find((p) => fs.existsSync(p));
      if (alt) actualPath = alt;
    }

    const raw = path.relative(repoRoot, actualPath);
    const normalized = raw.split(path.sep).join("/");

    return {
      path: normalized,
      content: fs.readFileSync(actualPath, "utf8"),
    };
  });

  // 6. Infer tech stack from package.json
  const pkg = readJSON(path.join(repoRoot, "package.json")) || {};
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  const techStack: TechStack = {
    languages: [],
    frameworks: [],
    libraries: [],
    testFrameworks: [],
    tooling: [],
  };
  // Languages by file extensions
  const langs = new Set<string>();
  allFiles.forEach((f) =>
    langs.add(path.extname(f) === ".ts" ? "TypeScript" : "JavaScript")
  );
  techStack.languages = Array.from(langs);
  // Frameworks & libraries
  commonFrameworks.forEach((fw) => {
    if (deps.includes(fw) || devDeps.includes(fw))
      techStack.frameworks.push(fw);
  });
  // Test frameworks
  commonTestFrameworks.forEach((tf) => {
    if (deps.includes(tf) || devDeps.includes(tf))
      techStack.testFrameworks.push(tf);
  });
  // Tooling
  commonTooling.forEach((tool) => {
    if (deps.includes(tool) || devDeps.includes(tool))
      techStack.tooling.push(tool);
  });
  // Other libraries = deps minus known frameworks + tooling + tests
  techStack.libraries = deps.filter(
    (d) =>
      !techStack.frameworks.includes(d) &&
      !techStack.testFrameworks.includes(d) &&
      !techStack.tooling.includes(d)
  );

  // Write senior context to criteria/seniorContext.json in repo root
  const seniorContext = { diffFiles, relatedFiles, techStack };
  try {
    // Always write to <projectRoot>/criteria regardless of repoRoot value
    const criteriaDir = path.resolve(process.cwd(), "criteria");
    if (!fs.existsSync(criteriaDir)) {
      fs.mkdirSync(criteriaDir, { recursive: true });
    }
    const outputPath = path.join(criteriaDir, "seniorContext.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(seniorContext, null, 2),
      "utf8"
    );
  } catch (err) {
    console.error("Failed to write seniorContext.json:", err);
  }

  return seniorContext;
}
