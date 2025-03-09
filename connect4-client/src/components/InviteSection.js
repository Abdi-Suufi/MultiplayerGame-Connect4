import React, { useState } from 'react';

function InviteSection({ inviteLink, waitingForPlayer }) {
  const [copyBtnText, setCopyBtnText] = useState('Copy Invite Link');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopyBtnText('Copied!');
    setTimeout(() => {
      setCopyBtnText('Copy Invite Link');
    }, 2000);
  };

  return (
    <div className="container invite-section">
      <h2>Invite a Friend</h2>
      <p>Share this link with someone to play Connect 4:</p>
      <input type="text" value={inviteLink} readOnly />
      <button onClick={handleCopyLink} className="copy-btn">{copyBtnText}</button>
      {waitingForPlayer && <p id="waitingMessage">Waiting for player to join...</p>}
    </div>
  );
}

export default InviteSection;