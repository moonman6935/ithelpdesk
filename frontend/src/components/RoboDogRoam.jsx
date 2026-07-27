import React from 'react';
import RoboDog from './RoboDog';

/**
 * Full-viewport roaming dog — launches from the panel avatar, then roams the page.
 * mode: still | roam | search
 */
export function RoboDogRoam({
  mode = 'still',
  visible = true,
  launching = false,
  launchOrigin = null,
}) {
  if (!visible) return null;

  const isMoving = launching || mode === 'roam' || mode === 'search';

  const style =
    launchOrigin != null
      ? {
          '--robo-launch-x': `${launchOrigin.x}px`,
          '--robo-launch-y': `${launchOrigin.y}px`,
        }
      : undefined;

  let motionClass = '';
  if (launching) {
    motionClass = 'robo-dog-roam--launch';
  } else if (mode === 'search') {
    motionClass = 'robo-dog-roam--search';
  } else if (mode === 'roam') {
    motionClass = 'robo-dog-roam--roam';
  } else {
    motionClass = 'robo-dog-roam--idle';
  }

  return (
    <div
      className={`robo-dog-roam ${motionClass}`}
      style={style}
      aria-hidden="true"
    >
      <RoboDog
        mode={isMoving ? (mode === 'still' ? 'roam' : mode) : 'still'}
        size="roam"
        showGlass={mode === 'search'}
      />
    </div>
  );
}

export default RoboDogRoam;
