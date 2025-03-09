import React, { useState, useEffect } from 'react';
import WelcomeSection from './components/WelcomeSection';
import InviteSection from './components/InviteSection';
import JoinSection from './components/JoinSection';
import WaitingScreen from './components/WaitingScreen';
import GameSection from './components/GameSection';
import GameOverModal from './components/GameOverModal';
import gameService, { ROWS, COLS, EMPTY, PLAYER1, PLAYER2 } from './services/gameService';
import './App.css';

function App() {
  // Game state
  const [currentSection, setCurrentSection] = useState('welcome');
  const [gameBoard, setGameBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [gameActive, setGameActive] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to server...');
  const [isConnected, setIsConnected] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState({ visible: false, winner: 0, isWinner: false });

  // Initialize connection and check URL params
  useEffect(() => {
    // Register callbacks
    gameService.registerCallbacks({
      onGameCreated: handleGameCreated,
      onGameStarted: handleGameStarted,
      onMove: handleMove,
      onError: handleError,
      onConnectionChange: handleConnectionChange,
      onReset: handleReset
    });

    // Establish connection
    gameService.connect();

    // Check for direct game join from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('game')) {
      const urlGameId = urlParams.get('game');
      const checkConnectionInterval = setInterval(() => {
        if (isConnected) {
          clearInterval(checkConnectionInterval);
          handleJoinGame(urlGameId);
        }
      }, 500);
    }

    return () => {
      gameService.disconnect();
    };
  }, []);

  // Handle connection status change
  const handleConnectionChange = (connected, message) => {
    setIsConnected(connected);
    setConnectionStatus(message);
  };

  // Handle game created
  const handleGameCreated = (newGameId) => {
    setGameId(newGameId);
    const newInviteLink = `${window.location.href.split('?')[0]}?game=${newGameId}`;
    setInviteLink(newInviteLink);
    setCurrentSection('invite');
  };

  // Handle game start
  const handleGameStarted = () => {
    setOpponentConnected(true);
    setGameActive(true);
    setCurrentSection('game');
  };

  // Handle incoming move
  const handleMove = (data) => {
    if (data.player !== gameService.myPlayer) {
      setGameBoard(prevBoard => {
        const newBoard = [...prevBoard];
        newBoard[data.row][data.col] = data.player;
        return newBoard;
      });

      // Check for win or draw
      if (checkWin(data.row, data.col, data.player, [...gameBoard])) {
        setGameActive(false);
        setGameOverInfo({
          visible: true,
          winner: data.player,
          isWinner: false
        });
      } else if (checkDraw([...gameBoard])) {
        setGameActive(false);
        setGameOverInfo({
          visible: true,
          winner: 0,
          isWinner: false
        });
      } else {
        // Switch players
        setCurrentPlayer(prevPlayer => (prevPlayer === PLAYER1 ? PLAYER2 : PLAYER1));
      }
    }
  };

  // Handle error
  const handleError = (message) => {
    alert(`Error: ${message}`);
    setCurrentSection('welcome');
  };

  // Handle game reset
  const handleReset = () => {
    resetGame();
  };

  // Create a new game
  const handleCreateGame = () => {
    if (!isConnected) {
      alert('Not connected to server. Please wait or refresh and try again.');
      return;
    }
    
    gameService.createGame();
    setCurrentSection('waiting');
  };

  // Join an existing game
  const handleJoinGame = (code) => {
    if (!isConnected) {
      alert('Not connected to server. Please wait or refresh and try again.');
      return;
    }
    
    gameService.joinGame(code);
    setCurrentSection('waiting');
  };

  // Make a move in a column
  const handleMakeMove = (col) => {
    if (!gameActive || currentPlayer !== gameService.myPlayer) return;

    // Find the lowest empty cell in the column
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (gameBoard[r][col] === EMPTY) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column is full

    // Update the game state
    const newBoard = [...gameBoard];
    newBoard[row][col] = currentPlayer;
    setGameBoard(newBoard);

    // Send the move to the server
    gameService.makeMove(row, col, currentPlayer);

    // Check for win or draw
    if (checkWin(row, col, currentPlayer, newBoard)) {
      setGameActive(false);
      setGameOverInfo({
        visible: true,
        winner: currentPlayer,
        isWinner: true
      });
    } else if (checkDraw(newBoard)) {
      setGameActive(false);
      setGameOverInfo({
        visible: true,
        winner: 0,
        isWinner: false
      });
    } else {
      // Switch players
      setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
    }
  };

  // Check if the current move results in a win
  const checkWin = (row, col, player, board) => {
    // Check horizontal
    let count = 0;
    for (let c = 0; c < COLS; c++) {
      count = (board[row][c] === player) ? count + 1 : 0;
      if (count >= 4) return true;
    }

    // Check vertical
    count = 0;
    for (let r = 0; r < ROWS; r++) {
      count = (board[r][col] === player) ? count + 1 : 0;
      if (count >= 4) return true;
    }

    // Check diagonal (/)
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (board[r][c] === player &&
            board[r + 1][c + 1] === player &&
            board[r + 2][c + 2] === player &&
            board[r + 3][c + 3] === player) {
          return true;
        }
      }
    }

    // Check diagonal (\)
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 3; c < COLS; c++) {
        if (board[r][c] === player &&
            board[r + 1][c - 1] === player &&
            board[r + 2][c - 2] === player &&
            board[r + 3][c - 3] === player) {
          return true;
        }
      }
    }

    return false;
  };

  // Check if the game is a draw
  const checkDraw = (board) => {
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === EMPTY) {
        return false;
      }
    }
    return true;
  };

  // Reset the game
  const resetGame = () => {
    setGameBoard(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER1);
    setGameActive(true);
    setGameOverInfo({ visible: false, winner: 0, isWinner: false });

    // Send reset game message if host
    if (gameService.isHost) {
      gameService.resetGame();
    }
  };

  // Leave the game
  const handleLeaveGame = () => {
    gameService.disconnect();
    setTimeout(() => {
      gameService.connect();
      setCurrentSection('welcome');
      setGameBoard(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
      setGameActive(false);
      setOpponentConnected(false);
      setGameId(null);
    }, 500);
  };

  return (
    <div className="App">
      <header>
        <h1>Connect 4 Online</h1>
      </header>

      <main>
        {currentSection === 'welcome' && (
          <WelcomeSection 
            onCreateGame={handleCreateGame} 
            onJoinGame={() => setCurrentSection('join')} 
          />
        )}

        {currentSection === 'invite' && (
          <InviteSection 
            inviteLink={inviteLink} 
            waitingForPlayer={!opponentConnected} 
          />
        )}

        {currentSection === 'join' && (
          <JoinSection 
            onJoinWithCode={handleJoinGame} 
            onBack={() => setCurrentSection('welcome')} 
          />
        )}

        {currentSection === 'waiting' && (
          <WaitingScreen connectionStatus={connectionStatus} />
        )}

        {currentSection === 'game' && (
          <GameSection 
            gameBoard={gameBoard}
            currentPlayer={currentPlayer}
            isMyTurn={currentPlayer === gameService.myPlayer}
            myPlayer={gameService.myPlayer}
            opponentConnected={opponentConnected}
            gameActive={gameActive}
            onMakeMove={handleMakeMove}
            onResetGame={resetGame}
            onLeaveGame={handleLeaveGame}
          />
        )}
      </main>

      <GameOverModal 
        visible={gameOverInfo.visible}
        winner={gameOverInfo.winner}
        isWinner={gameOverInfo.isWinner}
        onPlayAgain={resetGame}
        onReturnToLobby={() => {
          setGameOverInfo({ visible: false, winner: 0, isWinner: false });
          setCurrentSection('welcome');
        }}
      />

      <footer>
        <p>Connect 4 Online &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;