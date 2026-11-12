import { describe, it, expect } from 'vitest';
import {
  sanitizePlayerForClient,
  sanitizePlayerRosterForClient,
  PlayerPrivateView,
} from '../index.js';

describe('Player Payload Role Sanitization', () => {
  const disruptorPlayer: PlayerPrivateView = {
    id: 'disruptor_1',
    name: 'ShadowDiver',
    color: 'coral_red',
    cosmetic: 'welding_mask',
    role: 'DISRUPTOR',
    isAlive: true,
    isReady: true,
    position: { x: 300, y: 400 },
    facing: 'left',
    currentRoom: 'docking_cradle',
    currentTask: null,
    isHost: false,
    connected: true,
    assignedTasks: [],
    disruptorPeers: ['disruptor_2'],
    killCooldownRemaining: 0,
    sabotageCooldownRemaining: 0,
    emergencyMeetingsRemaining: 1,
  };

  const operatorPlayer: PlayerPrivateView = {
    id: 'operator_1',
    name: 'HonestDiver',
    color: 'neon_cyan',
    cosmetic: 'standard_helm',
    role: 'OPERATOR',
    isAlive: true,
    isReady: true,
    position: { x: 500, y: 600 },
    facing: 'right',
    currentRoom: 'sonar_control',
    currentTask: 'task_sonar_cal',
    isHost: true,
    connected: true,
    assignedTasks: [],
    emergencyMeetingsRemaining: 1,
  };

  it('hides disruptor role from ordinary operators during active match', () => {
    const sanitized = sanitizePlayerForClient(
      disruptorPlayer,
      'operator_1', // viewerId is Operator
      'OPERATOR', // viewerRole is Operator
      false // game not over
    );

    expect(sanitized.role).toBeUndefined();
    expect(sanitized.name).toBe('ShadowDiver');
    // Ensure private fields like assignedTasks, killCooldown are not present in public view
    expect((sanitized as unknown as Record<string, unknown>)['assignedTasks']).toBeUndefined();
    expect((sanitized as unknown as Record<string, unknown>)['killCooldownRemaining']).toBeUndefined();
  });

  it('reveals own role to self', () => {
    const sanitized = sanitizePlayerForClient(
      operatorPlayer,
      'operator_1', // self
      'OPERATOR',
      false
    );
    expect(sanitized.role).toBe('OPERATOR');
  });

  it('reveals disruptor role to fellow disruptor peers', () => {
    const sanitized = sanitizePlayerForClient(
      disruptorPlayer,
      'disruptor_2', // fellow disruptor
      'DISRUPTOR',
      false
    );
    expect(sanitized.role).toBe('DISRUPTOR');
  });

  it('reveals all roles when game is over', () => {
    const sanitized = sanitizePlayerForClient(
      disruptorPlayer,
      'operator_1', // operator
      'OPERATOR',
      true // game is over!
    );
    expect(sanitized.role).toBe('DISRUPTOR');
  });

  it('reveals all roles to spectators', () => {
    const sanitized = sanitizePlayerForClient(
      disruptorPlayer,
      'ghost_spectator',
      'SPECTATOR',
      false
    );
    expect(sanitized.role).toBe('DISRUPTOR');
  });

  it('sanitizes an entire roster for an operator', () => {
    const roster = [operatorPlayer, disruptorPlayer];
    const sanitizedRoster = sanitizePlayerRosterForClient(roster, 'operator_1', 'OPERATOR', false);

    expect(sanitizedRoster[0].role).toBe('OPERATOR'); // self
    expect(sanitizedRoster[1].role).toBeUndefined(); // disruptor hidden
  });
});
