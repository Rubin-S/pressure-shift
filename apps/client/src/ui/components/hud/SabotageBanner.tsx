import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { AlertTriangle, Flame, Radio } from 'lucide-react';

export const SabotageBanner: React.FC = () => {
  const { activeSabotage } = useGame();

  if (!activeSabotage) return null;

  const isCritical = activeSabotage.isCritical;
  const timeRemaining = activeSabotage.timeRemaining;

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1800,
        maxWidth: '680px',
        width: '94%',
        animation: isCritical ? 'alarmFlash 1s infinite' : undefined,
        backgroundColor: isCritical ? 'rgba(255, 56, 100, 0.25)' : 'rgba(255, 170, 0, 0.2)',
        border: `2px solid ${isCritical ? '#ff3864' : '#ffaa00'}`,
        borderRadius: '4px',
        padding: '10px 16px',
        boxShadow: `0 0 20px ${isCritical ? 'rgba(255, 56, 100, 0.6)' : 'rgba(255, 170, 0, 0.4)'}`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isCritical ? <Flame size={24} color="#ff3864" /> : <Radio size={24} color="#ffaa00" />}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: isCritical ? '#ff3864' : '#ffaa00',
              letterSpacing: '1px',
            }}
          >
            {activeSabotage.name.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#e2f1f8',
            }}
          >
            {isCritical
              ? 'Emergency purge required before pressure collapse!'
              : 'Communications scrambled. Radar and task telemetry offline.'}
          </div>
        </div>
      </div>

      {/* Critical Countdown Timer */}
      {isCritical && timeRemaining !== null && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4rem',
            fontWeight: 900,
            color: '#fff',
            backgroundColor: '#ff3864',
            padding: '4px 12px',
            borderRadius: '4px',
            boxShadow: '0 0 12px #ff3864',
          }}
        >
          {timeRemaining}s
        </div>
      )}
    </div>
  );
};
