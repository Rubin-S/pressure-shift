import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { SonarCalibrationModal } from './SonarCalibrationModal.js';
import { CircuitWireModal } from './CircuitWireModal.js';
import { PressureValveModal } from './PressureValveModal.js';
import { PowerRoutingModal } from './PowerRoutingModal.js';
import { BioSampleModal } from './BioSampleModal.js';
import { SensorAlignmentModal } from './SensorAlignmentModal.js';
import { BallastPumpModal } from './BallastPumpModal.js';
import { FiltrationClearModal } from './FiltrationClearModal.js';

export const TaskModalDispatcher: React.FC = () => {
  const { activeTaskModal } = useGame();

  if (!activeTaskModal) return null;

  switch (activeTaskModal.type) {
    case 'sonar_calibration':
      return <SonarCalibrationModal task={activeTaskModal} />;
    case 'electrical_circuit':
      return <CircuitWireModal task={activeTaskModal} />;
    case 'pressure_valve':
      return <PressureValveModal task={activeTaskModal} />;
    case 'power_routing':
      return <PowerRoutingModal task={activeTaskModal} />;
    case 'bio_sample_sort':
      return <BioSampleModal task={activeTaskModal} />;
    case 'sensor_alignment':
      return <SensorAlignmentModal task={activeTaskModal} />;
    case 'ballast_pump':
      return <BallastPumpModal task={activeTaskModal} />;
    case 'filtration_clear':
      return <FiltrationClearModal task={activeTaskModal} />;
    default:
      return null;
  }
};
