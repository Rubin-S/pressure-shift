import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkManager } from '../../network/socket.js';

describe('NetworkManager', () => {
  let network: NetworkManager;

  beforeEach(() => {
    // Clear localStorage mock
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });

    network = new NetworkManager();
  });

  it('initializes with disconnected status and default session profile', () => {
    expect(network.getStatus()).toBe('disconnected');
    const session = network.loadSavedSession();
    expect(session.playerName).toMatch(/^Cadet_/);
    expect(session.color).toBe('neon_cyan');
    expect(session.cosmetic).toBe('standard_helm');
  });

  it('persists and loads updated user session', () => {
    network.saveSession({
      playerName: 'Commander_Nemo',
      color: 'coral_red',
      cosmetic: 'captain_cap',
      roomCode: 'ABYSS1',
    });

    const session = network.loadSavedSession();
    expect(session.playerName).toBe('Commander_Nemo');
    expect(session.color).toBe('coral_red');
    expect(session.cosmetic).toBe('captain_cap');
    expect(session.roomCode).toBe('ABYSS1');
  });

  it('clears session tokens properly on room leave', () => {
    network.saveSession({
      playerName: 'Diver_Rex',
      sessionToken: 'tok_12345',
      roomCode: 'OCEAN9',
      playerId: 'p_99',
    });

    network.clearSessionTokens();
    const session = network.loadSavedSession();
    expect(session.playerName).toBe('Diver_Rex');
    expect(session.sessionToken).toBeUndefined();
    expect(session.roomCode).toBeUndefined();
    expect(session.playerId).toBeUndefined();
  });

  it('registers network callbacks', () => {
    const onStatus = vi.fn();
    const onLatency = vi.fn();
    network.setCallbacks({
      onConnectionStatus: onStatus,
      onLatency: onLatency,
    });

    expect(network.getLatency()).toBe(0);
  });
});
