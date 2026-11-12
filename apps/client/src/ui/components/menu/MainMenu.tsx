import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.js';
import { HeaderControls } from '../common/HeaderControls.js';
import { soundEngine } from '../../audio/soundEngine.js';
import {
  Play,
  LogIn,
  BookOpen,
  Settings,
  Shield,
  Skull,
  Radio,
  MapPin,
  X,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
} from 'lucide-react';

export const MainMenu: React.FC = () => {
  const {
    playerName,
    setPlayerName,
    playerColor,
    setPlayerColor,
    playerCosmetic,
    createRoom,
    joinRoom,
    soundMuted,
    toggleSound,
    crtShaderEnabled,
    toggleCrtShader,
    touchControlsEnabled,
    toggleTouchControls,
  } = useGame();

  const [joinCode, setJoinCode] = useState<string>('');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    soundEngine.playClick(800);
    try {
      await createRoom(playerName);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || isJoining) return;
    setIsJoining(true);
    soundEngine.playClick(750);
    try {
      await joinRoom(joinCode.trim(), playerName);
    } finally {
      setIsJoining(false);
    }
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Background Animated Ocean Bubbles */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: `${(i * 8.3) + 2}%`,
              width: `${8 + (i % 5) * 4}px`,
              height: `${8 + (i % 5) * 4}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 243, 255, 0.25)',
              boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)',
              animation: `bubbleFloat ${6 + (i % 4) * 2}s infinite linear`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Top Bar with Settings */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 50,
        }}
      >
        <HeaderControls />
      </div>

      {/* Main Container */}
      <div
        className="sub-panel"
        style={{
          width: '580px',
          maxWidth: '92vw',
          backgroundColor: 'rgba(7, 18, 32, 0.94)',
          border: '2px solid var(--border-sub)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 10,
        }}
      >
        {/* Title Logo */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '4px',
              marginBottom: '6px',
            }}
          >
            HAZARD DEPTH 8,400 METERS
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '2.6rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '4px',
              margin: 0,
              textShadow: '0 0 25px rgba(0, 243, 255, 0.6), 0 0 50px rgba(0, 243, 255, 0.3)',
            }}
          >
            PRESSURE SHIFT
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            Deep Ocean Multiplayer Social Deduction
          </div>
        </div>

        {/* Player Call-sign Name Input */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '1px',
            }}
          >
            OPERATOR CALLSIGN:
          </label>
          <input
            type="text"
            value={playerName}
            maxLength={16}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input-sub"
            placeholder="Enter crew callsign..."
          />
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Create Room Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !playerName.trim()}
            className="btn-sub"
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
          >
            <Play size={20} />
            <span>{isCreating ? 'CREATING FACILITY DOCK...' : 'CREATE NEW ROOM'}</span>
          </button>

          {/* Join Room Form */}
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="6-DIGIT ROOM CODE"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-sub"
              style={{
                textAlign: 'center',
                letterSpacing: '3px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            />
            <button
              type="submit"
              disabled={isJoining || joinCode.length < 4 || !playerName.trim()}
              className="btn-sub btn-success"
              style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
            >
              <LogIn size={18} />
              <span>JOIN</span>
            </button>
          </form>
        </div>

        {/* Secondary Navigation Options */}
        <div style={{ display: 'flex', gap: '14px', width: '100%', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setIsHowToPlayOpen(true);
              soundEngine.playClick(650);
            }}
            className="btn-sub"
            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
          >
            <BookOpen size={16} />
            <span>HOW TO PLAY</span>
          </button>

          <button
            onClick={() => {
              setIsSettingsOpen(true);
              soundEngine.playClick(650);
            }}
            className="btn-sub"
            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
          >
            <Settings size={16} />
            <span>SETTINGS</span>
          </button>
        </div>
      </div>

      {/* How to Play Modal */}
      {isHowToPlayOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(2, 6, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 3500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHowToPlayOpen(false);
          }}
        >
          <div
            className="sub-panel"
            style={{
              width: '640px',
              maxWidth: '94vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              backgroundColor: 'rgba(7, 18, 32, 0.98)',
              border: '2px solid var(--accent-cyan)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={22} color="var(--accent-cyan)" />
                <h2
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '1.25rem',
                    color: 'var(--accent-cyan)',
                    margin: 0,
                  }}
                >
                  HOW TO PLAY: PRESSURE SHIFT
                </h2>
              </div>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="btn-sub btn-danger"
                style={{ padding: '6px 10px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mission Lore Dossier */}
            <div
              style={{
                backgroundColor: 'rgba(5, 20, 38, 0.9)',
                border: '1px solid rgba(0, 243, 255, 0.4)',
                padding: '14px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                lineHeight: '1.6',
                color: '#b0d5ea',
              }}
            >
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
                MISSION DOSSIER: HADAL COMPLEX NADIR-7
              </div>
              <div>
                <strong>LOCATION:</strong> Challenger Deep Trench (8,540m depth | 85 MPa hydrostatic pressure).<br />
                <strong>THE ANOMALY:</strong> Deep core drilling awakened a self-resonating piezoelectric crystal. Its 4.17 Hz acoustic pulse induces acute paranoia and cognitive dissociation.<br />
                <strong>THE THREAT:</strong> Corporate saboteurs have infiltrated the habitat. Their directive: sever life support, trigger catastrophic decompression, and bury Nadir-7 in the trench forever.
              </div>
            </div>

            {/* Operator Briefing */}
            <div
              style={{
                backgroundColor: 'rgba(0, 243, 255, 0.08)',
                border: '1px solid var(--accent-cyan)',
                padding: '14px',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f3ff', fontWeight: 700 }}>
                <Shield size={18} />
                <span>OPERATORS (CREW)</span>
              </div>
              <ul
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  paddingLeft: '20px',
                }}
              >
                <li>Maintain the deep-sea facility by completing your assigned stations (8 mini-games).</li>
                <li>Quickly repair active sabotages (Oxygen scrubbers, Geothermal reactor, Communications).</li>
                <li>Report dead bodies or press the Central Junction Emergency Console to call an assembly.</li>
                <li>Discuss clues and vote out the disguised Disruptors to secure the habitat!</li>
              </ul>
            </div>

            {/* Disruptor Briefing */}
            <div
              style={{
                backgroundColor: 'rgba(255, 56, 100, 0.08)',
                border: '1px solid #ff3864',
                padding: '14px',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff3864', fontWeight: 700 }}>
                <Skull size={18} />
                <span>DISRUPTORS (IMPOSTORS)</span>
              </div>
              <ul
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  paddingLeft: '20px',
                }}
              >
                <li>Blend in with the crew and pretend to execute maintenance tasks.</li>
                <li>Eliminate isolated Operators when within range (watch your kill cooldown).</li>
                <li>Trigger tactical sabotages to split up crew or trigger a fatal 45-second collapse!</li>
                <li>Slip through the underwater ventilation ducts to navigate rooms undetected.</li>
              </ul>
            </div>

            {/* Controls Overview */}
            <div
              style={{
                backgroundColor: 'rgba(5, 14, 25, 0.85)',
                border: '1px solid var(--border-sub)',
                padding: '14px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                lineHeight: '1.6',
              }}
            >
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
                CONTROLS GUIDE:
              </div>
              <div>[W, A, S, D] or [ARROWS] - Move Operator</div>
              <div>[E] - Use / Interact with station consoles & emergency button</div>
              <div>[Q] - Eliminate target (Disruptor only)</div>
              <div>[R] - Report discovered casualty</div>
              <div>[S] - Open Tactical Sabotage Grid (Disruptor only)</div>
              <div>[M] - Toggle Facility Blueprint Map</div>
              <div>[ESC] - Close active task modal</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(2, 6, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 3500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSettingsOpen(false);
          }}
        >
          <div
            className="sub-panel"
            style={{
              width: '460px',
              maxWidth: '92vw',
              backgroundColor: 'rgba(7, 18, 32, 0.98)',
              border: '2px solid var(--accent-cyan)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={22} color="var(--accent-cyan)" />
                <h2
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '1.25rem',
                    color: 'var(--accent-cyan)',
                    margin: 0,
                  }}
                >
                  FACILITY SETTINGS
                </h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="btn-sub btn-danger"
                style={{ padding: '6px 10px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sound Toggle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(5, 14, 25, 0.85)',
                  padding: '12px 16px',
                  border: '1px solid var(--border-sub)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {soundMuted ? <VolumeX size={20} color="#ff3864" /> : <Volume2 size={20} color="#00f3ff" />}
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem', color: '#fff' }}>
                      SYNTHESIZER AUDIO
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sonar pings, alarms, clicks
                    </div>
                  </div>
                </div>
                <button onClick={toggleSound} className="btn-sub" style={{ padding: '6px 14px' }}>
                  {soundMuted ? 'UNMUTE' : 'MUTED'}
                </button>
              </div>

              {/* CRT Scanline Toggle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(5, 14, 25, 0.85)',
                  padding: '12px 16px',
                  border: '1px solid var(--border-sub)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={20} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem', color: '#fff' }}>
                      CRT SCANLINE SHADER
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Phosphor cathode ray effect
                    </div>
                  </div>
                </div>
                <button onClick={toggleCrtShader} className="btn-sub" style={{ padding: '6px 14px' }}>
                  {crtShaderEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Touch Controls Overlay Toggle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(5, 14, 25, 0.85)',
                  padding: '12px 16px',
                  border: '1px solid var(--border-sub)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Smartphone size={20} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-header)', fontSize: '0.9rem', color: '#fff' }}>
                      TOUCH CONTROLS OVERLAY
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      On-screen virtual joystick & D-pad
                    </div>
                  </div>
                </div>
                <button onClick={toggleTouchControls} className="btn-sub" style={{ padding: '6px 14px' }}>
                  {touchControlsEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
