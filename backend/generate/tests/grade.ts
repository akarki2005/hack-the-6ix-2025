// This script invokes gradeByAll and prints the resulting grade report.
// Usage (from repo root):
//   npx ts-node backend/generate/tests/grade.ts <github_pr_url>
// If no PR URL is provided, a placeholder public PR is used.

import { gradeByAll } from "../gradeByAll";
import { queryData } from "../../schemas/query";

async function main() {
  // A minimal set of sample criteria to be evaluated. Adjust as needed.
  const queries: queryData[] = [
    {
      criteria_label: "Code Quality",
      definition: "Code should be clean, readable, and follow best practices.",
      importance: 5,
    },
  ];

  const studentPR =
    process.argv[2] ||
    "https://github.com/akarki2005/hack-the-6ix-2025-tests/pull/2"; // fallback example PR

  try {
    const { gradeReport } = await gradeByAll({
      queries,
      student_github_link: studentPR,
      github_token: process.env.GITHUB_TOKEN,
    });

    console.log("Grade report:\n", JSON.stringify(gradeReport, null, 2));
  } catch (err) {
    console.error("Failed to grade PR:", err);
  }
}

// Execute if called directly via `ts-node` or `node` (after compilation)
if (require.main === module) {
  void main();
}
