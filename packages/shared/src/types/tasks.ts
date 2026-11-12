import { FacilityRoomId } from './facility.js';

export type TaskType =
  | 'sonar_calibration'
  | 'electrical_circuit'
  | 'pressure_valve'
  | 'power_routing'
  | 'bio_sample_sort'
  | 'sensor_alignment'
  | 'ballast_pump'
  | 'filtration_clear';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Position2D {
  x: number;
  y: number;
}

export interface BaseTaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  room: FacilityRoomId;
  location: Position2D;
  interactRadius: number;
}

export interface SonarCalibrationTask extends BaseTaskDefinition {
  type: 'sonar_calibration';
  targetFrequencyHz: number;
  targetAmplitude: number;
}

export interface ElectricalCircuitTask extends BaseTaskDefinition {
  type: 'electrical_circuit';
  wireColors: ('cyan' | 'magenta' | 'yellow' | 'green')[];
}

export interface PressureValveTask extends BaseTaskDefinition {
  type: 'pressure_valve';
  targetPressurePsi: number;
  tolerancePsi: number;
}

export interface PowerRoutingTask extends BaseTaskDefinition {
  type: 'power_routing';
  gridSize: number;
  destinationNode: Position2D;
}

export interface BioSampleSortTask extends BaseTaskDefinition {
  type: 'bio_sample_sort';
  totalSamples: number;
  specimenTypes: ('algae' | 'pathogen' | 'mineral')[];
}

export interface SensorAlignmentTask extends BaseTaskDefinition {
  type: 'sensor_alignment';
  targetBearingDeg: number;
  toleranceDeg: number;
}

export interface BallastPumpTask extends BaseTaskDefinition {
  type: 'ballast_pump';
  valveSequence: number[];
}

export interface FiltrationClearTask extends BaseTaskDefinition {
  type: 'filtration_clear';
  debrisCount: number;
}

export type TaskDefinition =
  | SonarCalibrationTask
  | ElectricalCircuitTask
  | PressureValveTask
  | PowerRoutingTask
  | BioSampleSortTask
  | SensorAlignmentTask
  | BallastPumpTask
  | FiltrationClearTask;

export interface PlayerTask {
  id: string;
  taskId: string;
  type: TaskType;
  name: string;
  description: string;
  room: FacilityRoomId;
  location: Position2D;
  status: TaskStatus;
  completedAt?: number;
}
