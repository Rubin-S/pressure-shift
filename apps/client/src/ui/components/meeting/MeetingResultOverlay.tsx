import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { AlertCircle, Waves, UserX } from 'lucide-react';

export const MeetingResultOverlay: React.FC = () => {
  const { roomState, lastMeetingResult, players } = useGame();

  if (roomState !== 'VOTING_RESULTS' || !lastMeetingResult) return null;

  const {
    ejectedPlayerId,
    ejectedPlayerName,
    wasDisruptor,
    remainingDisruptors,
    isTie,
    isSkip,
    voteCounts,
    voterDetails,
  } = lastMeetingResult;

  const ejectedPlayer = ejectedPlayerId ? players.find((p) => p.id === ejectedPlayerId) : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(2, 6, 12, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 2300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '680px',
          maxWidth: '94vw',
          backgroundColor: 'rgba(5, 14, 25, 0.98)',
          border: '2px solid var(--accent-cyan)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 243, 255, 0.25)',
        }}
      >
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserX size={32} color={ejectedPlayerId ? '#ff3864' : 'var(--accent-cyan)'} />
          <h2
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '1.6rem',
              color: ejectedPlayerId ? '#ff3864' : 'var(--accent-cyan)',
              letterSpacing: '2px',
              margin: 0,
            }}
          >
            VOTE DISPATCH VERDICT
          </h2>
        </div>

        {/* Ejection Animation / Graphic */}
        {ejectedPlayerId ? (
          <div
            style={{
              width: '100%',
              padding: '24px',
              backgroundColor: 'rgba(255, 56, 100, 0.1)',
              border: '1px solid #ff3864',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '1.8rem',
                color: '#fff',
                marginBottom: '10px',
                letterSpacing: '1px',
              }}
            >
              {ejectedPlayerName || ejectedPlayer?.name} was ejected into the abyss.
            </div>

            {wasDisruptor !== undefined && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  color: wasDisruptor ? '#ff3864' : '#00f3ff',
                  fontWeight: 700,
                  marginTop: '6px',
                }}
              >
                {wasDisruptor
                  ? 'THEY WERE A DISRUPTOR.'
                  : 'THEY WERE NOT A DISRUPTOR.'}
              </div>
            )}

            {remainingDisruptors !== undefined && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                }}
              >
                {remainingDisruptors} Disruptor(s) remain lurking in the facility.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              padding: '24px',
              backgroundColor: 'rgba(0, 243, 255, 0.08)',
              border: '1px solid var(--border-sub)',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: '1.6rem',
                color: 'var(--accent-cyan)',
                marginBottom: '10px',
              }}
            >
              {isTie ? 'Tie vote. No one was ejected.' : 'Voting was skipped. No one was ejected.'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
              }}
            >
              The crew remains intact. Return to stations.
            </div>
          </div>
        )}

        {/* Vote Counts Summary */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              letterSpacing: '1px',
              textAlign: 'left',
            }}
          >
            BALLOT RESULTS:
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {Object.entries(voteCounts).map(([targetId, count]) => {
              const targetName =
                targetId === 'SKIP'
                  ? 'SKIPPED'
                  : players.find((p) => p.id === targetId)?.name || 'Unknown';
              return (
                <div
                  key={targetId}
                  style={{
                    backgroundColor: 'rgba(8, 20, 34, 0.8)',
                    border: '1px solid var(--border-sub)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: '#fff' }}>{targetName}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {count} {count === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Resuming facility operations shortly...
        </div>
      </div>
    </div>
  );
};
