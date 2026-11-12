import React, { useState } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Droplet, Waves } from 'lucide-react';

const REQUIRED_SEQUENCE = [1, 3, 2, 4];

export const BallastPumpModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [waterLevel, setWaterLevel] = useState<number>(100);
  const [completed, setCompleted] = useState<boolean>(false);

  const handleValveClick = (valveNum: number) => {
    if (completed) return;

    if (valveNum === REQUIRED_SEQUENCE[currentStep]) {
      soundEngine.playClick(600 + valveNum * 100);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      const nextWater = Math.max(0, 100 - nextStep * 25);
      setWaterLevel(nextWater);

      if (nextStep >= REQUIRED_SEQUENCE.length) {
        setCompleted(true);
        setTimeout(() => {
          completeTask(task.taskId, { sequence: REQUIRED_SEQUENCE });
        }, 500);
      }
    } else {
      // Wrong sequence button
      soundEngine.playError();
      setCurrentStep(0);
      setWaterLevel(100);
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
          CYCLE PURGE MANIFOLD IN ORDER: {REQUIRED_SEQUENCE.join(' ➔ ')}
        </div>

        {/* Ballast Chamber Graphic */}
        <div
          style={{
            width: '140px',
            height: '180px',
            backgroundColor: 'rgba(5, 14, 25, 0.95)',
            border: '3px solid var(--border-sub)',
            borderRadius: '6px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* Water Fill Layer */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: `${waterLevel}%`,
              background: 'linear-gradient(180deg, #00f3ff 0%, #004c7a 100%)',
              transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.85,
            }}
          />

          {/* Water Level Tick Marks */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#fff',
              zIndex: 10,
            }}
          >
            {waterLevel}%
          </div>
        </div>

        {/* Valve Sequence Buttons */}
        <div style={{ display: 'flex', gap: '14px' }}>
          {[1, 2, 3, 4].map((num) => {
            const isNextExpected = REQUIRED_SEQUENCE[currentStep] === num;
            return (
              <button
                key={num}
                onClick={() => handleValveClick(num)}
                disabled={completed}
                className="btn-sub"
                style={{
                  width: '68px',
                  height: '68px',
                  fontSize: '1.2rem',
                  borderColor: isNextExpected ? 'var(--accent-cyan)' : 'var(--border-sub)',
                  boxShadow: isNextExpected ? '0 0 10px rgba(0, 243, 255, 0.4)' : 'none',
                }}
              >
                VALVE {num}
              </button>
            );
          })}
        </div>

        {/* Status */}
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
          <Waves size={16} color={completed ? '#00e676' : 'var(--accent-cyan)'} />
          <span>{completed ? 'BALLAST TANKS FULLY PURGED' : `ACTIVE SEQUENCE STEP: ${currentStep} / 4`}</span>
        </div>
      </div>
    </TaskModalContainer>
  );
};
