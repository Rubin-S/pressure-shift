import { PlayerPublicView, PlayerPrivateView, PlayerRole } from '../types/player.js';

/**
 * Sanitizes a player object for transmission to a specific recipient client.
 * Strictly prevents role leaks to Operators during active gameplay.
 */
export function sanitizePlayerForClient(
  player: PlayerPrivateView | PlayerPublicView,
  viewerId: string,
  viewerRole?: PlayerRole,
  isGameOver: boolean = false
): PlayerPublicView {
  const isSelf = player.id === viewerId;
  const isSpectator = viewerRole === 'SPECTATOR';
  const isFellowDisruptor = viewerRole === 'DISRUPTOR' && player.role === 'DISRUPTOR';

  const shouldRevealRole = isGameOver || isSelf || isSpectator || isFellowDisruptor;

  return {
    id: player.id,
    name: player.name,
    color: player.color,
    cosmetic: player.cosmetic,
    role: shouldRevealRole ? player.role : undefined,
    isAlive: player.isAlive,
    isReady: player.isReady,
    position: { x: player.position.x, y: player.position.y },
    facing: player.facing,
    currentRoom: player.currentRoom,
    currentTask: player.currentTask,
    isHost: player.isHost,
    connected: player.connected,
  };
}

/**
 * Sanitizes a full roster of players for a specific recipient client.
 */
export function sanitizePlayerRosterForClient(
  players: (PlayerPrivateView | PlayerPublicView)[],
  viewerId: string,
  viewerRole?: PlayerRole,
  isGameOver: boolean = false
): PlayerPublicView[] {
  return players.map((p) => sanitizePlayerForClient(p, viewerId, viewerRole, isGameOver));
}

export function isDisruptor(role?: PlayerRole): boolean {
  return role === 'DISRUPTOR';
}

export function isOperator(role?: PlayerRole): boolean {
  return role === 'OPERATOR';
}
