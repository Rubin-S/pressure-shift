import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { X, Wrench } from 'lucide-react';

interface TaskModalContainerProps {
  title: string;
  description: string;
  roomName: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const TaskModalContainer: React.FC<TaskModalContainerProps> = ({
  title,
  description,
  roomName,
  onClose,
  children,
}) => {
  // ESC key listener to close task modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(2, 6, 12, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sub-panel"
        style={{
          width: '680px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(8, 20, 34, 0.96)',
          border: '2px solid var(--accent-cyan-dim)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 243, 255, 0.25)',
          animation: 'modalZoom 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-sub)',
            backgroundColor: 'rgba(5, 14, 25, 0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={20} color="var(--accent-cyan)" />
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '1.15rem',
                  color: 'var(--accent-cyan)',
                  letterSpacing: '1px',
                  margin: 0,
                }}
              >
                {title.toUpperCase()}
              </h2>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                LOCATION: {roomName.replace('_', ' ')}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-sub btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Cancel / Close (ESC)"
          >
            <X size={16} />
            <span>ESC</span>
          </button>
        </div>

        {/* Task Instructions Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 243, 255, 0.05)',
            borderBottom: '1px dashed var(--border-sub)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
          }}
        >
          {description}
        </div>

        {/* Task Interactive Body */}
        <div
          style={{
            padding: '24px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
