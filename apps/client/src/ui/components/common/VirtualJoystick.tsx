import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext.js';
import { gameBridge } from '../../bridge/gameBridge.js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand, AlertOctagon, Skull } from 'lucide-react';

export const VirtualJoystick: React.FC = () => {
  const {
    roomState,
    role,
    isAlive,
    killCooldown,
    killableTargetId,
    reportableBodyId,
    nearbyInteractable,
    attemptKill,
    reportBody,
    openTaskModal,
    openSabotageRepairModal,
    callEmergencyMeeting,
    touchControlsEnabled,
  } = useGame();

  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  // Only show when in PLAYING state and touch controls enabled or on mobile touch device
  if (roomState !== 'PLAYING') return null;

  const activeKeys = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  const dispatchKey = (key: 'w' | 'a' | 's' | 'd', isDown: boolean) => {
    if (activeKeys.current[key] === isDown) return;
    activeKeys.current[key] = isDown;
    const eventType = isDown ? 'keydown' : 'keyup';
    window.dispatchEvent(new KeyboardEvent(eventType, { key, code: `Key${key.toUpperCase()}`, bubbles: true }));
  };

  const clearAllKeys = () => {
    dispatchKey('w', false);
    dispatchKey('a', false);
    dispatchKey('s', false);
    dispatchKey('d', false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        clearAllKeys();
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      clearAllKeys();
      return;
    }

    const clampedDist = Math.min(distance, maxRadius);
    const normX = dx / distance;
    const normY = dy / distance;

    setKnobPos({ x: normX * clampedDist, y: normY * clampedDist });

    // Thresholds for triggering directional keys
    const threshold = 0.25;
    dispatchKey('d', normX > threshold);
    dispatchKey('a', normX < -threshold);
    dispatchKey('s', normY > threshold);
    dispatchKey('w', normY < -threshold);
  };

  const handleActionUse = () => {
    if (!nearbyInteractable) return;
    if (nearbyInteractable.type === 'task') {
      openTaskModal({
        id: nearbyInteractable.id,
        taskId: nearbyInteractable.id,
        name: nearbyInteractable.name,
        type: nearbyInteractable.id.replace('task_', '') as any,
        description: 'Facility task',
        room: nearbyInteractable.room as any || 'central_junction',
        location: { x: 0, y: 0 },
        status: 'NOT_STARTED',
      });
    } else if (nearbyInteractable.type === 'sabotage_station') {
      openSabotageRepairModal(nearbyInteractable.details?.sabotageType as any || 'oxygen_depletion', nearbyInteractable.id);
    } else if (nearbyInteractable.type === 'emergency') {
      callEmergencyMeeting();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        pointerEvents: 'none',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 30px 20px 30px',
      }}
    >
      {/* Left Virtual Joystick Area */}
      <div
        ref={baseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'rgba(7, 17, 30, 0.65)',
          border: '2px solid rgba(0, 243, 255, 0.4)',
          position: 'relative',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '1px dashed rgba(0, 243, 255, 0.2)',
          }}
        />
        {/* Joystick Thumb Knob */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00f3ff 0%, #0077aa 100%)',
            border: '2px solid #ffffff',
            boxShadow: '0 0 15px rgba(0, 243, 255, 0.8)',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: activeTouchId === null ? 'transform 0.15s ease-out' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>

      {/* Right Quick Action Touch Cluster */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          pointerEvents: 'auto',
          alignItems: 'center',
        }}
      >
        {/* Report Button */}
        {reportableBodyId && (
          <button
            onClick={reportBody}
            className="btn-sub btn-warning"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertOctagon size={24} />
            <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>REPORT</span>
          </button>
        )}

        {/* Kill Button (Disruptor only) */}
        {role === 'DISRUPTOR' && isAlive && (
          <button
            onClick={attemptKill}
            disabled={killCooldown > 0 || !killableTargetId}
            className="btn-sub btn-danger"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Skull size={24} />
            <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>
              {killCooldown > 0 ? `${killCooldown}s` : 'KILL'}
            </span>
          </button>
        )}

        {/* Use / Interact Button */}
        <button
          onClick={handleActionUse}
          disabled={!nearbyInteractable}
          className="btn-sub"
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: nearbyInteractable ? 'var(--accent-cyan)' : 'var(--border-sub)',
            boxShadow: nearbyInteractable ? '0 0 20px rgba(0, 243, 255, 0.7)' : 'none',
          }}
        >
          <Hand size={26} />
          <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>USE</span>
        </button>
      </div>
    </div>
  );
};
