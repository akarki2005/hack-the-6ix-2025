import express from "express";

const app = require("./app").default;
const cors = require("cors");

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
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
