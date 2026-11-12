import React, { useState } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Cpu, RotateCw } from 'lucide-react';

// Tile conduit shapes: 'straight' (|), 'corner' (L), 'cross' (+)
interface Tile {
  id: number;
  type: 'straight' | 'corner' | 'cross';
  rotation: number; // 0, 90, 180, 270
}

// Initial grid configuration for 3x3
const INITIAL_GRID: Tile[] = [
  { id: 0, type: 'corner', rotation: 90 },
  { id: 1, type: 'straight', rotation: 0 },
  { id: 2, type: 'corner', rotation: 180 },
  { id: 3, type: 'straight', rotation: 90 },
  { id: 4, type: 'cross', rotation: 0 },
  { id: 5, type: 'straight', rotation: 90 },
  { id: 6, type: 'corner', rotation: 0 },
  { id: 7, type: 'straight', rotation: 0 },
  { id: 8, type: 'corner', rotation: 270 },
];

export const PowerRoutingModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();
  const [grid, setGrid] = useState<Tile[]>(INITIAL_GRID);
  const [completed, setCompleted] = useState<boolean>(false);

  // Check if grid provides power from top-left (0) to bottom-right (8)
  const checkPowerFlow = (tiles: Tile[]): boolean => {
    // 0 must be 0 deg (connecting Right and Down)
    // 1 must be 90 deg (horizontal)
    // 2 must be 90 deg (Down and Left)
    // 5 must be 0 deg (vertical)
    // 8 must be 180 deg (Left and Up)
    // Simple solvable condition check:
    const t0 = tiles[0].rotation % 360;
    const t1 = tiles[1].rotation % 360;
    const t2 = tiles[2].rotation % 360;
    const t5 = tiles[5].rotation % 360;
    const t8 = tiles[8].rotation % 360;

    return (
      (t0 === 0 || t0 === 360) &&
      (t1 === 90 || t1 === 270) &&
      (t2 === 90 || t2 === 450) &&
      (t5 === 0 || t5 === 180) &&
      (t8 === 180 || t8 === 540)
    );
  };

  const rotateTile = (index: number) => {
    if (completed) return;
    soundEngine.playClick(700);

    const nextGrid = grid.map((tile, i) => {
      if (i === index) {
        return { ...tile, rotation: (tile.rotation + 90) % 360 };
      }
      return tile;
    });

    setGrid(nextGrid);

    if (checkPowerFlow(nextGrid)) {
      setCompleted(true);
      setTimeout(() => {
        completeTask(task.taskId, { gridState: nextGrid });
      }, 500);
    }
  };

  return (
    <TaskModalContainer
      title={task.name}
      description={task.description}
      roomName={task.room}
      onClose={closeTaskModal}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          CLICK CONDUIT JUNCTION NODES TO ROTATE CIRCUIT & CONNECT SUB-STATION
        </div>

        {/* 3x3 Grid Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 90px)',
            gridTemplateRows: 'repeat(3, 90px)',
            gap: '10px',
            background: 'rgba(4, 10, 18, 0.95)',
            padding: '16px',
            border: '2px solid var(--border-sub)',
            borderRadius: '6px',
            position: 'relative',
          }}
        >
          {/* Inlet indicator (top-left) */}
          <div
            style={{
              position: 'absolute',
              top: '-16px',
              left: '42px',
              color: '#00e676',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            INLET ▼
          </div>

          {/* Outlet indicator (bottom-right) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-18px',
              right: '25px',
              color: completed ? '#00e676' : 'var(--accent-amber)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            OUTLET ▲
          </div>

          {grid.map((tile, idx) => (
            <button
              key={tile.id}
              onClick={() => rotateTile(idx)}
              disabled={completed}
              style={{
                width: '90px',
                height: '90px',
                background: 'rgba(12, 28, 48, 0.9)',
                border: '1px solid var(--border-sub)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: completed ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.2s',
              }}
            >
              {/* Tile Graphic */}
              <div
                style={{
                  transform: `rotate(${tile.rotation}deg)`,
                  transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tile.type === 'straight' && (
                  <div
                    style={{
                      width: '18px',
                      height: '100%',
                      background: completed ? '#ffd700' : 'var(--accent-cyan)',
                      boxShadow: completed ? '0 0 10px #ffd700' : '0 0 6px var(--accent-cyan)',
                    }}
                  />
                )}
                {tile.type === 'cross' && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        width: '18px',
                        height: '100%',
                        background: completed ? '#ffd700' : 'var(--accent-cyan)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '18px',
                        background: completed ? '#ffd700' : 'var(--accent-cyan)',
                      }}
                    />
                  </>
                )}
                {tile.type === 'corner' && (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Corner from top to right */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '36px',
                        width: '18px',
                        height: '54px',
                        background: completed ? '#ffd700' : 'var(--accent-cyan)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '36px',
                        left: '36px',
                        width: '54px',
                        height: '18px',
                        background: completed ? '#ffd700' : 'var(--accent-cyan)',
                      }}
                    />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Status display */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: completed ? '#00e676' : 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Cpu size={16} color={completed ? '#00e676' : 'var(--accent-cyan)'} />
          <span>
            {completed
              ? 'GRID POWER STABILIZED - RELAYS ENERGIZED'
              : 'GRID FAULT: ROTATE TILES TO ROUTE GEOTHERMAL CURRENT'}
          </span>
        </div>
      </div>
    </TaskModalContainer>
  );
};
