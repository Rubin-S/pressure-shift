import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { Trophy, Skull, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { GameOverReason } from '@pressure-shift/shared';

const REASON_MESSAGES: Record<GameOverReason, string> = {
  ALL_DISRUPTORS_EJECTED: 'All Disruptors were identified and ejected into the abyss.',
  TASKS_COMPLETED: 'The Operators completed all facility maintenance tasks.',
  DISRUPTORS_EQUAL_OR_OUTNUMBER: 'Disruptors eliminated enough Operators to seize facility control.',
  CRITICAL_SABOTAGE_COLLAPSE: 'A critical system meltdown collapsed facility life support.',
  OPERATORS_DISCONNECTED: 'All Operators abandoned the facility.',
};

export const GameOverView: React.FC = () => {
  const {
    roomState,
    gameOverSummary,
    role,
    returnToLobby,
    isHost,
    roomCode,
  } = useGame();

  if (roomState !== 'GAME_OVER' || !gameOverSummary) return null;

  const isOperatorWin = gameOverSummary.winner === 'OPERATORS';
  const playerWon =
    (isOperatorWin && role === 'OPERATOR') ||
    (!isOperatorWin && role === 'DISRUPTOR');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(2, 6, 12, 0.96)',
        backdropFilter: 'blur(12px)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '740px',
          maxWidth: '95vw',
          backgroundColor: 'rgba(6, 16, 28, 0.98)',
          border: `2px solid ${isOperatorWin ? '#00f3ff' : '#ff3864'}`,
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '26px',
          boxShadow: `0 0 60px rgba(0, 0, 0, 0.9), 0 0 35px ${
            isOperatorWin ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 56, 100, 0.3)'
          }`,
        }}
      >
        {/* Victory / Defeat Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {isOperatorWin ? (
            <Trophy size={60} color="#00f3ff" style={{ filter: 'drop-shadow(0 0 15px #00f3ff)' }} />
          ) : (
            <Skull size={60} color="#ff3864" style={{ filter: 'drop-shadow(0 0 15px #ff3864)' }} />
          )}

          <h1
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '2.4rem',
              color: isOperatorWin ? '#00f3ff' : '#ff3864',
              letterSpacing: '3px',
              margin: 0,
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${isOperatorWin ? 'rgba(0, 243, 255, 0.6)' : 'rgba(255, 56, 100, 0.6)'}`,
            }}
          >
            {isOperatorWin ? 'OPERATOR VICTORY' : 'DISRUPTOR VICTORY'}
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '1.2rem',
              color: playerWon ? '#00e676' : 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {playerWon ? 'VICTORY' : 'DEFEAT'}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              maxWidth: '520px',
              marginTop: '6px',
            }}
          >
            {REASON_MESSAGES[gameOverSummary.reason] || gameOverSummary.reason}
          </div>
        </div>

        {/* Full Role Reveal Roster */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              letterSpacing: '1px',
              textAlign: 'left',
            }}
          >
            CREW DOSSIER ROLE REVEAL:
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {gameOverSummary.allPlayers.map((p) => {
              const isDisruptor = p.role === 'DISRUPTOR';
              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'rgba(5, 14, 25, 0.85)',
                    border: `1px solid ${isDisruptor ? '#ff3864' : 'var(--accent-cyan)'}`,
                    padding: '10px 14px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    boxShadow: isDisruptor ? '0 0 10px rgba(255, 56, 100, 0.2)' : undefined,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.9rem',
                      color: '#fff',
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: isDisruptor ? '#ff3864' : 'var(--accent-cyan)',
                      fontWeight: 700,
                      marginTop: '4px',
                    }}
                  >
                    {p.role} {!p.isAlive && '(ELIMINATED)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return to Lobby Button */}
        <button
          onClick={returnToLobby}
          className="btn-sub"
          style={{
            padding: '12px 36px',
            fontSize: '1rem',
            letterSpacing: '2px',
          }}
        >
          <RotateCcw size={18} />
          <span>RETURN TO LOBBY</span>
        </button>
      </div>
    </div>
  );
};
