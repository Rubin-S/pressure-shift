import { SabotageType, SabotageDefinition } from '../types/sabotage.js';

export const SABOTAGE_DEFINITIONS: Record<SabotageType, SabotageDefinition> = {
  communications_interference: {
    type: 'communications_interference',
    name: 'Communications Interference',
    description: 'Scrambles the submarine acoustic network. Task markers and mini-maps are disabled until repaired.',
    cooldownSeconds: 30,
    isCritical: false,
    repairInstructions: 'Access the communications terminal to restore the frequency synchronization.',
    defaultStations: [
      {
        id: 'station_comms_repair',
        name: 'Communications Terminal',
        room: 'communications',
        location: { x: 1200, y: 1400 },
      },
    ],
  },
  oxygen_depletion: {
    type: 'oxygen_depletion',
    name: 'Oxygen / Pressure Depletion Emergency',
    description: 'Atmospheric scrubbers sabotaged! Hull pressure rapidly dropping. Both life-support scrubbers must be purged within 45 seconds.',
    cooldownSeconds: 35,
    isCritical: true,
    criticalTimerSeconds: 45,
    repairInstructions: 'Operators must simultaneously operate the emergency bypass scrubbers in Hydroponics and Observation Gallery.',
    defaultStations: [
      {
        id: 'station_oxy_hydroponics',
        name: 'Hydroponics Scrubber Bypass',
        room: 'hydroponics',
        location: { x: 2000, y: 250 },
      },
      {
        id: 'station_oxy_observation',
        name: 'Observation Dome Vent Seal',
        room: 'observation_gallery',
        location: { x: 2000, y: 850 },
      },
    ],
  },
  reactor_meltdown: {
    type: 'reactor_meltdown',
    name: 'Geothermal Reactor Meltdown',
    description: 'Coolant pumps ruptured in Thermal Plant! Both thermal override switches must be held concurrently within 45 seconds.',
    cooldownSeconds: 35,
    isCritical: true,
    criticalTimerSeconds: 45,
    repairInstructions: 'Two operators must engage both thermal override consoles in the Thermal Plant at the same time.',
    defaultStations: [
      {
        id: 'station_reactor_alpha',
        name: 'Coolant Override Alpha',
        room: 'thermal_plant',
        location: { x: 250, y: 1450 },
      },
      {
        id: 'station_reactor_beta',
        name: 'Coolant Override Beta',
        room: 'thermal_plant',
        location: { x: 450, y: 1450 },
      },
    ],
  },
  door_lockdown: {
    type: 'door_lockdown',
    name: 'Bulkhead Door Lockdown',
    description: 'Emergency hydraulic bulkheads slam shut, sealing a target room for 12 seconds.',
    cooldownSeconds: 25,
    isCritical: false,
    repairInstructions: 'Hydraulic locks will automatically release after 12 seconds.',
    defaultStations: [],
  },
};

export const LOCKDOWN_DURATION_SECONDS = 12;
