// db.ts
// @ts-ignore
import mongoose from 'mongoose';

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

// connection states for reference
// 0 = disconnected
// 1 = connected
// 2 = connecting
// 3 = disconnecting
mongoose.connection.on('connecting', () =>
  console.log('[db] mongoose connecting…')
);
mongoose.connection.on('connected', () =>
  console.log('[db] mongoose connected!')
);
mongoose.connection.on('error', (err) =>
  console.error('[db] mongoose connection error:', err)
);
mongoose.connection.on('disconnected', () =>
  console.log('[db] mongoose disconnected')
);

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log('[db] already connected (readyState=' + mongoose.connection.readyState + ')');
    return;
  }

  console.log('[db] calling mongoose.connect()…');
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB || 'hackthe6ix',
  });
}
