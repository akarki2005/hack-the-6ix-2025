import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  repoOwner: String,
  repoName: String,
  candidates: [{ name: String, githubUsername: String }],
  criteria: [{ name: String, description: String, weight: Number }],
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);