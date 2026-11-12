import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { Volume2, VolumeX, Monitor, Activity, Radio } from 'lucide-react';

export const HeaderControls: React.FC = () => {
  const {
    soundMuted,
    toggleSound,
    crtShaderEnabled,
    toggleCrtShader,
    connectionStatus,
    latency,
    roomCode,
  } = useGame();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00e676';
      case 'connecting':
      case 'reconnecting':
        return '#ffaa00';
      default:
        return '#ff3864';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
      }}
    >
      {/* Room code display */}
      {roomCode && (
        <div
          style={{
            background: 'rgba(5, 14, 25, 0.75)',
            border: '1px solid var(--border-sub)',
            padding: '4px 10px',
            color: 'var(--accent-cyan)',
            letterSpacing: '2px',
            fontWeight: 700,
          }}
        >
          ROOM: {roomCode}
        </div>
      )}

      {/* Latency & Connection Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(5, 14, 25, 0.75)',
          border: '1px solid var(--border-sub)',
          padding: '4px 8px',
          color: 'var(--text-muted)',
        }}
        title={`Connection: ${connectionStatus}`}
      >
        <Radio size={14} color={getStatusColor()} />
        <span style={{ color: getStatusColor(), textTransform: 'uppercase' }}>
          {connectionStatus}
        </span>
        {connectionStatus === 'connected' && (
          <span style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>
            {latency > 0 ? `${latency}ms` : '<10ms'}
          </span>
        )}
      </div>

      {/* Audio Toggle */}
      <button
        onClick={toggleSound}
        className="btn-sub"
        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
        title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
      >
        {soundMuted ? <VolumeX size={15} color="#ff3864" /> : <Volume2 size={15} color="#00f3ff" />}
      </button>

      {/* CRT Scanline Toggle */}
      <button
        onClick={toggleCrtShader}
        className="btn-sub"
        style={{
          padding: '6px 10px',
          fontSize: '0.8rem',
          borderColor: crtShaderEnabled ? 'var(--accent-cyan)' : 'var(--border-sub)',
        }}
        title={crtShaderEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
      >
        <Monitor size={15} color={crtShaderEnabled ? '#00f3ff' : 'var(--text-muted)'} />
        <span>CRT</span>
      </button>
    </div>
  );
};
