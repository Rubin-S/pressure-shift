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

  const completedCount = assignedTasks.filter((t) => t.status === 'COMPLETED').length;

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
          top: 'env(safe-area-inset-top, 10px)',
          left: 'max(14px, env(safe-area-inset-left, 14px))',
          right: 'max(14px, env(safe-area-inset-right, 14px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(8px, 1.5vw, 18px)',
          pointerEvents: 'auto',
        }}
      >
        {/* Left: Facility Overall Objective Progress */}
        <div
          className="sub-panel"
          style={{
            width: 'clamp(180px, 24vw, 300px)',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.65rem, 1vw, 0.75rem)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              STATION PROGRESS
            </span>
            <span style={{ color: '#00e676', fontWeight: 700 }}>
              {Math.round(taskMeter.progressPercent)}%
            </span>
          </div>

          <div className="progress-rail" style={{ height: '7px' }}>
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
            padding: '6px clamp(12px, 2vw, 22px)',
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
              gap: '6px',
              fontFamily: 'var(--font-header)',
              fontSize: 'clamp(0.78rem, 1.3vw, 0.92rem)',
              color: '#ffffff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Compass size={14} color="var(--accent-cyan)" />
            <span>NADIR-7 // {currentRoomName.replace('_', ' ')}</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.62rem, 1vw, 0.7rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: role === 'DISRUPTOR' ? '#ff3366' : 'var(--accent-cyan)',
              marginTop: '1px',
            }}
          >
            {role} {!isAlive && '• GHOST'}
          </div>
        </div>

        {/* Right: Map Shortcut & System Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMinimap}
            className="btn-sub"
            style={{ padding: '6px 12px', fontSize: 'clamp(0.72rem, 1vw, 0.8rem)' }}
            title="Toggle Facility Blueprint [M]"
          >
            <Map size={14} />
            <span>MAP</span>
          </button>
          <HeaderControls />
        </div>
      </div>

      {/* Left Objectives Checklist Drawer */}
      <div
        className="sub-panel"
        style={{
          position: 'absolute',
          top: 'clamp(62px, 11vh, 76px)',
          left: 'max(14px, env(safe-area-inset-left, 14px))',
          width: 'clamp(210px, 25vw, 270px)',
          maxHeight: 'calc(100vh - 180px)',
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
            padding: '8px 12px',
            backgroundColor: 'rgba(5, 12, 22, 0.85)',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.78rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.06em',
            }}
          >
            DIRECTIVES ({completedCount}/{assignedTasks.length})
          </span>
          {isTasksOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>

        {isTasksOpen && (
          <div
            style={{
              padding: '8px 12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {assignedTasks.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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
                      gap: '8px',
                      cursor: isDone ? 'default' : 'pointer',
                      opacity: isDone ? 0.45 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {isDone ? (
                        <CheckSquare2 size={14} color="#00e676" />
                      ) : (
                        <Square size={14} color="var(--accent-cyan)" />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.78rem',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          lineHeight: '1.2',
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
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
          bottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
          right: 'max(18px, env(safe-area-inset-right, 18px))',
          display: 'flex',
          gap: 'clamp(10px, 1.5vw, 16px)',
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
              width: 'clamp(70px, 10vw, 84px)',
              height: 'clamp(70px, 10vw, 84px)',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 170, 0, 0.6)',
              animation: 'pulse 1.2s infinite alternate',
            }}
          >
            <AlertOctagon size={24} />
            <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>REPORT [R]</span>
          </button>
        )}

        {/* Disruptor Sabotage Button with Circular Cooldown */}
        {role === 'DISRUPTOR' && isAlive && (
          <button
            onClick={toggleSabotageMenu}
            disabled={sabotageCooldown > 0}
            className="btn-sub btn-danger"
            style={{
              width: 'clamp(70px, 10vw, 84px)',
              height: 'clamp(70px, 10vw, 84px)',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: sabotageCooldown === 0 ? '0 0 16px rgba(255, 51, 102, 0.4)' : 'none',
            }}
          >
            <Flame size={24} />
            <span style={{ fontSize: '0.62rem', marginTop: '2px' }}>
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
              width: 'clamp(76px, 11vw, 90px)',
              height: 'clamp(76px, 11vw, 90px)',
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
            <Skull size={28} />
            <span style={{ fontSize: '0.66rem', marginTop: '2px' }}>
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
            width: 'clamp(82px, 12vw, 96px)',
            height: 'clamp(82px, 12vw, 96px)',
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
          <Hand size={28} />
          <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>USE [E]</span>
        </button>
      </div>
    </div>
  );
};
