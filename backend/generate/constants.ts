export const codingFileExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".rb",
  ".go",
  ".rs",
  ".php",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".xml",
  ".yml",
  ".yaml",
  ".sh",
  ".bat",
  ".sql",
  ".md",
  ".dockerfile",
  ".makefile",
  ".toml",
]);

export const gitIgnoredPaths = new Set([
  "node_modules/",
  ".next/",
  ".nuxt/",
  ".cache/",
  "dist/",
  "build/",
  "coverage/",
  ".env",
  ".env.local",
  ".DS_Store",
  "npm-debug.log",
  "yarn-error.log",
  "yarn.lock",
  "package-lock.json",
  ".vscode/",
  ".idea/",
  "*.log",
  "*.tmp",
  "*.temp",
  "__pycache__/",
  "*.pyc",
  "*.pyo",
  ".pytest_cache/",
  "*.sublime-project",
  "*.sublime-workspace",
  "Thumbs.db",
  "logs/",
  "temp/",
  "tmp/",
]);

export const commonFrameworks = new Set([
  "express",
  "next",
  "react",
  "vue",
  "nuxt",
  "angular",
  "svelte",
  "gatsby",
  "remix",
  "astro",
  "solid-js",
  "nestjs",
  "fastify",
]);

export const commonTestFrameworks = new Set([
  "jest",
  "mocha",
  "vitest",
  "ava",
  "jasmine",
  "cypress",
  "playwright",
  "testing-library",
  "tap",
]);

export const commonTooling = new Set([
  "eslint",
  "prettier",
  "typescript",
  "webpack",
  "babel",
  "rollup",
  "parcel",
  "swc",
  "ts-node",
  "nodemon",
  "husky",
  "lint-staged",
]);
