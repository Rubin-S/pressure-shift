import React, { useState, useEffect } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Gauge } from 'lucide-react';

export const PressureValveModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const targetPsi = 80;
  const tolerance = 5;

  const [currentPsi, setCurrentPsi] = useState<number>(35);
  const [stabilizeProgress, setStabilizeProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const isBalanced = Math.abs(currentPsi - targetPsi) <= tolerance;

  // Stabilization countdown when in target range
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isBalanced && !completed) {
      interval = setInterval(() => {
        setStabilizeProgress((prev) => {
          if (prev >= 100) {
            setCompleted(true);
            completeTask(task.taskId, { psi: currentPsi });
            return 100;
          }
          return prev + 20;
        });
      }, 150);
    } else if (!isBalanced) {
      setStabilizeProgress(0);
    }
    return () => clearInterval(interval);
  }, [isBalanced, completed, currentPsi, task.taskId, completeTask]);

  // Needle angle: 0 PSI is -120 deg, 150 PSI is +120 deg
  const needleDeg = -120 + (currentPsi / 150) * 240;

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
        {/* Analog Manometer Dial */}
        <div
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            backgroundColor: '#050f1a',
            border: '4px solid #1a3959',
            boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 243, 255, 0.15)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Target Zone Arc Indicator */}
          <div
            style={{
              position: 'absolute',
              width: '170px',
              height: '170px',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTopColor: '#00e676',
              transform: 'rotate(8deg)',
              opacity: 0.8,
            }}
          />

          {/* Dial Ticks */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            TARGET: {targetPsi} PSI
          </div>

          {/* Needle */}
          <div
            style={{
              position: 'absolute',
              width: '4px',
              height: '80px',
              bottom: '100px',
              backgroundColor: isBalanced ? '#00e676' : '#ff3864',
              boxShadow: isBalanced ? '0 0 10px #00e676' : '0 0 8px #ff3864',
              transformOrigin: 'bottom center',
              transform: `rotate(${needleDeg}deg)`,
              transition: 'transform 0.1s ease-out',
              borderRadius: '2px',
            }}
          />

          {/* Center Hub Nut */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#1f3c5b',
              border: '2px solid #fff',
              zIndex: 10,
            }}
          />

          {/* Readout Box */}
          <div
            style={{
              position: 'absolute',
              bottom: '25px',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: isBalanced ? '#00e676' : 'var(--accent-cyan)',
              background: 'rgba(2, 6, 12, 0.8)',
              padding: '2px 10px',
              border: '1px solid var(--border-sub)',
              borderRadius: '2px',
            }}
          >
            {currentPsi} PSI
          </div>
        </div>

        {/* Valve Handwheel / Slider Control */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--accent-cyan)',
            }}
          >
            <span>EQUALIZATION VALVE SLIDER</span>
            <span>{isBalanced ? 'STABILIZING...' : 'ADJUSTING'}</span>
          </div>

          <input
            type="range"
            min={0}
            max={150}
            value={currentPsi}
            disabled={completed}
            onChange={(e) => {
              setCurrentPsi(Number(e.target.value));
              soundEngine.playClick(300 + Number(e.target.value) * 3);
            }}
            style={{ width: '100%', accentColor: isBalanced ? '#00e676' : 'var(--accent-cyan)', cursor: 'pointer' }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>0 PSI</span>
            <span style={{ color: '#00e676' }}>75-85 PSI (TARGET)</span>
            <span>150 PSI</span>
          </div>
        </div>

        {/* Stabilization Progress */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: isBalanced ? '#00e676' : 'var(--text-muted)',
            }}
          >
            <span>PRESSURE EQUALIZATION:</span>
            <span>{stabilizeProgress}%</span>
          </div>
          <div className="progress-rail">
            <div
              className="progress-fill"
              style={{
                width: `${stabilizeProgress}%`,
                background: isBalanced ? '#00e676' : 'var(--accent-cyan)',
                boxShadow: isBalanced ? '0 0 12px #00e676' : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </TaskModalContainer>
  );
};
