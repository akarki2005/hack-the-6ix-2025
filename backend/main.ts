import app from "./app";
import http from "http";

// for ws
const server = http.createServer(app);

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5000;

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
