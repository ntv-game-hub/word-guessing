import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { DIST_DIR, HOST, PORT } from "./config.js";
import { registerSocketHandlers } from "./socketHandlers.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ["websocket"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

app.use(express.static(DIST_DIR));
app.get("*", (_req, res) => {
  res.sendFile(`${DIST_DIR}/index.html`);
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Word Guessing Game listening at http://${HOST}:${PORT}`);
});
