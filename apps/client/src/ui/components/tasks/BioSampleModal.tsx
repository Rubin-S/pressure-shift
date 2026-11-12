import React, { useState } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { TestTube, FlaskConical, Dna } from 'lucide-react';

type SpecimenType = 'algae' | 'pathogen' | 'mineral';

interface Specimen {
  id: number;
  type: SpecimenType;
  name: string;
  colorHex: string;
  description: string;
}

const SPECIMENS: Specimen[] = [
  { id: 1, type: 'algae', name: 'Bioluminescent Algae', colorHex: '#00e676', description: 'Deep hydrothermal photosynthetic chlorophyll' },
  { id: 2, type: 'pathogen', name: 'Extremophile Pathogen', colorHex: '#ff3864', description: 'Toxic anaerobic spore culture' },
  { id: 3, type: 'mineral', name: 'Benthic Manganese Ore', colorHex: '#00f3ff', description: 'High-density acoustic resonance nodule' },
  { id: 4, type: 'algae', name: 'Abyssal Kelp Spore', colorHex: '#00e676', description: 'Oxygen-scrubber nutrient colony' },
];

export const BioSampleModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentSample = SPECIMENS[currentIndex];

  const handleClassify = (selectedType: SpecimenType) => {
    if (isFinished || !currentSample) return;

    if (currentSample.type === selectedType) {
      soundEngine.playClick(900);
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);

      if (nextCount >= SPECIMENS.length) {
        setIsFinished(true);
        setTimeout(() => {
          completeTask(task.taskId, { count: nextCount });
        }, 500);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } else {
      soundEngine.playError();
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
          gap: '24px',
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
          ANALYZE SPECIMEN SPECTRAL GLOW AND ROUTE TO MATCHING BIO-CONTAINMENT CHAMBER
        </div>

        {/* Specimen Analysis Chamber */}
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'rgba(5, 14, 25, 0.95)',
            border: '2px solid var(--border-sub)',
            borderRadius: '6px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
          }}
        >
          {currentSample ? (
            <>
              {/* Glowing Specimen Vial */}
              <div
                style={{
                  width: '64px',
                  height: '110px',
                  borderRadius: '12px 12px 30px 30px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '3px solid rgba(255, 255, 255, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                  boxShadow: `0 0 25px ${currentSample.colorHex}66`,
                }}
              >
                {/* Liquid fill */}
                <div
                  style={{
                    width: '100%',
                    height: '75%',
                    backgroundColor: currentSample.colorHex,
                    opacity: 0.85,
                    boxShadow: `inset 0 0 15px #fff`,
                    animation: 'pulse 1.5s infinite alternate',
                  }}
                />
              </div>

              {/* Sample Readout */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '1.1rem',
                    color: currentSample.colorHex,
                    fontWeight: 700,
                  }}
                >
                  {currentSample.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {currentSample.description}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '30px', color: '#00e676', fontFamily: 'var(--font-mono)' }}>
              ALL SAMPLES CLASSIFIED AND ISOLATED
            </div>
          )}
        </div>

        {/* Classification Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => handleClassify('algae')}
            disabled={isFinished}
            className="btn-sub btn-success"
            style={{ minWidth: '130px', padding: '12px 16px' }}
          >
            <FlaskConical size={18} />
            <span>ALGAE</span>
          </button>

          <button
            onClick={() => handleClassify('pathogen')}
            disabled={isFinished}
            className="btn-sub btn-danger"
            style={{ minWidth: '130px', padding: '12px 16px' }}
          >
            <Dna size={18} />
            <span>PATHOGEN</span>
          </button>

          <button
            onClick={() => handleClassify('mineral')}
            disabled={isFinished}
            className="btn-sub"
            style={{ minWidth: '130px', padding: '12px 16px' }}
          >
            <TestTube size={18} />
            <span>MINERAL</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
            }}
          >
            <span>BATCH SORT PROGRESS:</span>
            <span>{completedCount} / {SPECIMENS.length}</span>
          </div>
          <div className="progress-rail">
            <div
              className="progress-fill"
              style={{
                width: `${(completedCount / SPECIMENS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </TaskModalContainer>
  );
};
