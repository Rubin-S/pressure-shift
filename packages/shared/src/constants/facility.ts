import { FacilityRoomId, FacilityRoomInfo, FacilityVent } from '../types/facility.js';

export const FACILITY_ROOMS: Record<FacilityRoomId, FacilityRoomInfo> = {
  central_junction: {
    id: 'central_junction',
    name: 'Central Junction',
    description: 'The core communal crossroads of the facility with the emergency dispatch console.',
    bounds: { x: 900, y: 700, width: 600, height: 400 },
    spawnPoint: { x: 1200, y: 900 },
    emergencyConsole: { x: 1200, y: 900 },
    ventIds: [],
  },
  docking_cradle: {
    id: 'docking_cradle',
    name: 'Docking Cradle',
    description: 'The primary airlock and submarine docking bay for sub-oceanic craft.',
    bounds: { x: 100, y: 100, width: 500, height: 400 },
    spawnPoint: { x: 350, y: 300 },
    ventIds: ['vent_docking_cradle'],
  },
  sonar_control: {
    id: 'sonar_control',
    name: 'Sonar Control',
    description: 'Acoustic telemetry monitoring station listening to abyssal trench seismic pulses.',
    bounds: { x: 950, y: 100, width: 500, height: 400 },
    spawnPoint: { x: 1200, y: 300 },
    ventIds: ['vent_sonar_control'],
  },
  hydroponics: {
    id: 'hydroponics',
    name: 'Hydroponics',
    description: 'Bioluminescent algae tanks generating the facility oxygen supply.',
    bounds: { x: 1800, y: 100, width: 500, height: 400 },
    spawnPoint: { x: 2050, y: 300 },
    ventIds: ['vent_hydroponics'],
  },
  pressure_lab: {
    id: 'pressure_lab',
    name: 'Pressure Lab',
    description: 'Hull integrity testing chambers and hyperbaric equalization valves.',
    bounds: { x: 100, y: 700, width: 500, height: 400 },
    spawnPoint: { x: 350, y: 900 },
    ventIds: ['vent_pressure_lab'],
  },
  observation_gallery: {
    id: 'observation_gallery',
    name: 'Observation Gallery',
    description: 'Reinforced quartz dome offering a panoramic view into the pitch-black trench.',
    bounds: { x: 1800, y: 700, width: 500, height: 400 },
    spawnPoint: { x: 2050, y: 900 },
    ventIds: ['vent_observation_gallery'],
  },
  thermal_plant: {
    id: 'thermal_plant',
    name: 'Thermal Plant',
    description: 'Geothermal turbines tapping hydrothermal vents to power life support.',
    bounds: { x: 100, y: 1300, width: 500, height: 400 },
    spawnPoint: { x: 350, y: 1500 },
    ventIds: ['vent_thermal_plant'],
  },
  communications: {
    id: 'communications',
    name: 'Communications',
    description: 'Ultra-low-frequency acoustic transceivers relaying data to the surface buoy.',
    bounds: { x: 950, y: 1300, width: 500, height: 400 },
    spawnPoint: { x: 1200, y: 1500 },
    ventIds: ['vent_communications'],
  },
  medical_bay: {
    id: 'medical_bay',
    name: 'Medical Bay',
    description: 'Decontamination showers, cryogenic bio-freezers, and specimen analysis benches.',
    bounds: { x: 1800, y: 1300, width: 500, height: 400 },
    spawnPoint: { x: 2050, y: 1500 },
    ventIds: ['vent_medical_bay'],
  },
};

export const FACILITY_VENTS: Record<string, FacilityVent> = {
  vent_docking_cradle: {
    id: 'vent_docking_cradle',
    room: 'docking_cradle',
    position: { x: 200, y: 200 },
    connectedVentIds: ['vent_pressure_lab'],
  },
  vent_pressure_lab: {
    id: 'vent_pressure_lab',
    room: 'pressure_lab',
    position: { x: 200, y: 800 },
    connectedVentIds: ['vent_docking_cradle', 'vent_thermal_plant'],
  },
  vent_thermal_plant: {
    id: 'vent_thermal_plant',
    room: 'thermal_plant',
    position: { x: 200, y: 1400 },
    connectedVentIds: ['vent_pressure_lab'],
  },
  vent_sonar_control: {
    id: 'vent_sonar_control',
    room: 'sonar_control',
    position: { x: 1350, y: 200 },
    connectedVentIds: ['vent_communications'],
  },
  vent_communications: {
    id: 'vent_communications',
    room: 'communications',
    position: { x: 1350, y: 1400 },
    connectedVentIds: ['vent_sonar_control'],
  },
  vent_hydroponics: {
    id: 'vent_hydroponics',
    room: 'hydroponics',
    position: { x: 2200, y: 200 },
    connectedVentIds: ['vent_observation_gallery'],
  },
  vent_observation_gallery: {
    id: 'vent_observation_gallery',
    room: 'observation_gallery',
    position: { x: 2200, y: 800 },
    connectedVentIds: ['vent_hydroponics', 'vent_medical_bay'],
  },
  vent_medical_bay: {
    id: 'vent_medical_bay',
    room: 'medical_bay',
    position: { x: 2200, y: 1400 },
    connectedVentIds: ['vent_observation_gallery'],
  },
};

export const MAP_DIMENSIONS = {
  width: 2400,
  height: 1800,
};
