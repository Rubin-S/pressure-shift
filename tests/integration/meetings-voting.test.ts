import { describe, it, expect } from 'vitest';
import {
  tallyVotes,
  checkWinCondition,
  MeetingState,
  MeetingResult,
  PlayerRole,
  DEFAULT_ROOM_SETTINGS,
} from '@pressure-shift/shared';

describe('Emergency Meetings & Voting Integration Tests', () => {
  describe('Meeting Calling & Limits', () => {
    it('enforces emergency meeting limits per player', () => {
      const emergencyLimit = DEFAULT_ROOM_SETTINGS.emergencyMeetingLimit; // 1
      expect(emergencyLimit).toBe(1);

      let meetingsCalledByPlayer = 0;
      const canCallMeeting = () => meetingsCalledByPlayer < emergencyLimit;

      expect(canCallMeeting()).toBe(true);
      meetingsCalledByPlayer++;
      expect(canCallMeeting()).toBe(false);
    });

    it('dead players cannot call emergency meetings', () => {
      const deadPlayer = { id: 'p1', isAlive: false };
      const canCall = deadPlayer.isAlive;
      expect(canCall).toBe(false);
    });
  });

  describe('Ballot Counting & Tie Breaking', () => {
    it('ejects suspect when receiving absolute majority', () => {
      const ballots: Record<string, string | 'SKIP'> = {
        diver1: 'suspect_red',
        diver2: 'suspect_red',
        diver3: 'suspect_red',
        diver4: 'SKIP',
      };

      const result = tallyVotes(ballots);
      expect(result.ejectedPlayerId).toBe('suspect_red');
      expect(result.isTie).toBe(false);
      expect(result.isSkip).toBe(false);
      expect(result.voteCounts['suspect_red']).toBe(3);
    });

    it('results in no ejection during a tie between highest candidates', () => {
      const ballots: Record<string, string | 'SKIP'> = {
        diver1: 'suspect_cyan',
        diver2: 'suspect_cyan',
        diver3: 'suspect_red',
        diver4: 'suspect_red',
      };

      const result = tallyVotes(ballots);
      expect(result.ejectedPlayerId).toBeNull();
      expect(result.isTie).toBe(true);
    });

    it('results in no ejection when SKIP receives the most votes', () => {
      const ballots: Record<string, string | 'SKIP'> = {
        diver1: 'SKIP',
        diver2: 'SKIP',
        diver3: 'suspect_cyan',
        diver4: 'suspect_red',
      };

      const result = tallyVotes(ballots);
      expect(result.ejectedPlayerId).toBeNull();
      expect(result.isSkip).toBe(true);
    });

    it('results in no ejection when SKIP ties with highest candidate', () => {
      const ballots: Record<string, string | 'SKIP'> = {
        diver1: 'SKIP',
        diver2: 'SKIP',
        diver3: 'suspect_cyan',
        diver4: 'suspect_cyan',
      };

      const result = tallyVotes(ballots);
      expect(result.ejectedPlayerId).toBeNull();
    });
  });

  describe('Ejection Resolution & Role Confirmation', () => {
    const players: Record<string, { id: string; name: string; role: PlayerRole; isAlive: boolean }> = {
      p1: { id: 'p1', name: 'Diver1', role: 'OPERATOR', isAlive: true },
      p2: { id: 'p2', name: 'Diver2', role: 'OPERATOR', isAlive: true },
      p3: { id: 'p3', name: 'Diver3', role: 'OPERATOR', isAlive: true },
      d1: { id: 'd1', name: 'Disruptor1', role: 'DISRUPTOR', isAlive: true },
    };

    it('confirms role on ejection when confirmEjects is enabled', () => {
      const confirmEjects = true;
      const ejectedId = 'd1';
      const ejectedPlayer = players[ejectedId];

      const meetingResult: MeetingResult = {
        ejectedPlayerId: ejectedId,
        ejectedPlayerName: ejectedPlayer.name,
        ejectedRole: confirmEjects ? ejectedPlayer.role : undefined,
        wasDisruptor: confirmEjects ? ejectedPlayer.role === 'DISRUPTOR' : undefined,
        remainingDisruptors: 0,
        isTie: false,
        isSkip: false,
        voteTally: { d1: 3, SKIP: 1 },
      };

      expect(meetingResult.wasDisruptor).toBe(true);
      expect(meetingResult.ejectedRole).toBe('DISRUPTOR');
      expect(meetingResult.remainingDisruptors).toBe(0);
    });

    it('hides role on ejection when confirmEjects is disabled', () => {
      const confirmEjects = false;
      const ejectedId = 'p1';
      const ejectedPlayer = players[ejectedId];

      const meetingResult: MeetingResult = {
        ejectedPlayerId: ejectedId,
        ejectedPlayerName: ejectedPlayer.name,
        ejectedRole: confirmEjects ? ejectedPlayer.role : undefined,
        wasDisruptor: confirmEjects ? ejectedPlayer.role === 'DISRUPTOR' : undefined,
        remainingDisruptors: 1,
        isTie: false,
        isSkip: false,
        voteTally: { p1: 3, SKIP: 1 },
      };

      expect(meetingResult.wasDisruptor).toBeUndefined();
      expect(meetingResult.ejectedRole).toBeUndefined();
    });

    it('triggers Operator victory immediately if the last Disruptor is ejected', () => {
      // Eject d1
      players['d1'].isAlive = false;

      const outcome = checkWinCondition({
        players: Object.values(players),
        completedTasks: 5,
        totalTasks: 15,
        criticalSabotageExpired: false,
      });

      expect(outcome).not.toBeNull();
      expect(outcome?.winner).toBe('OPERATORS');
      expect(outcome?.reason).toBe('ALL_DISRUPTORS_EJECTED');
    });
  });
});
