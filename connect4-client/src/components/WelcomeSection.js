import React from 'react';

function WelcomeSection({ onCreateGame, onJoinGame }) {
  return (
    <div className="container welcome-section">
      <h2>Welcome to Connect 4 Online</h2>
      <p>Play Connect 4 with friends by creating or joining a game.</p>
      <div className="actions">
        <button onClick={onCreateGame}>Create Game</button>
        <button onClick={onJoinGame} className="secondary">Join Game</button>
      </div>
    </div>
  );
}

export default WelcomeSection;