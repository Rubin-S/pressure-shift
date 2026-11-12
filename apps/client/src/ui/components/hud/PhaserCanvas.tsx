import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPressureShiftGame, gameBridge } from '../../../game/index.js';
import { useGame } from '../../context/GameContext.js';
import { networkManager } from '../../../network/socket.js';

export const PhaserCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const {
    roomState,
    players,
    localPlayerId,
    deadBodies,
    assignedTasks,
    activeSabotage,
    activeTaskModal,
    activeSabotageRepairModal,
    openTaskModal,
    openSabotageRepairModal,
    callEmergencyMeeting,
    reportBody,
    attemptKill,
  } = useGame();

  // Mount/Unmount Phaser Game instance
  useEffect(() => {
    if (!containerRef.current) return;

    if (!gameRef.current) {
      const game = createPressureShiftGame(containerRef.current);
      gameRef.current = game;
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Bridge Phaser events to Network and React UI
  useEffect(() => {
    const unbindMove = gameBridge.on('player:moved', (payload) => {
      networkManager.sendMove({
        x: payload.x,
        y: payload.y,
        facing: payload.facing,
        timestamp: payload.timestamp,
      });
    });

    const unbindTask = gameBridge.on('task:triggered', (taskId) => {
      const task = assignedTasks.find((t) => t.taskId === taskId);
      if (task) {
        openTaskModal(task);
      } else {
        openTaskModal({
          id: taskId,
          taskId,
          name: taskId.replace('task_', '').replace('_', ' ').toUpperCase(),
          type: taskId.replace('task_', '') as any,
          description: 'Station Task',
          room: 'central_junction',
          location: { x: 0, y: 0 },
          status: 'NOT_STARTED',
        });
      }
    });

    const unbindEmergency = gameBridge.on('emergency_button:triggered', () => {
      callEmergencyMeeting();
    });

    const unbindBody = gameBridge.on('body:reported', (bodyId) => {
      reportBody();
    });

    const unbindSabotage = gameBridge.on('sabotage_repair:triggered', (stationId) => {
      const sabType = activeSabotage?.type || 'oxygen_depletion';
      openSabotageRepairModal(sabType, stationId);
    });

    const unbindKill = gameBridge.on('kill:attempted', (targetId) => {
      attemptKill();
    });

    return () => {
      unbindMove();
      unbindTask();
      unbindEmergency();
      unbindBody();
      unbindSabotage();
      unbindKill();
    };
  }, [
    assignedTasks,
    activeSabotage,
    openTaskModal,
    openSabotageRepairModal,
    callEmergencyMeeting,
    reportBody,
    attemptKill,
  ]);

  // Sync React game state into Phaser GameBridge
  useEffect(() => {
    const me = players.find((p) => p.id === localPlayerId);
    if (me) {
      gameBridge.setLocalPlayer(me);
    }
    gameBridge.setRemotePlayers(players);
    gameBridge.setDeadBodies(deadBodies);
    gameBridge.setTasks(assignedTasks);
    gameBridge.setSabotage(activeSabotage);

    const isModalOpen = !!activeTaskModal || !!activeSabotageRepairModal;
    const isPlaying = roomState === 'PLAYING';
    gameBridge.setMovementEnabled(!isModalOpen && isPlaying);
  }, [
    players,
    localPlayerId,
    deadBodies,
    assignedTasks,
    activeSabotage,
    activeTaskModal,
    activeSabotageRepairModal,
    roomState,
  ]);

  return (
    <div
      ref={containerRef}
      id="phaser-game-canvas-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        overflow: 'hidden',
        pointerEvents: roomState === 'PLAYING' ? 'auto' : 'none',
        display: roomState === 'PLAYING' ? 'block' : 'none',
      }}
    />
  );
};
