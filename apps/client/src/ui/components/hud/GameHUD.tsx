import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { HeaderControls } from '../common/HeaderControls.js';
import { SabotageBanner } from './SabotageBanner.js';
import {
  CheckSquare2,
  Square,
  Map,
  Skull,
  AlertOctagon,
  Hand,
  Flame,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';

export const GameHUD: React.FC = () => {
  const {
    taskMeter,
    assignedTasks,
    currentRoomName,
    role,
    isAlive,
    killCooldown,
    sabotageCooldown,
    roomSettings,
    killableTargetId,
    reportableBodyId,
    nearbyInteractable,
    toggleMinimap,
    toggleSabotageMenu,
    openTaskModal,
    openSabotageRepairModal,
    callEmergencyMeeting,
    attemptKill,
    reportBody,
  } = useGame();

  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(true);

  // Keyboard shortcuts [E], [Q], [R], [S]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'e' || e.key === 'E') {
        handleUseInteract();
      } else if (e.key === 'q' || e.key === 'Q') {
        if (role === 'DISRUPTOR' && isAlive && killCooldown === 0 && killableTargetId) {
          attemptKill();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (reportableBodyId) {
          reportBody();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (role === 'DISRUPTOR' && isAlive) {
          toggleSabotageMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, isAlive, killCooldown, killableTargetId, reportableBodyId, nearbyInteractable]);

  const handleUseInteract = () => {
    if (!nearbyInteractable) return;
    if (nearbyInteractable.type === 'task') {
      const task = assignedTasks.find((t) => t.taskId === nearbyInteractable.id);
      if (task) {
        openTaskModal(task);
      } else {
        openTaskModal({
          id: nearbyInteractable.id,
          taskId: nearbyInteractable.id,
          name: nearbyInteractable.name,
          type: nearbyInteractable.id.replace('task_', '') as any,
          description: 'Station Task',
          room: (nearbyInteractable.room as any) || 'central_junction',
          location: { x: 0, y: 0 },
          status: 'NOT_STARTED',
        });
      }
    } else if (nearbyInteractable.type === 'sabotage_station') {
      openSabotageRepairModal(
        (nearbyInteractable.details?.sabotageType as any) || 'oxygen_depletion',
        nearbyInteractable.id
      );
    } else if (nearbyInteractable.type === 'emergency') {
      callEmergencyMeeting();
    }
  };

  const maxKillCd = roomSettings.killCooldown || 25;
  const killCdPercent = Math.max(0, Math.min(1, killCooldown / maxKillCd));

  const maxSabotageCd = 30;
  const sabotageCdPercent = Math.max(0, Math.min(1, sabotageCooldown / maxSabotageCd));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Critical Sabotage Emergency Warning Banner */}
      <SabotageBanner />

      {/* Top Precision Bar */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          pointerEvents: 'auto',
        }}
      >
        {/* Left: Facility Overall Objective Progress */}
        <div
          className="sub-panel"
          style={{
            width: '320px',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              STATION OBJECTIVE METER
            </span>
            <span style={{ color: '#00e676', fontWeight: 700 }}>
              {Math.round(taskMeter.progressPercent)}%
            </span>
          </div>

          <div className="progress-rail" style={{ height: '8px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${taskMeter.progressPercent}%`,
                background: 'linear-gradient(90deg, #0099aa 0%, #00e676 100%)',
              }}
            />
          </div>
        </div>

        {/* Center: Sector Breadcrumb & Role Pill */}
        <div
          className="sub-panel"
          style={{
            padding: '8px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderTop: '2px solid var(--accent-cyan)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-header)',
              fontSize: '0.92rem',
              color: '#ffffff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <Compass size={15} color="var(--accent-cyan)" />
            <span>NADIR-7 // {currentRoomName.replace('_', ' ')}</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: role === 'DISRUPTOR' ? '#ff3366' : 'var(--accent-cyan)',
              marginTop: '2px',
            }}
          >
            CLEARANCE: {role} {!isAlive && '• SPECTATOR GHOST'}
          </div>
        </div>

        {/* Right: Map Shortcut & System Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleMinimap}
            className="btn-sub"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            title="Toggle Facility Blueprint [M]"
          >
            <Map size={15} />
            <span>MAP [M]</span>
          </button>
          <HeaderControls />
        </div>
      </div>

      {/* Left Objectives Checklist Drawer */}
      <div
        className="sub-panel"
        style={{
          position: 'absolute',
          top: '78px',
          left: '24px',
          width: '280px',
          maxHeight: 'calc(100vh - 220px)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => setIsTasksOpen(!isTasksOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'rgba(5, 12, 22, 0.85)',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.82rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.06em',
            }}
          >
            DIRECTIVE PROTOCOLS
          </span>
          {isTasksOpen ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </div>

        {isTasksOpen && (
          <div
            style={{
              padding: '10px 14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {assignedTasks.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No active directives assigned.
              </div>
            ) : (
              assignedTasks.map((t) => {
                const isDone = t.status === 'COMPLETED';
                return (
                  <div
                    key={t.taskId}
                    onClick={() => !isDone && openTaskModal(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '9px',
                      cursor: isDone ? 'default' : 'pointer',
                      opacity: isDone ? 0.45 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {isDone ? (
                        <CheckSquare2 size={15} color="#00e676" />
                      ) : (
                        <Square size={15} color="var(--accent-cyan)" />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.82rem',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {t.room.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Right Studio Circular Action Cluster */}
      <div
        style={{
          position: 'absolute',
          bottom: '26px',
          right: '26px',
          display: 'flex',
          gap: '16px',
          pointerEvents: 'auto',
          alignItems: 'center',
        }}
      >
        {/* Report Casualty Button */}
        {reportableBodyId && (
          <button
            onClick={reportBody}
            className="btn-sub btn-warning"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 170, 0, 0.6)',
              animation: 'pulse 1.2s infinite alternate',
            }}
          >
            <AlertOctagon size={28} />
            <span style={{ fontSize: '0.68rem', marginTop: '2px' }}>REPORT [R]</span>
          </button>
        )}

        {/* Disruptor Sabotage Button with Circular Cooldown */}
        {role === 'DISRUPTOR' && isAlive && (
          <button
            onClick={toggleSabotageMenu}
            disabled={sabotageCooldown > 0}
            className="btn-sub btn-danger"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: sabotageCooldown === 0 ? '0 0 16px rgba(255, 51, 102, 0.4)' : 'none',
            }}
          >
            <Flame size={26} />
            <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
              {sabotageCooldown > 0 ? `${sabotageCooldown}s` : 'SABOTAGE [S]'}
            </span>
          </button>
        )}

        {/* Disruptor Kill Button with Radial Cooldown */}
        {role === 'DISRUPTOR' && isAlive && (
          <button
            onClick={attemptKill}
            disabled={killCooldown > 0 || !killableTargetId}
            className="btn-sub btn-danger"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                killCooldown === 0 && killableTargetId
                  ? '0 0 24px rgba(255, 51, 102, 0.8)'
                  : 'none',
            }}
          >
            <Skull size={30} />
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>
              {killCooldown > 0 ? `${killCooldown}s` : 'KILL [Q]'}
            </span>
          </button>
        )}

        {/* Use / Interact Action Button */}
        <button
          onClick={handleUseInteract}
          disabled={!nearbyInteractable}
          className="btn-sub"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${nearbyInteractable ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
            boxShadow: nearbyInteractable ? '0 0 24px var(--accent-cyan-glow)' : 'none',
            backgroundColor: nearbyInteractable ? 'rgba(0, 243, 255, 0.16)' : undefined,
          }}
        >
          <Hand size={32} />
          <span style={{ fontSize: '0.74rem', marginTop: '2px' }}>USE [E]</span>
        </button>
      </div>
    </div>
  );
};
