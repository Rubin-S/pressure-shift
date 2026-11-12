export type PlayerRole = 'OPERATOR' | 'DISRUPTOR' | 'SPECTATOR';

export type MeetingTriggerType = 'EMERGENCY_BUTTON' | 'BODY_REPORTED';

export type MeetingPhase = 'DISCUSSION' | 'VOTING' | 'RESOLVING';

export interface MeetingState {
  triggerType: MeetingTriggerType;
  callerId: string;
  callerName: string;
  reportedVictimId?: string;
  reportedVictimName?: string;
  phase: MeetingPhase;
  phaseTimeRemaining: number;
  votes: Record<string, string | 'SKIP'>; // voterId -> targetPlayerId | 'SKIP'
  voters: string[]; // List of playerIds who have submitted a vote
}

export interface MeetingResult {
  ejectedPlayerId: string | null;
  ejectedPlayerName?: string;
  ejectedPlayerRole?: PlayerRole; // undefined if confirmEjects is false
  wasDisruptor?: boolean;
  remainingDisruptors?: number;
  isTie: boolean;
  isSkip: boolean;
  voteCounts: Record<string, number>; // targetId or 'SKIP' -> tally
  voterDetails?: Record<string, string | 'SKIP'>; // revealed only if anonymousVoting is false
}
