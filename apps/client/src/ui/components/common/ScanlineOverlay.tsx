import React from 'react';
import { useGame } from '../../context/GameContext.js';

export const ScanlineOverlay: React.FC = () => {
  const { crtShaderEnabled } = useGame();

  if (!crtShaderEnabled) return null;

  return <div className="crt-overlay" aria-hidden="true" />;
};
