import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { HeaderControls } from '../common/HeaderControls.js';
import { SabotageBanner } from './SabotageBanner.js';
import {
  CheckSquare,
  Square,
  Map,
  Skull,
  AlertOctagon,
  Hand,
  Flame,
  ChevronDown,
  ChevronUp,
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
      // Don't trigger if typing in an input
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
          description: 'Facility Station Task',
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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      {/* Critical Sabotage Alert Banner */}
      <SabotageBanner />

      {/* Top Bar: Task Meter & Room Header & Controls */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          pointerEvents: 'auto',
        }}
      >
        {/* Left: Overall Task Meter */}
        <div
          className="sub-panel"
          style={{
            width: '320px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
            }}
          >
            <span>TOTAL FACILITY TASKS:</span>
            <span>{Math.round(taskMeter.progressPercent)}%</span>
          </div>
          <div className="progress-rail" style={{ height: '14px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${taskMeter.progressPercent}%`,
                background: 'linear-gradient(90deg, #0099aa 0%, #00e676 100%)',
              }}
            />
          </div>
        </div>

        {/* Center: Current Room Location Readout */}
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
          <span
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '1rem',
              color: '#fff',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {currentRoomName.replace('_', ' ')}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: role === 'DISRUPTOR' ? '#ff3864' : 'var(--accent-cyan)',
              fontWeight: 700,
            }}
          >
            ROLE: {role} {!isAlive && '(SPECTATOR GHOST)'}
          </span>
        </div>

        {/* Right: Map Button & Header Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleMinimap}
            className="btn-sub"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Toggle Map [M]"
          >
            <Map size={16} />
            <span>MAP [M]</span>
          </button>
          <HeaderControls />
        </div>
      </div>

      {/* Left Assigned Tasks Checklist Box */}
      <div
        className="sub-panel"
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
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
            backgroundColor: 'rgba(5, 14, 25, 0.85)',
            borderBottom: '1px solid var(--border-sub)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.85rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '1px',
            }}
          >
            ASSIGNED OBJECTIVES
          </span>
          {isTasksOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No active tasks assigned.
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
                      opacity: isDone ? 0.5 : 1,
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {isDone ? <CheckSquare size={14} color="#00e676" /> : <Square size={14} color="var(--accent-cyan)" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.82rem',
                          color: isDone ? '#7e9bb0' : '#e2f1f8',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        [{t.room.replace('_', ' ')}]
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Right Action Buttons Cluster */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          gap: '14px',
          pointerEvents: 'auto',
          alignItems: 'center',
        }}
      >
        {/* Report Body Button */}
        {reportableBodyId && (
          <button
            onClick={reportBody}
            className="btn-sub btn-warning"
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 170, 0, 0.8)',
              animation: 'pulse 1s infinite alternate',
            }}
          >
            <AlertOctagon size={28} />
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>REPORT [R]</span>
          </button>
        )}

        {/* Disruptor Sabotage Button */}
        {role === 'DISRUPTOR' && isAlive && (
          <button
            onClick={toggleSabotageMenu}
            disabled={sabotageCooldown > 0}
            className="btn-sub btn-danger"
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: sabotageCooldown === 0 ? '0 0 15px rgba(255, 56, 100, 0.5)' : 'none',
            }}
          >
            <Flame size={28} />
            <span style={{ fontSize: '0.68rem', marginTop: '2px' }}>
              {sabotageCooldown > 0 ? `${sabotageCooldown}s` : 'SABOTAGE [S]'}
            </span>
          </button>
        )}

        {/* Disruptor Kill Button */}
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
                  ? '0 0 25px rgba(255, 56, 100, 0.9)'
                  : 'none',
            }}
          >
            <Skull size={32} />
            <span style={{ fontSize: '0.72rem', marginTop: '2px' }}>
              {killCooldown > 0 ? `${killCooldown}s` : 'KILL [Q]'}
            </span>
          </button>
        )}

        {/* Use / Interact Button */}
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
            border: `2px solid ${nearbyInteractable ? 'var(--accent-cyan)' : 'var(--border-sub)'}`,
            boxShadow: nearbyInteractable ? '0 0 25px rgba(0, 243, 255, 0.7)' : 'none',
            backgroundColor: nearbyInteractable ? 'rgba(0, 243, 255, 0.15)' : undefined,
          }}
        >
          <Hand size={32} />
          <span style={{ fontSize: '0.75rem', marginTop: '3px' }}>USE [E]</span>
        </button>
      </div>
    </div>
  );
};
