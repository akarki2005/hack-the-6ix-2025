import express, { Request, Response } from "express";
import cors from "cors";
import submitRouter from "./routers/submitRouter";
import trainRouter from "./routers/trainRouter";
import resultRouter from "./routers/resultsRouter";
import finishRouter from "./routers/finishRouter";
import userRouter from "./routers/userRouter";
import gradeRouter from "./routers/gradeRouter";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/submit", submitRouter);
app.use("/grade", gradeRouter);
app.use("/train", trainRouter);
app.use("/results", resultRouter);
app.use("/finish", finishRouter);
app.use("/api/user", userRouter);

// Add GitHub repo creation endpoint
app.post("/api/assign-repos", async (req: Request, res: Response) => {
  console.log(
    "POST /api/assign-repos received:",
    JSON.stringify(req.body, null, 2)
  );

  const {
    token,
    templateOwner,
    templateRepo,
    baseRepoName,
    yourUsername,
    studentList,
  } = req.body;

  if (
    !token ||
    !templateOwner ||
    !templateRepo ||
    !baseRepoName ||
    !yourUsername ||
    !studentList
  ) {
    console.log("Missing required fields:", {
      hasToken: !!token,
      hasTemplateOwner: !!templateOwner,
      hasTemplateRepo: !!templateRepo,
      hasBaseRepoName: !!baseRepoName,
      hasYourUsername: !!yourUsername,
      hasStudentList: !!studentList,
    });
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    console.log("Attempting to import github_utils...");
    // Import the function dynamically to avoid path issues
    const {
      createReposFromTemplate,
    } = require("../frontend/pages/api/github_utils");
    console.log("Successfully imported github_utils");

    console.log("Calling createReposFromTemplate with:", {
      token: token ? "[REDACTED]" : "null",
      templateOwner,
      templateRepo,
      baseRepoName,
      yourUsername,
      studentListLength: studentList.length,
    });

    const links = await createReposFromTemplate(
      token,
      templateOwner,
      templateRepo,
      baseRepoName,
      yourUsername,
      studentList
    );

    console.log("createReposFromTemplate returned:", links);
    res.status(200).json({ message: "Repos created", links });
  } catch (error) {
    console.error("Error in repo creation:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export default app;
