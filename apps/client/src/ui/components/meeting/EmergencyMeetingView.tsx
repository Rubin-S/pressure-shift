import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.js';
import { PLAYER_COLORS, PlayerPublicView } from '@pressure-shift/shared';
import {
  AlertTriangle,
  Clock,
  Check,
  Send,
  MessageSquare,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const EmergencyMeetingView: React.FC = () => {
  const {
    currentMeeting,
    players,
    localPlayerId,
    isAlive,
    hasVoted,
    castVote,
    skipVote,
    chatMessages,
    sendChat,
  } = useGame();

  const [chatInput, setChatInput] = useState<string>('');

  if (!currentMeeting) return null;

  const isDiscussion = currentMeeting.phase === 'DISCUSSION';
  const isVoting = currentMeeting.phase === 'VOTING';
  const timeLeft = currentMeeting.phaseTimeRemaining;

  const handleVotePlayer = (targetId: string) => {
    if (!isAlive || hasVoted || !isVoting) return;
    castVote(targetId);
  };

  const handleSkipVote = () => {
    if (!isAlive || hasVoted || !isVoting) return;
    skipVote();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 8, 16, 0.94)',
        backdropFilter: 'blur(10px)',
        zIndex: 2200,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
      }}
    >
      {/* Top Banner */}
      <div
        className="sub-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderLeft: '4px solid #ff3864',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <AlertTriangle size={32} color="#ff3864" />
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '1.4rem',
                color: '#ff3864',
                margin: 0,
                letterSpacing: '1px',
              }}
            >
              EMERGENCY ASSEMBLY DISPATCH
            </h1>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              {currentMeeting.triggerType === 'BODY_REPORTED'
                ? `CASUALTY REPORTED: ${currentMeeting.reportedVictimName || 'Crew member'} reported by ${currentMeeting.callerName}`
                : `EMERGENCY CONSOLE ACTIVATED BY: ${currentMeeting.callerName}`}
            </div>
          </div>
        </div>

        {/* Phase & Countdown Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(5, 14, 25, 0.8)',
            padding: '8px 18px',
            border: '1px solid var(--border-sub)',
            borderRadius: '4px',
          }}
        >
          <Clock size={22} color={isVoting ? 'var(--accent-amber)' : 'var(--accent-cyan)'} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.75rem',
                color: isVoting ? 'var(--accent-amber)' : 'var(--accent-cyan)',
              }}
            >
              {isDiscussion ? 'DISCUSSION PHASE' : 'VOTING ACTIVE'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.4rem',
                fontWeight: 900,
                color: '#fff',
              }}
            >
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Player Cards Grid (Left/Center) & Live Chat (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '20px',
          flexGrow: 1,
          minHeight: '400px',
        }}
      >
        {/* Player Roster Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            alignContent: 'start',
          }}
        >
          {players.map((p) => {
            const isMe = p.id === localPlayerId;
            const hasCast = currentMeeting.voters?.includes(p.id);
            const colorDef = (PLAYER_COLORS as any)[p.color] || { hex: '#00f3ff' };

            return (
              <div
                key={p.id}
                className="sub-panel"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: isMe ? '2px solid var(--accent-cyan)' : '1px solid var(--border-sub)',
                  backgroundColor: !p.isAlive ? 'rgba(15, 20, 30, 0.5)' : undefined,
                  opacity: !p.isAlive ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Player Color Swatch Avatar */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: colorDef.hex,
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: `0 0 10px ${colorDef.hex}88`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!p.isAlive && <span style={{ fontSize: '1.2rem' }}>👻</span>}
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: '0.95rem',
                        color: p.isAlive ? '#fff' : 'var(--text-muted)',
                        textDecoration: !p.isAlive ? 'line-through' : 'none',
                      }}
                    >
                      {p.name} {isMe && '(YOU)'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {!p.isAlive ? 'STATUS: ELIMINATED' : hasCast ? 'VOTE CONFIRMED' : 'DELIBERATING...'}
                    </div>
                  </div>
                </div>

                {/* Vote button or status indicator */}
                <div>
                  {hasCast && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#00e676',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <Check size={16} />
                      <span>VOTED</span>
                    </div>
                  )}

                  {isVoting && isAlive && !hasVoted && p.isAlive && !isMe && (
                    <button
                      onClick={() => handleVotePlayer(p.id)}
                      className="btn-sub btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      VOTE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Emergency Chat Panel */}
        <div
          className="sub-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'rgba(5, 14, 25, 0.95)',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-sub)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-header)',
              fontSize: '0.85rem',
              color: 'var(--accent-cyan)',
            }}
          >
            <MessageSquare size={16} />
            <span>DISPATCH INTERCOM CHAT</span>
          </div>

          {/* Chat Feed */}
          <div
            style={{
              flexGrow: 1,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '340px',
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  margin: 'auto 0',
                }}
              >
                No messages yet. Use intercom to share locations or suspicions.
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
                  <span style={{ color: msg.senderColor || 'var(--accent-cyan)', fontWeight: 700 }}>
                    {msg.senderName}:
                  </span>{' '}
                  <span style={{ color: '#e2f1f8' }}>{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick Chat Presets */}
          <div
            style={{
              padding: '8px 12px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px dashed var(--border-sub)',
            }}
          >
            {['Where?', 'I was doing tasks', 'Skip vote', 'Self report?'].map((preset) => (
              <button
                key={preset}
                onClick={() => sendChat(preset)}
                className="btn-sub"
                style={{ padding: '3px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              display: 'flex',
              borderTop: '1px solid var(--border-sub)',
              padding: '8px',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Transmit message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="input-sub"
              style={{ padding: '8px 10px', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-sub" style={{ padding: '8px 14px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Actions: Skip Vote & Status */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {hasVoted ? 'YOUR VOTE IS RECORDED' : isVoting ? 'SELECT A SUSPECT OR SKIP' : 'DISCUSSION IN PROGRESS'}
        </div>

        {isVoting && isAlive && !hasVoted && (
          <button
            onClick={handleSkipVote}
            className="btn-sub btn-warning"
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            SKIP VOTE
          </button>
        )}
      </div>
    </div>
  );
};
