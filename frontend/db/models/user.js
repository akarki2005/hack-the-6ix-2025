import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: String,
  email: String,
  assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }]
});

export default mongoose.models.User || mongoose.model('User', userSchema);
