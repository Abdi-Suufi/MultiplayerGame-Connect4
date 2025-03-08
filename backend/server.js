const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let games = {}; // Store active games

wss.on("connection", (ws) => {
    console.log("A player connected");

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "create") {
            const gameId = Math.random().toString(36).substring(2, 8);
            games[gameId] = { players: [ws], board: Array(6).fill().map(() => Array(7).fill(0)) };
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
                game.players.forEach(player => player.send(JSON.stringify(data)));
            }
        }
    });

    ws.on("close", () => console.log("A player disconnected"));
});

app.get("/", (req, res) => res.send("Connect 4 Backend Running!"));

server.listen(3000, () => console.log("Server running on port 3000"));