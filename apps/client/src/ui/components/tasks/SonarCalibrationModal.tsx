import React, { useState, useEffect, useRef } from 'react';
import { PlayerTask } from '@pressure-shift/shared';
import { useGame } from '../../context/GameContext.js';
import { TaskModalContainer } from './TaskModalContainer.js';
import { soundEngine } from '../../audio/soundEngine.js';
import { Radio, CheckCircle } from 'lucide-react';

export const SonarCalibrationModal: React.FC<{ task: PlayerTask }> = ({ task }) => {
  const { completeTask, closeTaskModal } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetFreq = 440;
  const targetAmp = 75;

  const [currentFreq, setCurrentFreq] = useState<number>(320);
  const [currentAmp, setCurrentAmp] = useState<number>(45);
  const [lockProgress, setLockProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Check if locked
  const freqDiff = Math.abs(currentFreq - targetFreq);
  const ampDiff = Math.abs(currentAmp - targetAmp);
  const isAligned = freqDiff <= 20 && ampDiff <= 12;

  useEffect(() => {
    let animId: number;
    let phase = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#040b14';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      phase += 0.05;

      // Draw Target Reference Wave (Amber/Green dashed)
      ctx.strokeStyle = isAligned ? 'rgba(0, 230, 118, 0.6)' : 'rgba(255, 170, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * (targetFreq / 6000) + phase) * (targetAmp * 0.7);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Local Submersible Wave (Cyan solid)
      ctx.strokeStyle = isAligned ? '#00e676' : '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = isAligned ? '#00e676' : '#00f3ff';
      ctx.shadowBlur = isAligned ? 12 : 6;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * (currentFreq / 6000) + phase) * (currentAmp * 0.7);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentFreq, currentAmp, targetFreq, targetAmp, isAligned]);

  // Lock progress timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAligned && !isCompleted) {
      interval = setInterval(() => {
        setLockProgress((prev) => {
          if (prev >= 100) {
            setIsCompleted(true);
            completeTask(task.taskId, { freq: currentFreq, amp: currentAmp });
            return 100;
          }
          return prev + 25;
        });
      }, 150);
    } else if (!isAligned) {
      setLockProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAligned, isCompleted, currentFreq, currentAmp, task.taskId, completeTask]);

  return (
    <TaskModalContainer
      title={task.name}
      description={task.description}
      roomName={task.room}
      onClose={closeTaskModal}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Oscilloscope Canvas */}
        <div
          style={{
            position: 'relative',
            border: '2px solid var(--border-sub)',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <canvas ref={canvasRef} width={580} height={200} style={{ width: '100%', height: '200px', display: 'block' }} />
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: isAligned ? '#00e676' : 'var(--accent-cyan)',
              backgroundColor: 'rgba(5, 14, 25, 0.75)',
              padding: '2px 8px',
              border: '1px solid var(--border-sub)',
            }}
          >
            {isAligned ? 'ACOUSTIC HARMONIC LOCK ACHIEVED' : 'SYNCHRONIZING WITH SURFACE BUOY...'}
          </div>
        </div>

        {/* Sliders Control Panel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            background: 'rgba(5, 14, 25, 0.65)',
            padding: '16px 20px',
            border: '1px solid var(--border-sub)',
          }}
        >
          {/* Frequency Slider */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent-cyan)',
                marginBottom: '8px',
              }}
            >
              <span>FREQUENCY:</span>
              <span>{currentFreq} Hz</span>
            </div>
            <input
              type="range"
              min={200}
              max={700}
              value={currentFreq}
              disabled={isCompleted}
              onChange={(e) => {
                setCurrentFreq(Number(e.target.value));
                soundEngine.playClick(400 + Number(e.target.value) / 2);
              }}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Amplitude Slider */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent-cyan)',
                marginBottom: '8px',
              }}
            >
              <span>AMPLITUDE:</span>
              <span>{currentAmp} dB</span>
            </div>
            <input
              type="range"
              min={20}
              max={120}
              value={currentAmp}
              disabled={isCompleted}
              onChange={(e) => {
                setCurrentAmp(Number(e.target.value));
                soundEngine.playClick(300 + Number(e.target.value) * 3);
              }}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Lock Status Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: isAligned ? '#00e676' : 'var(--text-muted)',
            }}
          >
            <span>RESONANCE LOCK:</span>
            <span>{lockProgress}%</span>
          </div>
          <div className="progress-rail">
            <div
              className="progress-fill"
              style={{
                width: `${lockProgress}%`,
                background: isAligned ? '#00e676' : 'var(--accent-cyan)',
                boxShadow: isAligned ? '0 0 12px #00e676' : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </TaskModalContainer>
  );
};
