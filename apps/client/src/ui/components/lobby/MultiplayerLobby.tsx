import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.js';
import { HeaderControls } from '../common/HeaderControls.js';
import {
  PLAYER_COLORS,
  PLAYER_COSMETICS,
  PlayerColorId,
  PlayerCosmeticId,
  GAMEPLAY_CONSTANTS,
} from '@pressure-shift/shared';
import {
  Users,
  Copy,
  Check,
  Crown,
  Play,
  LogOut,
  Sliders,
  Palette,
  HardHat,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

export const MultiplayerLobby: React.FC = () => {
  const {
    roomCode,
    players,
    localPlayerId,
    isHost,
    roomSettings,
    updateRoomSettings,
    playerColor,
    setPlayerColor,
    playerCosmetic,
    setPlayerCosmetic,
    leaveRoom,
    toggleReady,
    startGame,
    countdownRemaining,
    roomState,
  } = useGame();

  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'customize' | 'settings'>('roster');

  const me = players.find((p) => p.id === localPlayerId);
  const isReady = me?.isReady ?? false;
  const canStart = players.length >= 1; // Can test solo or multi

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    soundEngine.playClick(900);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleColorSelect = (colorKey: string) => {
    setPlayerColor(colorKey);
    soundEngine.playClick(750);
  };

  const handleCosmeticSelect = (cosmeticKey: string) => {
    setPlayerCosmetic(cosmeticKey);
    soundEngine.playClick(750);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#030810',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 30px',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-sub)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                letterSpacing: '2px',
              }}
            >
              SUB-SURFACE MULTIPLAYER DOCK
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '1.6rem',
                color: '#fff',
                margin: 0,
                letterSpacing: '2px',
              }}
            >
              HABITAT LOBBY
            </h1>
          </div>

          {/* Room Code Badge with Copy */}
          {roomCode && (
            <button
              onClick={handleCopyCode}
              className="btn-sub"
              style={{
                padding: '8px 16px',
                fontSize: '1rem',
                borderColor: copied ? '#00e676' : 'var(--accent-cyan)',
              }}
              title="Click to copy Room Code"
            >
              <span>ROOM CODE:</span>
              <span style={{ color: '#fff', fontWeight: 900, letterSpacing: '2px' }}>{roomCode}</span>
              {copied ? <Check size={18} color="#00e676" /> : <Copy size={16} />}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <HeaderControls />
          <button onClick={leaveRoom} className="btn-sub btn-danger" style={{ padding: '8px 16px' }}>
            <LogOut size={16} />
            <span>LEAVE</span>
          </button>
        </div>
      </div>

      {/* Countdown Alert Banner if game is starting */}
      {roomState === 'STARTING' && countdownRemaining !== null && (
        <div
          style={{
            backgroundColor: 'rgba(0, 243, 255, 0.15)',
            border: '2px solid var(--accent-cyan)',
            padding: '14px',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(0, 243, 255, 0.5)',
            animation: 'pulse 1s infinite alternate',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '1.3rem',
              color: '#00f3ff',
              letterSpacing: '2px',
            }}
          >
            DISPATCHING EXPEDITION CREW IN {countdownRemaining}s...
          </span>
        </div>
      )}

      {/* Main Grid: Left Tabs / Content & Right Host Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          flexGrow: 1,
        }}
      >
        {/* Left Column: Navigation Tabs & Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('roster')}
              className="btn-sub"
              style={{
                borderColor: activeTab === 'roster' ? 'var(--accent-cyan)' : 'var(--border-sub)',
                backgroundColor: activeTab === 'roster' ? 'rgba(0, 243, 255, 0.15)' : undefined,
              }}
            >
              <Users size={16} />
              <span>CREW ROSTER ({players.length}/{GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM})</span>
            </button>

            <button
              onClick={() => setActiveTab('customize')}
              className="btn-sub"
              style={{
                borderColor: activeTab === 'customize' ? 'var(--accent-cyan)' : 'var(--border-sub)',
                backgroundColor: activeTab === 'customize' ? 'rgba(0, 243, 255, 0.15)' : undefined,
              }}
            >
              <Palette size={16} />
              <span>DIVING SUIT & GEAR</span>
            </button>
          </div>

          {/* Tab 1: Crew Roster */}
          {activeTab === 'roster' && (
            <div
              className="sub-panel"
              style={{
                flexGrow: 1,
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px',
                alignContent: 'start',
              }}
            >
              {players.map((p) => {
                const colorDef = (PLAYER_COLORS as any)[p.color] || { hex: '#00f3ff', name: 'Cyan' };
                const cosmeticDef = (PLAYER_COSMETICS as any)[p.cosmetic] || { name: 'Standard Helm' };
                const isCurrent = p.id === localPlayerId;

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: 'rgba(5, 14, 25, 0.85)',
                      border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : 'var(--border-sub)'}`,
                      borderRadius: '4px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isCurrent ? '0 0 12px rgba(0, 243, 255, 0.2)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Avatar preview */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          backgroundColor: colorDef.hex,
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: `0 0 12px ${colorDef.hex}66`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <HardHat size={22} color="#fff" />
                      </div>

                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-header)',
                            fontSize: '0.95rem',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{p.name}</span>
                          {p.isHost && (
                            <span title="Room Host" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <Crown size={14} color="#ffd700" />
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {colorDef.name} • {cosmeticDef.name}
                        </div>
                      </div>
                    </div>

                    {/* Ready Badge */}
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: p.isReady ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 56, 100, 0.15)',
                        border: `1px solid ${p.isReady ? '#00e676' : '#ff3864'}`,
                        color: p.isReady ? '#00e676' : '#ff3864',
                      }}
                    >
                      {p.isReady ? 'READY' : 'WAITING'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Customization (Colors & Cosmetics) */}
          {activeTab === 'customize' && (
            <div
              className="sub-panel"
              style={{
                flexGrow: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* Color Swatches Grid */}
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.95rem',
                    color: 'var(--accent-cyan)',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                  }}
                >
                  PRESSURE SUIT COATING:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {Object.entries(PLAYER_COLORS).map(([cKey, cVal]) => {
                    const isSelected = playerColor === cKey;
                    return (
                      <button
                        key={cKey}
                        onClick={() => handleColorSelect(cKey)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 6px',
                          background: isSelected ? 'rgba(0, 243, 255, 0.2)' : 'rgba(5, 14, 25, 0.7)',
                          border: `2px solid ${isSelected ? '#ffffff' : 'var(--border-sub)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: cVal.hex,
                            boxShadow: `0 0 10px ${cVal.hex}`,
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#fff' }}>
                          {cVal.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diving Helm / Cosmetic Selection */}
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.95rem',
                    color: 'var(--accent-cyan)',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                  }}
                >
                  PRESSURE HELM & HEADGEAR:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.entries(PLAYER_COSMETICS).map(([hKey, hVal]) => {
                    const isSelected = playerCosmetic === hKey;
                    return (
                      <button
                        key={hKey}
                        onClick={() => handleCosmeticSelect(hKey)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          background: isSelected ? 'rgba(0, 243, 255, 0.18)' : 'rgba(5, 14, 25, 0.7)',
                          border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-sub)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <HardHat size={20} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.82rem', color: '#fff' }}>
                            {hVal.name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {hVal.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Host Game Rules / Match Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="sub-panel"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--accent-cyan)" />
              <span
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '1rem',
                  color: 'var(--accent-cyan)',
                  letterSpacing: '1px',
                }}
              >
                MISSION SETTINGS
              </span>
            </div>

            {/* Disruptor Count */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                <span>DISRUPTORS:</span>
                <span style={{ color: '#ff3864', fontWeight: 700 }}>{roomSettings.numDisruptors}</span>
              </div>
              {isHost ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateRoomSettings({ numDisruptors: num })}
                      className="btn-sub"
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderColor: roomSettings.numDisruptors === num ? '#ff3864' : 'var(--border-sub)',
                        backgroundColor: roomSettings.numDisruptors === num ? 'rgba(255, 56, 100, 0.2)' : undefined,
                      }}
                    >
                      {num} {num === 1 ? 'Disruptor' : 'Disruptors'}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Kill Cooldown */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                <span>KILL COOLDOWN:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{roomSettings.killCooldown}s</span>
              </div>
              {isHost && (
                <input
                  type="range"
                  min={15}
                  max={45}
                  step={5}
                  value={roomSettings.killCooldown}
                  onChange={(e) => updateRoomSettings({ killCooldown: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              )}
            </div>

            {/* Discussion & Voting Times */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                <span>DISCUSSION / VOTING:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  {roomSettings.discussionTime}s / {roomSettings.votingTime}s
                </span>
              </div>
            </div>

            {/* Tasks per Operator */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                <span>TASKS PER OPERATOR:</span>
                <span style={{ color: '#00e676' }}>{roomSettings.operatorTaskCount}</span>
              </div>
              {isHost && (
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={roomSettings.operatorTaskCount}
                  onChange={(e) => updateRoomSettings({ operatorTaskCount: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#00e676' }}
                />
              )}
            </div>

            {/* Confirm Ejects */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderTop: '1px dashed var(--border-sub)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                CONFIRM EJECTS:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: roomSettings.confirmEjects ? '#00e676' : '#ff3864' }}>
                {roomSettings.confirmEjects ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>

          {/* Player Ready & Host Start Match Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Ready Toggle */}
            <button
              onClick={toggleReady}
              className={`btn-sub ${isReady ? 'btn-success' : ''}`}
              style={{ padding: '14px', fontSize: '1rem' }}
            >
              <Check size={18} />
              <span>{isReady ? 'READY (CLICK TO UNREADY)' : 'SET READY'}</span>
            </button>

            {/* Host Start Game Button */}
            {isHost && (
              <button
                onClick={startGame}
                disabled={!canStart || roomState === 'STARTING'}
                className="btn-sub"
                style={{
                  padding: '16px',
                  fontSize: '1.05rem',
                  backgroundColor: 'rgba(0, 243, 255, 0.2)',
                  borderColor: 'var(--accent-cyan)',
                  boxShadow: '0 0 15px rgba(0, 243, 255, 0.4)',
                }}
              >
                <Play size={20} />
                <span>START EXPEDITION</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
