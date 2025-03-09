// Game constants
export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 0;
export const PLAYER1 = 1;
export const PLAYER2 = 2;

// Server URL - change to your Express server URL
const SERVER_URL = "wss://multiplayergame-connect4.onrender.com";

class GameService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.isHost = false;
    this.myPlayer = PLAYER1;
    this.callbacks = {
      onGameCreated: () => {},
      onGameJoined: () => {},
      onGameStarted: () => {},
      onMove: () => {},
      onError: () => {},
      onConnectionChange: () => {},
      onReset: () => {},
    };
  }

  // Connect to WebSocket server
  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log("WebSocket already connected");
      return;
  }

  this.socket = new WebSocket(SERVER_URL);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.callbacks.onConnectionChange(true, 'Connected to server');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      this.handleMessage(data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.callbacks.onConnectionChange(false, 'Disconnected from server. Trying to reconnect...');
      // Try to reconnect after a delay
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onConnectionChange(false, 'Connection error. Please try again.');
    };
  }

  // Handle incoming WebSocket messages
  handleMessage(data) {
    switch (data.type) {
      case 'gameCreated':
        this.gameId = data.gameId;
        this.callbacks.onGameCreated(data.gameId);
        break;

      case 'start':
        this.callbacks.onGameStarted();
        break;

      case 'move':
        this.callbacks.onMove(data);
        break;

      case 'error':
        this.callbacks.onError(data.message);
        break;

      case 'reset':
        this.callbacks.onReset();
        break;

      default:
        console.log('Unhandled message type:', data.type);
    }
  }

  // Register callbacks for different events
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Send message to the server
  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('Socket not connected');
      this.callbacks.onError('Not connected to server');
    }
  }

  // Create a new game
  createGame() {
    this.isHost = true;
    this.myPlayer = PLAYER1;
    
    this.sendMessage({
      type: 'create'
    });
  }

  // Join an existing game
  joinGame(gameCode) {
    this.isHost = false;
    this.myPlayer = PLAYER2;
    
    // Extract game ID from full link or use code directly
    if (gameCode.includes('?game=')) {
      this.gameId = gameCode.split('?game=')[1];
    } else {
      this.gameId = gameCode;
    }

    this.sendMessage({
      type: 'join',
      gameId: this.gameId
    });
  }

  // Make a move
  makeMove(row, col, player) {
    this.sendMessage({
      type: 'move',
      row,
      col,
      player,
      gameId: this.gameId
    });
  }

  // Reset the game
  resetGame() {
    this.sendMessage({
      type: 'reset',
      gameId: this.gameId
    });
  }

  // Close the connection
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const gameService = new GameService();
export default gameService;