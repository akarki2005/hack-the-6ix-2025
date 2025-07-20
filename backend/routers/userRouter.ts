import express from "express";
import User from "../db/models/user";
import Assessment from "../db/models/assessment";
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
    console.log("ERROR: Missing auth0Id");
    return res.status(400).json({ error: "Missing auth0Id" });
  }
  
  try {
    // First, let's see what users exist in the database
    const allUsers = await User.find({}, 'auth0Id name email');
    console.log("All users in database:", allUsers);
    console.log("Looking for user with auth0Id:", auth0Id);
    
    const user = await User.findOne({ auth0Id }).populate('assessments');
    if (!user) {
      console.log("ERROR: User not found for auth0Id:", auth0Id);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found:", user.name, "Number of assessments:", user.assessments.length);
    console.log("Assessments data:", JSON.stringify(user.assessments, null, 2));
    res.status(200).json({ assessments: user.assessments });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Create a new assessment and append to user's assessments
userRouter.post("/assessments", async (req, res) => {
  console.log("POST /api/user/assessments - Request body:", JSON.stringify(req.body, null, 2));
  await connectDB();
  const { auth0Id, repo, candidates, criteria } = req.body;
  console.log("Extracted values:", { auth0Id, repo, candidates, criteria });
  
  if (!auth0Id || !repo || !candidates || !criteria) {
    console.log("Missing required fields:", { 
      hasAuth0Id: !!auth0Id, 
      hasRepo: !!repo, 
      hasCandidates: !!candidates, 
      hasCriteria: !!criteria 
    });
    return res.status(400).json({ error: "Missing assessment info" });
  }
  
  const user = await User.findOne({ auth0Id });
  if (!user) {
    console.log("User not found for auth0Id:", auth0Id);
    return res.status(404).json({ error: "User not found" });
  }
  
  // Create the assessment in the Assessment collection
  const assessmentDoc = await Assessment.create({
    repoOwner: repo.owner,
    repoName: repo.name,
    candidates,
    criteria,
    createdAt: new Date(),
    user: user._id
  });
  // Push the ObjectId to user.assessments
  user.assessments.push(assessmentDoc._id);
  await user.save();
  console.log("Assessment created successfully:", assessmentDoc);
  res.status(201).json({ ok: true, assessment: assessmentDoc });
});

export default userRouter;
