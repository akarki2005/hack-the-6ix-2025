import express from "express";
import User from "../db/models/user";
import { connectDB } from "../main";

const userRouter = express.Router();

userRouter.post("/signup", async (req, res) => {
  await connectDB();
  const { auth0Id, name, email } = req.body;
  if (!auth0Id || !name || !email) {
    return res.status(400).json({ error: "Missing user info" });
  }
  let user = await User.findOne({ auth0Id });
  if (!user) {
    user = await User.create({ auth0Id, name, email });
  } else {
    return res.status(409).json({ error: "User already exists" });
  }
  res.status(201).json({ ok: true, user });
})

userRouter.post("/login", async (req, res) => {
  await connectDB();
  const { auth0Id, name, email } = req.body;
  if (!auth0Id || !name || !email) {
    return res.status(400).json({ error: "Missing user info" });
  }
  let user = await User.findOne({ auth0Id });
  if (!user) {
    user = await User.create({ auth0Id, name, email });
  }
  res.status(200).json({ ok: true, user });
});

userRouter.get("/assessments", async (req, res) => {
  await connectDB();
  console.log("GET /api/user/assessments", req.query);
  const { auth0Id } = req.query;
  if (!auth0Id) {
    return res.status(400).json({ error: "Missing auth0Id" });
  }
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.status(200).json({ assessments: user.assessments });
});

// Create a new assessment and append to user's assessments
userRouter.post("/assessments", async (req, res) => {
  await connectDB();
  const { auth0Id, repo, candidates, criteria } = req.body;
  if (!auth0Id || !repo || !candidates || !criteria) {
    return res.status(400).json({ error: "Missing assessment info" });
  }
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const newAssessment = { repo, candidates, criteria, createdAt: new Date() };
  user.assessments.push(newAssessment);
  await user.save();
  res.status(201).json({ ok: true, assessment: newAssessment });
});

export default userRouter;
