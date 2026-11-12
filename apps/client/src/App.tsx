import React from 'react';
import { GameProvider, useGame } from './ui/context/GameContext.js';
import { ScanlineOverlay } from './ui/components/common/ScanlineOverlay.js';
import { ToastContainer } from './ui/components/common/ToastContainer.js';
import { VirtualJoystick } from './ui/components/common/VirtualJoystick.js';
import { MainMenu } from './ui/components/menu/MainMenu.js';
import { MultiplayerLobby } from './ui/components/lobby/MultiplayerLobby.js';
import { GameHUD } from './ui/components/hud/GameHUD.js';
import { PhaserCanvas } from './ui/components/hud/PhaserCanvas.js';
import { Minimap } from './ui/components/hud/Minimap.js';
import { SabotageMenu } from './ui/components/hud/SabotageMenu.js';
import { SabotageRepairModal } from './ui/components/hud/SabotageRepairModal.js';
import { TaskModalDispatcher } from './ui/components/tasks/TaskModalDispatcher.js';
import { EmergencyMeetingView } from './ui/components/meeting/EmergencyMeetingView.js';
import { MeetingResultOverlay } from './ui/components/meeting/MeetingResultOverlay.js';
import { GameOverView } from './ui/components/gameover/GameOverView.js';
import './ui/styles/theme.css';

const GameContainer: React.FC = () => {
  const { roomCode, roomState, touchControlsEnabled } = useGame();

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#03070d',
      }}
    >
      {/* Phosphor CRT Scanline Effect Overlay */}
      <ScanlineOverlay />

      {/* Floating System Toasts */}
      <ToastContainer />

      {/* Phaser 3 Canvas Container */}
      <PhaserCanvas />

      {/* Primary Screen View */}
      {!roomCode ? (
        <MainMenu />
      ) : roomState === 'LOBBY' || roomState === 'STARTING' ? (
        <MultiplayerLobby />
      ) : (
        <>
          {/* Main Gameplay HUD */}
          {roomState === 'PLAYING' && <GameHUD />}

          {/* Emergency Meeting Assembly Screen */}
          {roomState === 'MEETING' && <EmergencyMeetingView />}

          {/* Voting Results & Ejection Overlay */}
          {roomState === 'VOTING_RESULTS' && <MeetingResultOverlay />}

          {/* Victory / Defeat Game Over Screen */}
          {roomState === 'GAME_OVER' && <GameOverView />}
        </>
      )}

      {/* Contextual Modals */}
      <Minimap />
      <SabotageMenu />
      <TaskModalDispatcher />
      <SabotageRepairModal />

      {/* Mobile Virtual Joystick & Touch cluster */}
      {touchControlsEnabled && <VirtualJoystick />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
};

export default App;
