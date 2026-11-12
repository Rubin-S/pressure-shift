import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toast, dismissToast } = useGame();

  if (!toast) return null;

  const getBorderColor = () => {
    switch (toast.type) {
      case 'alert':
      case 'error':
        return '#ff3864';
      case 'success':
        return '#00e676';
      default:
        return '#00f3ff';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'alert':
      case 'error':
        return <AlertTriangle size={20} color="#ff3864" />;
      case 'success':
        return <CheckCircle size={20} color="#00e676" />;
      default:
        return <Info size={20} color="#00f3ff" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        maxWidth: '420px',
        width: '90%',
        animation: 'slideInRight 0.25s ease-out',
      }}
    >
      <div
        className="sub-panel"
        style={{
          borderLeft: `4px solid ${getBorderColor()}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.7), 0 0 12px ${getBorderColor()}44`,
        }}
      >
        <div style={{ flexShrink: 0 }}>{getIcon()}</div>
        <div
          style={{
            flexGrow: 1,
            fontSize: '0.9rem',
            lineHeight: '1.4',
            color: '#e2f1f8',
            fontFamily: 'var(--font-body)',
          }}
        >
          {toast.message}
        </div>
        <button
          onClick={dismissToast}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
