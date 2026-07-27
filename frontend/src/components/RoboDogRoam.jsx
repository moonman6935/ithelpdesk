import React from 'react';
import RoboDog from './RoboDog';

/**
 * Full-viewport roaming dog — walks behind and in front of the chat panel.
 * mode: still | roam | search
 */
export function RoboDogRoam({ mode = 'still', visible = true }) {
  if (!visible) return null;

  const isMoving = mode === 'roam' || mode === 'search';

  return (
    <div
      className={`robo-dog-roam ${isMoving ? `robo-dog-roam--${mode}` : 'robo-dog-roam--idle'}`}
      aria-hidden="true"
    >
      <RoboDog
        mode={isMoving ? mode : 'still'}
        size="roam"
        showGlass={mode === 'search'}
      />
    </div>
  );
}

export default RoboDogRoam;
