// test‑conn.js
require('dotenv').config();         // loads .env into process.env
const { connectDB } = require('./mongoose');

(async () => {
  try {
    await connectDB();
    // readyState 1 means “connected”
    console.log('✅ Connected! readyState =', require('mongoose').connection.readyState);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  } finally {
    // close so the script actually exits
    require('mongoose').connection.close();
  }
})();
