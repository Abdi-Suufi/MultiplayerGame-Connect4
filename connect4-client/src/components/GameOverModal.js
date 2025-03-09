import React from 'react';

function GameOverModal({ visible, winner, isWinner, onPlayAgain, onReturnToLobby }) {
  if (!visible) return null;

  // Generate winner message
  const getWinnerMessage = () => {
    if (winner === 0) {
      return 'Draw!';
    } else {
      return isWinner ? 'You Win!' : 'You Lose!';
    }
  };

  // Generate details message
  const getDetailsMessage = () => {
    if (winner === 0) {
      return 'The game ended in a draw.';
    } else {
      return isWinner 
        ? 'Congratulations on your victory!' 
        : 'Better luck next time!';
    }
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <h2>{getWinnerMessage()}</h2>
        <p>{getDetailsMessage()}</p>
        <button onClick={onPlayAgain}>Play Again</button>
        <button onClick={onReturnToLobby} className="secondary">Return to Lobby</button>
      </div>
    </div>
  );
}

export default GameOverModal;