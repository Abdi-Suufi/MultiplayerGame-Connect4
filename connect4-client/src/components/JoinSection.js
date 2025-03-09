import React, { useState } from 'react';

function JoinSection({ onJoinWithCode, onBack }) {
  const [gameCode, setGameCode] = useState('');

  const handleJoin = () => {
    if (gameCode.trim()) {
      onJoinWithCode(gameCode.trim());
    }
  };

  return (
    <div className="container join-section">
      <h2>Join a Game</h2>
      <p>Enter the game code or use the full invite link:</p>
      <input 
        type="text" 
        placeholder="Game code or invite link" 
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value)}
      />
      <button onClick={handleJoin}>Join Game</button>
      <button onClick={onBack} className="secondary">Back</button>
    </div>
  );
}

export default JoinSection;