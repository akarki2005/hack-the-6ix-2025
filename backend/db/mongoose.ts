// @ts-ignore
import mongoose from 'mongoose';

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB || 'hackthe6ix',
  });
} 