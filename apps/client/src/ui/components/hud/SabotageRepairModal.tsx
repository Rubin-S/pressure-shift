import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from '../tasks/TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { AlertTriangle, Wrench, ShieldCheck } from 'lucide-react';

export const SabotageRepairModal: React.FC = () => {
  const { activeSabotageRepairModal, closeSabotageRepairModal, repairSabotage } = useGame();

  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  if (!activeSabotageRepairModal) return null;

  const sabotageType = activeSabotageRepairModal.type;

  const handleStartHold = () => {
    if (completed) return;
    setIsHolding(true);
    soundEngine.playClick(800);

    const interval = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setCompleted(true);
          repairSabotage(sabotageType, activeSabotageRepairModal.stationId);
          return 100;
        }
        return prev + 20;
      });
    }, 150);

    const cleanup = () => {
      clearInterval(interval);
      setIsHolding(false);
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchend', cleanup);
    };

    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchend', cleanup);
  };

  return (
    <TaskModalContainer
      title={`EMERGENCY REPAIR: ${sabotageType.toUpperCase().replace('_', ' ')}`}
      description="Engage emergency bypass override to stabilize life support and clear alert."
      roomName="emergency_station"
      onClose={closeSabotageRepairModal}
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
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 56, 100, 0.15)',
            border: '1px solid #ff3864',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ff3864',
            fontFamily: 'var(--font-header)',
            fontSize: '0.9rem',
          }}
        >
          <AlertTriangle size={24} />
          <span>PRESS AND HOLD OVERRIDE COUPLER TO REPAIR</span>
        </div>

        {/* Hold Button */}
        <button
          onMouseDown={handleStartHold}
          onTouchStart={handleStartHold}
          disabled={completed}
          className="btn-sub btn-danger"
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            fontSize: '1.1rem',
            boxShadow: isHolding ? '0 0 30px #ff3864' : '0 0 15px rgba(255, 56, 100, 0.4)',
            transform: isHolding ? 'scale(0.96)' : 'scale(1)',
            transition: 'transform 0.1s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Wrench size={36} />
          <span>{completed ? 'REPAIRED' : isHolding ? 'HOLDING...' : 'HOLD OVERRIDE'}</span>
        </button>

        {/* Override progress bar */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: completed ? '#00e676' : 'var(--accent-red)',
            }}
          >
            <span>OVERRIDE ENGAGEMENT:</span>
            <span>{holdProgress}%</span>
          </div>
          <div className="progress-rail">
            <div
              className="progress-fill"
              style={{
                width: `${holdProgress}%`,
                background: completed ? '#00e676' : '#ff3864',
                boxShadow: `0 0 10px ${completed ? '#00e676' : '#ff3864'}`,
              }}
            />
          </div>
        </div>
      </div>
    </TaskModalContainer>
  );
};
