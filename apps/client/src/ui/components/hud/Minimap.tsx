import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { FacilityRoomId } from '@pressure-shift/shared';
import {
  Compass,
  X,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface SectorLayout {
  code: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
}

const SECTOR_LAYOUTS: Record<FacilityRoomId, SectorLayout> = {
  docking_cradle: {
    code: 'SEC-01',
    name: 'Docking Cradle',
    subtitle: 'Moon Pool & Gantry Rig',
    x: 18,
    y: 18,
  },
  sonar_control: {
    code: 'SEC-02',
    name: 'Sonar Telemetry',
    subtitle: 'Acoustic Radar Sweep',
    x: 50,
    y: 18,
  },
  hydroponics: {
    code: 'SEC-03',
    name: 'Hydroponics Lab',
    subtitle: 'Spirulina Bioreactor Columns',
    x: 82,
    y: 18,
  },
  pressure_lab: {
    code: 'SEC-04',
    name: 'Pressure Lab',
    subtitle: 'Hyperbaric Testing Seals',
    x: 18,
    y: 50,
  },
  central_junction: {
    code: 'CMD-00',
    name: 'Central Rotunda',
    subtitle: 'Holographic Bathymetric Dais',
    x: 50,
    y: 50,
  },
  observation_gallery: {
    code: 'SEC-05',
    name: 'Observation Dome',
    subtitle: 'Panoramic Trench Viewports',
    x: 82,
    y: 50,
  },
  thermal_plant: {
    code: 'SEC-06',
    name: 'Thermal Plant',
    subtitle: 'Magma Rift Geothermal Catwalk',
    x: 18,
    y: 82,
  },
  communications: {
    code: 'SEC-07',
    name: 'Comms Array',
    subtitle: 'Sub-Oceanic Optical Transceiver',
    x: 50,
    y: 82,
  },
  medical_bay: {
    code: 'SEC-08',
    name: 'Medical Bay',
    subtitle: 'Bio-Scanner & Anomaly Pedestal',
    x: 82,
    y: 82,
  },
};

// Structural corridors connecting the 9 sectors in grid topology
const CORRIDOR_PATHS = [
  // Horizontal corridors
  { x1: '18%', y1: '18%', x2: '82%', y2: '18%' },
  { x1: '18%', y1: '50%', x2: '82%', y2: '50%' },
  { x1: '18%', y1: '82%', x2: '82%', y2: '82%' },
  // Vertical corridors
  { x1: '18%', y1: '18%', x2: '18%', y2: '82%' },
  { x1: '50%', y1: '18%', x2: '50%', y2: '82%' },
  { x1: '82%', y1: '18%', x2: '82%', y2: '82%' },
];

export const Minimap: React.FC = () => {
  const {
    isMinimapOpen,
    toggleMinimap,
    currentRoomName,
    assignedTasks,
    activeSabotage,
  } = useGame();

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
        backgroundColor: 'rgba(2, 6, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 2vw, 24px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleMinimap();
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: 'rgba(7, 15, 26, 0.96)',
          border: '1px solid rgba(0, 243, 255, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 243, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(12px, 2vh, 22px) clamp(14px, 2vw, 26px)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '10px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 243, 255, 0.12)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Compass size={18} color="var(--accent-cyan)" />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
                  color: '#ffffff',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>NADIR-7 FACILITY BLUEPRINT</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--accent-cyan)',
                    backgroundColor: 'rgba(0, 243, 255, 0.12)',
                    padding: '1px 6px',
                    borderRadius: '2px',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                  }}
                >
                  LIVE TELEMETRY
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                }}
              >
                TACTICAL STAGE ARCHITECTURE // DEPTH: 8,400 M // PRESSURE: 840 ATM
              </div>
            </div>
          </div>

          <button onClick={toggleMinimap} className="btn-sub btn-danger" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            <X size={14} />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Blueprint Facility Matrix Canvas */}
        <div
          style={{
            width: '100%',
            height: 'clamp(240px, 52vh, 420px)',
            backgroundColor: '#040912',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.95)',
          }}
        >
          {/* Subtle Grid Lines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(to right, rgba(0, 243, 255, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 243, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px',
              pointerEvents: 'none',
            }}
          />

          {/* SVG Power Conduits & Interconnecting Corridors */}
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
            {CORRIDOR_PATHS.map((corridor, idx) => (
              <line
                key={idx}
                x1={corridor.x1}
                y1={corridor.y1}
                x2={corridor.x2}
                y2={corridor.y2}
                stroke="rgba(0, 243, 255, 0.25)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
            ))}
          </svg>

          {/* 9 Facility Sector Rooms */}
          {Object.entries(SECTOR_LAYOUTS).map(([roomId, data]) => {
            const isCurrentRoom = currentRoomName === roomId;
            const roomTasks = assignedTasks.filter((t) => t.room === roomId);
            const pendingTasks = roomTasks.filter((t) => t.status !== 'COMPLETED');
            const hasPendingTasks = pendingTasks.length > 0;
            const isSabotaged = activeSabotage && activeSabotage.targetRoom === roomId;

            return (
              <div
                key={roomId}
                style={{
                  position: 'absolute',
                  top: `${data.y}%`,
                  left: `${data.x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 'clamp(115px, 26vw, 190px)',
                  height: 'clamp(62px, 14vh, 94px)',
                  backgroundColor: isCurrentRoom
                    ? 'rgba(0, 243, 255, 0.18)'
                    : isSabotaged
                    ? 'rgba(255, 51, 102, 0.22)'
                    : 'rgba(8, 17, 30, 0.92)',
                  border: `1px solid ${
                    isCurrentRoom
                      ? '#00f3ff'
                      : isSabotaged
                      ? '#ff3366'
                      : hasPendingTasks
                      ? '#ffaa00'
                      : 'rgba(0, 243, 255, 0.2)'
                  }`,
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 'clamp(5px, 1vh, 8px) clamp(6px, 1vw, 10px)',
                  boxShadow: isCurrentRoom
                    ? '0 0 20px rgba(0, 243, 255, 0.4), inset 0 0 12px rgba(0, 243, 255, 0.1)'
                    : isSabotaged
                    ? '0 0 20px rgba(255, 51, 102, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.5)',
                  animation: isSabotaged ? 'alarmFlash 1.4s infinite' : undefined,
                  transition: 'all 0.2s ease',
                  zIndex: isCurrentRoom ? 10 : 2,
                }}
              >
                {/* Sector Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(0.55rem, 1vw, 0.65rem)',
                      color: isCurrentRoom ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                    }}
                  >
                    {data.code}
                  </span>

                  {isCurrentRoom && (
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '1px solid var(--accent-cyan)',
                          animation: 'sonarPulse 1.8s infinite',
                        }}
                      />
                      <span
                        style={{
                          backgroundColor: 'var(--accent-cyan)',
                          color: '#000000',
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        YOU
                      </span>
                    </div>
                  )}
                </div>

                {/* Sector Name */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: 'clamp(0.68rem, 1.4vw, 0.82rem)',
                      color: isCurrentRoom ? '#ffffff' : '#edf4fa',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {data.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {data.subtitle}
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {hasPendingTasks && (
                    <span
                      style={{
                        backgroundColor: 'rgba(255, 170, 0, 0.18)',
                        border: '1px solid rgba(255, 170, 0, 0.6)',
                        color: '#ffaa00',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        padding: '0 4px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      TASK ({pendingTasks.length})
                    </span>
                  )}

                  {isSabotaged && (
                    <span
                      style={{
                        backgroundColor: '#ff3366',
                        color: '#ffffff',
                        fontSize: '0.58rem',
                        fontWeight: 900,
                        padding: '0 4px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                        animation: 'pulse 1s infinite alternate',
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

        {/* Studio Diagnostics Footer */}
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={13} color="#00e676" />
              <span>HULL INTEGRITY: 100% NOMINAL</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="var(--accent-cyan)" />
              <span>ATMOSPHERE: 21% O2 // 78% N2</span>
            </span>
          </div>

          <div style={{ color: 'var(--text-muted)' }}>
            PRESS <kbd style={{ color: 'var(--accent-cyan)', background: 'rgba(0, 243, 255, 0.1)', padding: '1px 4px', borderRadius: '2px' }}>M</kbd> TO TOGGLE
          </div>
        </div>
      </div>
    </div>
  );
};
