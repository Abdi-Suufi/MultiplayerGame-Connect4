const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");

const app = express();

// Use environment port or fallback to 3000
const PORT = process.env.PORT || 3000;

// Configure CORS for production
// Replace 'https://yourdomain.com' with your actual frontend URL when you have it
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5500' 
    : '*'
}));

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active games
let games = {}; 

// Ping-pong to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

wss.on("connection", (ws) => {
  console.log("A player connected");
  ws.isAlive = true;
  
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "create") {
        const gameId = Math.random().toString(36).substring(2, 8);
        games[gameId] = { 
          players: [ws], 
          board: Array(6).fill().map(() => Array(7).fill(0)),
          createdAt: Date.now()
        };
        ws.send(JSON.stringify({ type: "gameCreated", gameId }));
        console.log(`Game ${gameId} created`);
      }

      if (data.type === "join") {
        if (games[data.gameId] && games[data.gameId].players.length < 2) {
          games[data.gameId].players.push(ws);
          games[data.gameId].players.forEach(player =>
            player.send(JSON.stringify({ type: "start", gameId: data.gameId }))
          );
          console.log(`Player joined game ${data.gameId}`);
        } else {
          ws.send(JSON.stringify({ type: "error", message: "Game not found or full" }));
        }
      }

      if (data.type === "move") {
        const game = games[data.gameId];
        if (game) {
          game.board[data.row][data.col] = data.player;
          game.players.forEach(player => 
            player.send(JSON.stringify(data))
          );
        }
      }
      
      if (data.type === "reset") {
        const game = games[data.gameId];
        if (game) {
          game.board = Array(6).fill().map(() => Array(7).fill(0));
          game.players.forEach(player => 
            player.send(JSON.stringify({ type: "reset", gameId: data.gameId }))
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("A player disconnected");
    // Clean up games when players disconnect
    for (const gameId in games) {
      games[gameId].players = games[gameId].players.filter(player => player !== ws);
      if (games[gameId].players.length === 0) {
        delete games[gameId];
        console.log(`Game ${gameId} removed due to player disconnection`);
      } else {
        // Notify remaining player that opponent disconnected
        games[gameId].players.forEach(player =>
          player.send(JSON.stringify({ type: "playerDisconnected", gameId }))
        );
      }
    }
  });
});

// Clean up stale games periodically (24 hours)
setInterval(() => {
  const now = Date.now();
  for (const gameId in games) {
    if (now - games[gameId].createdAt > 24 * 60 * 60 * 1000) {
      delete games[gameId];
      console.log(`Game ${gameId} removed due to inactivity`);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));