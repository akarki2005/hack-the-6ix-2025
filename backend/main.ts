import express from "express";

const app = require("./app").default;
const cors = require("cors");

// list every front-end origin that should be able to talk to the API
const allowedOrigins = [
  "http://localhost:3000", // normal local dev
  process.env.FRONTEND_URL, // e.g. https://42a3-abcd.ngrok-free.app
].filter(Boolean); // drop undefined values

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no Origin header (e.g. curl / server-to-server)
      if (!origin) return cb(null, true);
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI — set it in your environment!");
}

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};
const server = http.createServer(app);

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5000;

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
