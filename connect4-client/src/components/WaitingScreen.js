import React from 'react';

function WaitingScreen({ connectionStatus }) {
  return (
    <div className="container waiting-screen">
      <h2>Connecting to Game</h2>
      <p>Please wait while we connect you to the game...</p>
      <div id="connectionStatus">{connectionStatus}</div>
    </div>
  );
}

export default WaitingScreen;