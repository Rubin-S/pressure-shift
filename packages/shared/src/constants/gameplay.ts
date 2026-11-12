import { RoomSettings } from '../types/room.js';
import { PlayerColorId, PlayerCosmeticId } from '../types/player.js';

export const PLAYER_COLORS: Record<PlayerColorId, { name: string; hex: string; borderHex: string }> = {
  neon_cyan: { name: 'Neon Cyan', hex: '#00f3ff', borderHex: '#0099aa' },
  coral_red: { name: 'Coral Red', hex: '#ff3864', borderHex: '#aa1e3d' },
  deep_amber: { name: 'Deep Amber', hex: '#ffaa00', borderHex: '#b37700' },
  kelp_green: { name: 'Kelp Green', hex: '#00e676', borderHex: '#00994f' },
  biolum_purple: { name: 'Biolum Purple', hex: '#bf55ec', borderHex: '#7d389e' },
  trench_white: { name: 'Trench White', hex: '#e8f4f8', borderHex: '#9bb1bb' },
  abyss_black: { name: 'Abyss Black', hex: '#1c2430', borderHex: '#0d1217' },
  sub_yellow: { name: 'Sub Yellow', hex: '#ffd700', borderHex: '#a88e00' },
  marine_blue: { name: 'Marine Blue', hex: '#0077be', borderHex: '#004c7a' },
  rust_orange: { name: 'Rust Orange', hex: '#e65100', borderHex: '#993600' },
};

export const PLAYER_COSMETICS: Record<PlayerCosmeticId, { name: string; description: string }> = {
  standard_helm: { name: 'Standard Helm', description: 'Standard pressure helmet with LED visor' },
  deep_diver: { name: 'Deep Diver', description: 'Heavy brass atmospheric diving helmet' },
  welding_mask: { name: 'Welding Mask', description: 'Darkened tint shield for hull repair' },
  captain_cap: { name: 'Captain Cap', description: 'Old naval commander hat with gold braid' },
  biologist_goggles: { name: 'Biologist Goggles', description: 'Fluorescent specimen analysis spectacles' },
  hazard_rebreather: { name: 'Hazard Rebreather', description: 'Dual-canister chemical filtration mask' },
  aquanaut_beret: { name: 'Aquanaut Beret', description: 'Tactical deep-sea expedition beret' },
  sonar_headset: { name: 'Sonar Headset', description: 'Acoustic monitoring headphones with mic' },
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  numDisruptors: 1,
  killCooldown: 25,
  discussionTime: 15,
  votingTime: 30,
  operatorTaskCount: 5,
  anonymousVoting: false,
  confirmEjects: true,
  emergencyMeetingLimit: 1,
  playerSpeed: 200, // Pixels per second
  killDistance: 75, // Distance threshold for kill attempt
};

export const GAMEPLAY_CONSTANTS = {
  MIN_PLAYERS_TO_START: 4,
  MAX_PLAYERS_PER_ROOM: 10,
  STARTING_COUNTDOWN_SECONDS: 5,
  INTERACT_RADIUS: 65,
  KILL_DISTANCE: 75,
  REPORT_BODY_DISTANCE: 85,
  EMERGENCY_BUTTON_DISTANCE: 75,
  MAX_DELTA_TIME_MS: 1000,
  SPEED_TOLERANCE_MULTIPLIER: 1.35, // Anti-cheat buffer for network lag
  SESSION_RECOVERY_SECONDS: 30,
};
