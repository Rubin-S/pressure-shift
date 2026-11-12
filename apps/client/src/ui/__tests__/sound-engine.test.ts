import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundEngine } from '../audio/soundEngine.js';

describe('SoundEngine', () => {
  beforeEach(() => {
    soundEngine.setMuted(false);
  });

  it('manages mute and unmute state correctly', () => {
    expect(soundEngine.getMuted()).toBe(false);

    soundEngine.setMuted(true);
    expect(soundEngine.getMuted()).toBe(true);

    const toggled = soundEngine.toggleMute();
    expect(toggled).toBe(false);
    expect(soundEngine.getMuted()).toBe(false);
  });

  it('handles sound execution without crashing when AudioContext is mocked or uninitialized', () => {
    // Should not throw even in Node / headless test environment
    expect(() => soundEngine.playSonarPing()).not.toThrow();
    expect(() => soundEngine.playClick(600)).not.toThrow();
    expect(() => soundEngine.playTaskComplete()).not.toThrow();
    expect(() => soundEngine.playError()).not.toThrow();
    expect(() => soundEngine.playKill()).not.toThrow();
    expect(() => soundEngine.playSabotage()).not.toThrow();
    expect(() => soundEngine.playEjection()).not.toThrow();
    expect(() => soundEngine.playTimerTick()).not.toThrow();
    expect(() => soundEngine.startEmergencyAlarm()).not.toThrow();
    expect(() => soundEngine.stopEmergencyAlarm()).not.toThrow();
  });
});
