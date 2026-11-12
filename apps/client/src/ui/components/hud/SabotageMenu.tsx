import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { SABOTAGE_DEFINITIONS, SabotageType, FacilityRoomId } from '@pressure-shift/shared';
import { Radio, AlertTriangle, Flame, Lock, X } from 'lucide-react';

export const SabotageMenu: React.FC = () => {
  const {
    isSabotageMenuOpen,
    toggleSabotageMenu,
    sabotageCooldown,
    triggerSabotage,
    activeSabotage,
    role,
  } = useGame();

  if (!isSabotageMenuOpen || role !== 'DISRUPTOR') return null;

  const isCooldown = sabotageCooldown > 0 || activeSabotage !== null;

  const handleTrigger = (type: SabotageType, targetRoom?: FacilityRoomId) => {
    if (isCooldown) return;
    triggerSabotage(type, targetRoom);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(2, 6, 12, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleSabotageMenu();
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '640px',
          maxWidth: '96vw',
          backgroundColor: 'rgba(12, 4, 8, 0.96)',
          border: '2px solid #ff3864',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 56, 100, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 56, 100, 0.3)',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={24} color="#ff3864" />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '1.15rem',
                  color: '#ff3864',
                  letterSpacing: '1px',
                }}
              >
                DISRUPTOR TACTICAL SABOTAGE NETWORK
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                SELECT AN EMERGENCY DISASTER OR BULKHEAD OVERRIDE
              </div>
            </div>
          </div>

          <button onClick={toggleSabotageMenu} className="btn-sub btn-danger" style={{ padding: '6px 12px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Cooldown banner */}
        {sabotageCooldown > 0 && (
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 56, 100, 0.1)',
              border: '1px dashed #ff3864',
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              color: '#ff3864',
            }}
          >
            SABOTAGE RECHARGE COOLDOWN: {sabotageCooldown}s
          </div>
        )}

        {/* Sabotage Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Communications Interference */}
          <button
            onClick={() => handleTrigger('communications_interference')}
            disabled={isCooldown}
            className="btn-sub btn-danger"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffaa00' }}>
              <Radio size={20} />
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem' }}>COMMS INTERFERENCE</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Scrambles task markers & navigation minimap until repaired in Comms.
            </div>
          </button>

          {/* Oxygen Depletion (Critical 45s) */}
          <button
            onClick={() => handleTrigger('oxygen_depletion')}
            disabled={isCooldown}
            className="btn-sub btn-danger"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff3864' }}>
              <AlertTriangle size={20} />
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem' }}>O2 / PRESSURE DEPLETION</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              CRITICAL EMERGENCY (45s). Purge scrubbers in Hydroponics & Observation or Disruptors win!
            </div>
          </button>

          {/* Reactor Meltdown (Critical 45s) */}
          <button
            onClick={() => handleTrigger('reactor_meltdown')}
            disabled={isCooldown}
            className="btn-sub btn-danger"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff3864' }}>
              <Flame size={20} />
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem' }}>REACTOR MELTDOWN</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              CRITICAL EMERGENCY (45s). Coolant overrides must be held simultaneously in Thermal Plant.
            </div>
          </button>

          {/* Door Lockdown */}
          <button
            onClick={() => handleTrigger('door_lockdown', 'medical_bay')}
            disabled={isCooldown}
            className="btn-sub btn-danger"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffaa00' }}>
              <Lock size={20} />
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem' }}>DOOR LOCKDOWN</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Seals hydraulic bulkheads in Medical Bay for 12 seconds.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
