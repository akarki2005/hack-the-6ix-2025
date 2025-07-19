import app from "./app";
import http from "http";

// for ws
const server = http.createServer(app);

const PORT = 3000;

server.listen(PORT, () => {
  console.log("api running on http://localhost:3000");
});
