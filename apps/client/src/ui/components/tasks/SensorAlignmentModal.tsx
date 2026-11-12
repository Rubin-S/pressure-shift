import React, { useState, useEffect } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Compass, RotateCw, RotateCcw } from 'lucide-react';

export const SensorAlignmentModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const targetBearing = 135;
  const tolerance = 8;

  const [currentBearing, setCurrentBearing] = useState<number>(45);
  const [lockProgress, setLockProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  // Angular difference considering circular wrap 360
  const diff = Math.min(
    Math.abs(currentBearing - targetBearing),
    360 - Math.abs(currentBearing - targetBearing)
  );

  const isAligned = diff <= tolerance;

  // Signal strength % (100% when diff is 0, drops down as diff increases)
  const signalStrength = Math.max(0, Math.min(100, Math.round(100 - (diff / 90) * 100)));

  const adjustAngle = (delta: number) => {
    if (completed) return;
    soundEngine.playClick(500);
    setCurrentBearing((prev) => (prev + delta + 360) % 360);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAligned && !completed) {
      interval = setInterval(() => {
        setLockProgress((prev) => {
          if (prev >= 100) {
            setCompleted(true);
            completeTask(task.taskId, { bearing: currentBearing });
            return 100;
          }
          return prev + 25;
        });
      }, 150);
    } else if (!isAligned) {
      setLockProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAligned, completed, currentBearing, task.taskId, completeTask]);

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
        {/* Hydrophone Compass Dial */}
        <div
          style={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            backgroundColor: '#040d1a',
            border: '4px solid var(--border-sub)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 243, 255, 0.2)',
          }}
        >
          {/* Target Bearing Reticle (Amber) */}
          <div
            style={{
              position: 'absolute',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '2px dashed rgba(255, 170, 0, 0.6)',
              transform: `rotate(${targetBearing}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 170, 0, 0.9)',
                boxShadow: '0 0 8px #ffaa00',
              }}
            />
          </div>

          {/* Sensor Rotating Array Needle (Cyan) */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: `rotate(${currentBearing}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* Hydrophone Array Head */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '18px',
                height: '28px',
                backgroundColor: isAligned ? '#00e676' : 'var(--accent-cyan)',
                borderRadius: '4px',
                boxShadow: isAligned ? '0 0 15px #00e676' : '0 0 10px var(--accent-cyan)',
              }}
            />
            {/* Center crosshair shaft */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                bottom: '28px',
                left: 'calc(50% - 1.5px)',
                width: '3px',
                backgroundColor: isAligned ? '#00e676' : 'var(--accent-cyan)',
                opacity: 0.6,
              }}
            />
          </div>

          {/* Cardinal Directions */}
          <span style={{ position: 'absolute', top: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>0° N</span>
          <span style={{ position: 'absolute', right: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>90° E</span>
          <span style={{ position: 'absolute', bottom: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>180° S</span>
          <span style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>270° W</span>

          {/* Center Digital Readout */}
          <div
            style={{
              backgroundColor: 'rgba(5, 14, 25, 0.9)',
              border: '1px solid var(--border-sub)',
              padding: '4px 12px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              color: isAligned ? '#00e676' : 'var(--accent-cyan)',
              zIndex: 10,
            }}
          >
            {currentBearing}°
          </div>
        </div>

        {/* Rotation Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => adjustAngle(-15)} disabled={completed} className="btn-sub" style={{ padding: '8px 12px' }}>
            <RotateCcw size={16} /> -15°
          </button>
          <button onClick={() => adjustAngle(-2)} disabled={completed} className="btn-sub" style={{ padding: '8px 12px' }}>
            -2°
          </button>
          <button onClick={() => adjustAngle(2)} disabled={completed} className="btn-sub" style={{ padding: '8px 12px' }}>
            +2°
          </button>
          <button onClick={() => adjustAngle(15)} disabled={completed} className="btn-sub" style={{ padding: '8px 12px' }}>
            <RotateCw size={16} /> +15°
          </button>
        </div>

        {/* Signal & Alignment Bars */}
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
            }}
          >
            <span>ACOUSTIC SIGNAL TELEMETRY:</span>
            <span>{signalStrength}% ({targetBearing}° TARGET)</span>
          </div>
          <div className="progress-rail">
            <div
              className="progress-fill"
              style={{
                width: `${signalStrength}%`,
                background: isAligned ? '#00e676' : 'var(--accent-cyan)',
              }}
            />
          </div>
        </div>
      </div>
    </TaskModalContainer>
  );
};
