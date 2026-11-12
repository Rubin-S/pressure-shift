import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { FACILITY_ROOMS, FacilityRoomId } from '@pressure-shift/shared';
import { MapPin, X, AlertTriangle, Shield, CheckCircle } from 'lucide-react';

const ROOM_COORDINATES: Record<FacilityRoomId, { x: number; y: number; label: string }> = {
  docking_cradle: { x: 15, y: 15, label: 'Docking Bay' },
  sonar_control: { x: 50, y: 15, label: 'Sonar Control' },
  hydroponics: { x: 85, y: 15, label: 'Hydroponics' },
  pressure_lab: { x: 15, y: 50, label: 'Pressure Lab' },
  central_junction: { x: 50, y: 50, label: 'Central Junction' },
  observation_gallery: { x: 85, y: 50, label: 'Observation' },
  thermal_plant: { x: 15, y: 85, label: 'Thermal Plant' },
  communications: { x: 50, y: 85, label: 'Comms' },
  medical_bay: { x: 85, y: 85, label: 'Medical Bay' },
};

export const Minimap: React.FC = () => {
  const {
    isMinimapOpen,
    toggleMinimap,
    currentRoomName,
    assignedTasks,
    activeSabotage,
    role,
  } = useGame();

  // 'M' hotkey to toggle minimap
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        toggleMinimap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleMinimap]);

  if (!isMinimapOpen) return null;

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
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleMinimap();
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '740px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: 'rgba(5, 14, 25, 0.98)',
          border: '2px solid var(--accent-cyan-dim)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 243, 255, 0.25)',
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
            borderBottom: '1px solid var(--border-sub)',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={22} color="var(--accent-cyan)" />
            <span
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '1.1rem',
                color: 'var(--accent-cyan)',
                letterSpacing: '1px',
              }}
            >
              FACILITY SCHEMATIC OVERVIEW
            </span>
          </div>

          <button onClick={toggleMinimap} className="btn-sub btn-danger" style={{ padding: '6px 12px' }}>
            <X size={16} />
            <span>CLOSE [M]</span>
          </button>
        </div>

        {/* Map Blueprint Grid */}
        <div
          style={{
            width: '100%',
            height: '420px',
            backgroundColor: '#030810',
            border: '2px solid var(--border-sub)',
            borderRadius: '4px',
            position: 'relative',
            boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* Blueprint Grid Lines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(to right, rgba(0, 243, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 243, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Rooms */}
          {Object.entries(ROOM_COORDINATES).map(([roomId, data]) => {
            const isCurrentRoom = currentRoomName === roomId;
            const roomTasks = assignedTasks.filter((t) => t.room === roomId);
            const hasIncompleteTasks = roomTasks.some((t) => t.status !== 'COMPLETED');
            const isSabotaged = activeSabotage && activeSabotage.targetRoom === roomId;

            return (
              <div
                key={roomId}
                style={{
                  position: 'absolute',
                  top: `${data.y}%`,
                  left: `${data.x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '170px',
                  height: '85px',
                  backgroundColor: isCurrentRoom
                    ? 'rgba(0, 243, 255, 0.18)'
                    : isSabotaged
                    ? 'rgba(255, 56, 100, 0.25)'
                    : 'rgba(8, 20, 34, 0.85)',
                  border: `2px solid ${
                    isCurrentRoom
                      ? '#00f3ff'
                      : isSabotaged
                      ? '#ff3864'
                      : hasIncompleteTasks
                      ? '#ffaa00'
                      : 'var(--border-sub)'
                  }`,
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  textAlign: 'center',
                  boxShadow: isCurrentRoom ? '0 0 15px rgba(0, 243, 255, 0.5)' : undefined,
                  animation: isSabotaged ? 'alarmFlash 1.5s infinite' : undefined,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.8rem',
                    color: isCurrentRoom ? '#00f3ff' : '#e2f1f8',
                    fontWeight: 700,
                  }}
                >
                  {data.label}
                </span>

                {/* Status Badges in Room */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {isCurrentRoom && (
                    <span
                      style={{
                        backgroundColor: '#00f3ff',
                        color: '#000',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      YOU
                    </span>
                  )}

                  {hasIncompleteTasks && (
                    <span
                      style={{
                        backgroundColor: '#ffaa00',
                        color: '#000',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      TASK
                    </span>
                  )}

                  {isSabotaged && (
                    <span
                      style={{
                        backgroundColor: '#ff3864',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ALARM
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
