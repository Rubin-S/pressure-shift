import React, { useState } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Zap } from 'lucide-react';

type WireColor = 'cyan' | 'magenta' | 'yellow' | 'green';

const COLOR_MAP: Record<WireColor, { hex: string; name: string }> = {
  cyan: { hex: '#00f3ff', name: 'Cyan (Telemetry)' },
  magenta: { hex: '#ff38c5', name: 'Magenta (Life Support)' },
  yellow: { hex: '#ffd700', name: 'Yellow (Power Feed)' },
  green: { hex: '#00e676', name: 'Green (Ground / Earth)' },
};

const LEFT_WIRES: WireColor[] = ['cyan', 'magenta', 'yellow', 'green'];
const RIGHT_TERMINALS: WireColor[] = ['yellow', 'cyan', 'green', 'magenta'];

export const CircuitWireModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const [selectedLeft, setSelectedLeft] = useState<WireColor | null>(null);
  const [connections, setConnections] = useState<Record<WireColor, WireColor | null>>({
    cyan: null,
    magenta: null,
    yellow: null,
    green: null,
  });
  const [completed, setCompleted] = useState<boolean>(false);

  const handleLeftClick = (color: WireColor) => {
    if (completed) return;
    setSelectedLeft(color);
    soundEngine.playClick(600);
  };

  const handleRightClick = (color: WireColor) => {
    if (completed || !selectedLeft) return;

    if (selectedLeft === color) {
      // Correct connection
      const updated = { ...connections, [selectedLeft]: color };
      setConnections(updated);
      setSelectedLeft(null);
      soundEngine.playClick(900);

      // Check if all connected
      const allConnected = LEFT_WIRES.every((w) => updated[w] === w);
      if (allConnected) {
        setCompleted(true);
        setTimeout(() => {
          completeTask(task.taskId, { connections: updated });
        }, 500);
      }
    } else {
      // Wrong connection
      soundEngine.playError();
      setSelectedLeft(null);
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
          gap: '24px',
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
          SELECT LEFT CONNECTOR LEAD, THEN CLICK MATCHING RIGHT TERMINAL BLOCK
        </div>

        {/* Circuit Board Workspace */}
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            height: '240px',
            backgroundColor: 'rgba(5, 14, 25, 0.95)',
            border: '2px solid var(--border-sub)',
            borderRadius: '6px',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Left Lead Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', zIndex: 10 }}>
            {LEFT_WIRES.map((color) => {
              const isConn = connections[color] !== null;
              const isSel = selectedLeft === color;
              const colorInfo = COLOR_MAP[color];
              return (
                <button
                  key={color}
                  onClick={() => handleLeftClick(color)}
                  disabled={isConn || completed}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isSel ? 'rgba(255, 255, 255, 0.2)' : 'rgba(10, 25, 42, 0.8)',
                    border: `2px solid ${isSel ? '#ffffff' : colorInfo.hex}`,
                    borderRadius: '4px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    cursor: isConn ? 'default' : 'pointer',
                    boxShadow: isSel ? `0 0 12px ${colorInfo.hex}` : 'none',
                    opacity: isConn ? 0.45 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: colorInfo.hex,
                      boxShadow: `0 0 8px ${colorInfo.hex}`,
                    }}
                  />
                  <span>{color.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* SVG Connection Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {LEFT_WIRES.map((leftColor, idx) => {
              if (connections[leftColor]) {
                const rightIdx = RIGHT_TERMINALS.indexOf(leftColor);
                const y1 = 42 + idx * 48;
                const y2 = 42 + rightIdx * 48;
                const hex = COLOR_MAP[leftColor].hex;
                return (
                  <path
                    key={leftColor}
                    d={`M 140 ${y1} C 260 ${y1}, 260 ${y2}, 380 ${y2}`}
                    fill="none"
                    stroke={hex}
                    strokeWidth="4"
                    strokeDasharray="6,2"
                    style={{ filter: `drop-shadow(0 0 6px ${hex})` }}
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Right Terminal Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', zIndex: 10 }}>
            {RIGHT_TERMINALS.map((color) => {
              const isConn = Object.values(connections).includes(color);
              const colorInfo = COLOR_MAP[color];
              return (
                <button
                  key={color}
                  onClick={() => handleRightClick(color)}
                  disabled={isConn || completed}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(10, 25, 42, 0.8)',
                    border: `2px solid ${colorInfo.hex}`,
                    borderRadius: '4px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    cursor: isConn ? 'default' : 'pointer',
                    opacity: isConn ? 0.45 : 1,
                  }}
                >
                  <span>{color.toUpperCase()}</span>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: colorInfo.hex,
                      boxShadow: `0 0 8px ${colorInfo.hex}`,
                    }}
                  />
                </button>
              );
            })}
          </div>
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
          <Zap size={16} color={completed ? '#00e676' : 'var(--accent-cyan)'} />
          <span>
            {completed
              ? 'CIRCUIT CONTINUITY RESTORED - 100%'
              : `WIRES CONNECTED: ${Object.values(connections).filter(Boolean).length} / 4`}
          </span>
        </div>
      </div>
    </TaskModalContainer>
  );
};
