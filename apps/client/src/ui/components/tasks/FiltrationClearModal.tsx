import React, { useState } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Trash2, ShieldAlert } from 'lucide-react';

interface Debris {
  id: number;
  label: string;
  x: number;
  y: number;
  type: 'kelp' | 'barnacle' | 'shell';
}

const INITIAL_DEBRIS: Debris[] = [
  { id: 1, label: 'Kelp Tendril', x: 25, y: 30, type: 'kelp' },
  { id: 2, label: 'Barnacle Cluster', x: 65, y: 22, type: 'barnacle' },
  { id: 3, label: 'Sea Shell', x: 40, y: 65, type: 'shell' },
  { id: 4, label: 'Algae Plug', x: 75, y: 70, type: 'kelp' },
  { id: 5, label: 'Benthic Silt', x: 20, y: 75, type: 'barnacle' },
  { id: 6, label: 'Kelp Tendril', x: 50, y: 40, type: 'kelp' },
];

export const FiltrationClearModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const [debrisList, setDebrisList] = useState<Debris[]>(INITIAL_DEBRIS);
  const [completed, setCompleted] = useState<boolean>(false);

  const handleClearDebris = (id: number) => {
    if (completed) return;
    soundEngine.playClick(850);

    const remaining = debrisList.filter((d) => d.id !== id);
    setDebrisList(remaining);

    if (remaining.length === 0) {
      setCompleted(true);
      setTimeout(() => {
        completeTask(task.taskId, { cleared: true });
      }, 500);
    }
  };

  return (
    <TaskModalContainer
      title={task.name}
      description={task.description}
      roomName={task.room}
      onClose={closeTaskModal}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          CLICK TO DISLODGE AND EJECT DEEP-SEA DEBRIS FROM INTAKE SUCTION GRILLE
        </div>

        {/* Metal Mesh Grille Workspace */}
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            height: '260px',
            backgroundColor: '#040d18',
            border: '3px solid var(--border-sub)',
            borderRadius: '6px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.95)',
          }}
        >
          {/* Grille mesh wire pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                radial-gradient(circle, rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                linear-gradient(to right, rgba(23, 54, 86, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(23, 54, 86, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px, 24px 24px, 24px 24px',
              opacity: 0.6,
            }}
          />

          {/* Interactive Debris Nodes */}
          {debrisList.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClearDebris(item.id)}
              disabled={completed}
              title={`Dislodge ${item.label}`}
              style={{
                position: 'absolute',
                top: `${item.y}%`,
                left: `${item.x}%`,
                transform: 'translate(-50%, -50%)',
                background: item.type === 'kelp' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 170, 0, 0.25)',
                border: `2px solid ${item.type === 'kelp' ? '#00e676' : '#ffaa00'}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'pulse 1.8s infinite alternate',
              }}
            >
              <Trash2 size={14} color={item.type === 'kelp' ? '#00e676' : '#ffaa00'} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Status display */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: completed ? '#00e676' : 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} color={completed ? '#00e676' : 'var(--accent-cyan)'} />
          <span>
            {completed
              ? 'FILTRATION INTAKE COMPLETELY CLEARED'
              : `DEBRIS REMAINING: ${debrisList.length} / ${INITIAL_DEBRIS.length}`}
          </span>
        </div>
      </div>
    </TaskModalContainer>
  );
};
