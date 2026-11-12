import { describe, it, expect } from 'vitest';
import { STATIC_TASK_DEFINITIONS } from '@pressure-shift/shared';

describe('Mini-Game Task Specs & Mechanics', () => {
  it('defines all 8 interactive mini-games correctly', () => {
    const taskTypes = Object.values(STATIC_TASK_DEFINITIONS).map((t) => t.type);
    expect(taskTypes).toContain('sonar_calibration');
    expect(taskTypes).toContain('electrical_circuit');
    expect(taskTypes).toContain('pressure_valve');
    expect(taskTypes).toContain('power_routing');
    expect(taskTypes).toContain('bio_sample_sort');
    expect(taskTypes).toContain('sensor_alignment');
    expect(taskTypes).toContain('ballast_pump');
    expect(taskTypes).toContain('filtration_clear');
    expect(taskTypes.length).toBe(8);
  });

  it('validates sonar calibration target parameters', () => {
    const sonar = STATIC_TASK_DEFINITIONS['task_sonar_cal'] as any;
    expect(sonar.targetFrequencyHz).toBe(440);
    expect(sonar.targetAmplitude).toBe(75);
    expect(sonar.room).toBe('sonar_control');
  });

  it('validates circuit wire color definitions', () => {
    const circuit = STATIC_TASK_DEFINITIONS['task_elec_circuit'] as any;
    expect(circuit.wireColors).toEqual(['cyan', 'magenta', 'yellow', 'green']);
    expect(circuit.room).toBe('docking_cradle');
  });

  it('validates pressure valve target and tolerance bounds', () => {
    const valve = STATIC_TASK_DEFINITIONS['task_pressure_valve'] as any;
    expect(valve.targetPressurePsi).toBe(80);
    expect(valve.tolerancePsi).toBe(5);
    expect(valve.room).toBe('pressure_lab');
  });

  it('validates power routing grid parameters', () => {
    const power = STATIC_TASK_DEFINITIONS['task_power_routing'] as any;
    expect(power.gridSize).toBe(4);
    expect(power.room).toBe('thermal_plant');
  });

  it('validates bio sample specimen categories', () => {
    const bio = STATIC_TASK_DEFINITIONS['task_bio_sample'] as any;
    expect(bio.totalSamples).toBe(4);
    expect(bio.specimenTypes).toEqual(['algae', 'pathogen', 'mineral']);
    expect(bio.room).toBe('medical_bay');
  });

  it('validates sensor alignment bearing angles', () => {
    const sensor = STATIC_TASK_DEFINITIONS['task_sensor_align'] as any;
    expect(sensor.targetBearingDeg).toBe(135);
    expect(sensor.toleranceDeg).toBe(8);
    expect(sensor.room).toBe('observation_gallery');
  });

  it('validates ballast pump valve purge sequence', () => {
    const ballast = STATIC_TASK_DEFINITIONS['task_ballast_pump'] as any;
    expect(ballast.valveSequence).toEqual([1, 3, 2, 4]);
    expect(ballast.room).toBe('hydroponics');
  });

  it('validates filtration intake debris requirements', () => {
    const filtration = STATIC_TASK_DEFINITIONS['task_filtration_clear'] as any;
    expect(filtration.debrisCount).toBe(6);
    expect(filtration.room).toBe('communications');
  });
});
