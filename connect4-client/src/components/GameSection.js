import React from 'react';
import { PLAYER1, PLAYER2, EMPTY, ROWS, COLS } from '../services/gameService';

function GameSection({ 
  gameBoard, 
  currentPlayer, 
  isMyTurn, 
  myPlayer, 
  opponentConnected, 
  gameActive,
  onMakeMove, 
  onResetGame, 
  onLeaveGame 
}) {
  // Generate status message
  const getStatusMessage = () => {
    if (!opponentConnected) {
      return 'Waiting for opponent to join...';
    } else if (gameActive) {
      return isMyTurn ? 'Your turn' : 'Opponent\'s turn';
    } else {
      return 'Game ended';
    }
  };

  return (
    <div className="container game-section">
      <div className="player-info">
        <div className="player-tag">
          <div className={`player-indicator ${myPlayer === PLAYER1 ? 'player1' : 'player2'}`}></div>
          <span>You</span>
        </div>
        <div className="player-tag">
          <div className={`player-indicator ${myPlayer === PLAYER1 ? 'player2' : 'player1'}`}></div>
          <span>Opponent</span>
        </div>
      </div>

      <div className="status">
        <div 
          className={`player-indicator ${currentPlayer === PLAYER1 ? 'player1' : 'player2'}`}
        ></div>
        <div>{getStatusMessage()}</div>
      </div>

      <div className="game-board">
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div 
            key={colIndex}
            className="column"
            onClick={() => onMakeMove(colIndex)}
          >
            {Array.from({ length: ROWS }).map((_, rowIndex) => {
              const cellValue = gameBoard[rowIndex][colIndex];
              let cellClass = 'cell';
              if (cellValue === PLAYER1) cellClass += ' player1';
              if (cellValue === PLAYER2) cellClass += ' player2';

              return (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClass}
                ></div>
              );
            })}
          </div>
        ))}
      </div>

      <button onClick={onResetGame}>Reset Game</button>
      <button onClick={onLeaveGame} className="secondary">Leave Game</button>
    </div>
  );
}

export default GameSection;