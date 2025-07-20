import express from "express";
import { ZodError } from "zod";
import {
  SubmitRequestData,
  SubmitRequestSchema,
  SubmitResponseData,
} from "../schemas/submit";
import Assessment from "../db/models/assessment";
import User from "../db/models/user";

const submitRouter = express.Router();

submitRouter.get("/", async (req, res) => {
  try {
    const { auth0Id } = req.query;
    if (!auth0Id || typeof auth0Id !== "string") {
      return res.status(400).json({ error: "Missing or invalid auth0Id" });
    }
    const user = await User.findOne({ auth0Id }).populate("assessments");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ assessments: user.assessments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

submitRouter.post("/", async (req, res) => {
  try {
    const data: SubmitRequestData = SubmitRequestSchema.parse(req.body);

    // Find or create user
    let user = await User.findOne({ auth0Id: data.auth0Id });
    if (!user) {
      user = await User.create({
        auth0Id: data.auth0Id,
        name: data.userName,
        email: data.userEmail,
      });
    }

    // Create assessment
    const assessment = await Assessment.create({
      repoOwner: data.repoOwner,
      repoName: data.repoName,
      candidates: data.candidates,
      criteria: data.criteria,
      user: user._id,
      createdAt: new Date(),
    });

    // Link assessment to user
    user.assessments.push(assessment._id);
    await user.save();

    const result: SubmitResponseData = { ok: true, assessmentId: assessment._id };
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid input", issues: error.message });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown server error" });
    }
  }
});

export default submitRouter;
