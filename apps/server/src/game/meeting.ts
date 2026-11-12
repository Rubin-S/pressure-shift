import {
  MeetingState,
  MeetingResult,
  MeetingTriggerType,
  RoomSettings,
  tallyVotes,
  PlayerRole,
} from '@pressure-shift/shared';
import { ServerPlayer } from '../types.js';

export class MeetingManager {
  private currentMeeting: MeetingState | null = null;
  private lastMeetingResult: MeetingResult | null = null;

  public isInMeeting(): boolean {
    return this.currentMeeting !== null;
  }

  public getCurrentMeeting(): MeetingState | null {
    return this.currentMeeting;
  }

  public getLastMeetingResult(): MeetingResult | null {
    return this.lastMeetingResult;
  }

  public startMeeting(params: {
    triggerType: MeetingTriggerType;
    caller: ServerPlayer;
    settings: RoomSettings;
    reportedVictim?: ServerPlayer;
  }): MeetingState {
    const { triggerType, caller, settings, reportedVictim } = params;

    this.currentMeeting = {
      triggerType,
      callerId: caller.id,
      callerName: caller.name,
      reportedVictimId: reportedVictim?.id,
      reportedVictimName: reportedVictim?.name,
      phase: settings.discussionTime > 0 ? 'DISCUSSION' : 'VOTING',
      phaseTimeRemaining: settings.discussionTime > 0 ? settings.discussionTime : settings.votingTime,
      votes: {},
      voters: [],
    };

    return this.currentMeeting;
  }

  public castVote(
    voterId: string,
    target: string | 'SKIP',
    livingPlayerIds: string[]
  ): { success: boolean; error?: string } {
    if (!this.currentMeeting) {
      return { success: false, error: 'No active meeting in progress' };
    }

    if (this.currentMeeting.phase !== 'VOTING') {
      return {
        success: false,
        error: `Cannot vote during meeting ${this.currentMeeting.phase} phase`,
      };
    }

    if (!livingPlayerIds.includes(voterId)) {
      return { success: false, error: 'Dead players cannot cast votes' };
    }

    if (this.currentMeeting.voters.includes(voterId)) {
      return { success: false, error: 'Player has already cast a vote in this meeting' };
    }

    if (target !== 'SKIP' && !livingPlayerIds.includes(target)) {
      return { success: false, error: `Invalid vote target '${target}': target is not alive` };
    }

    this.currentMeeting.votes[voterId] = target;
    this.currentMeeting.voters.push(voterId);

    return { success: true };
  }

  public haveAllLivingVoted(livingPlayerIds: string[]): boolean {
    if (!this.currentMeeting) return false;
    return livingPlayerIds.every((id) => this.currentMeeting!.voters.includes(id));
  }

  /**
   * Advances meeting timers and transitions phases (DISCUSSION -> VOTING -> RESOLVING).
   */
  public tick(
    deltaSec: number,
    settings: RoomSettings,
    livingPlayerIds: string[]
  ): {
    phaseChanged: boolean;
    meetingResolved: boolean;
    result?: MeetingResult;
  } {
    if (!this.currentMeeting) {
      return { phaseChanged: false, meetingResolved: false };
    }

    this.currentMeeting.phaseTimeRemaining -= deltaSec;

    if (this.currentMeeting.phase === 'DISCUSSION') {
      if (this.currentMeeting.phaseTimeRemaining <= 0) {
        this.currentMeeting.phase = 'VOTING';
        this.currentMeeting.phaseTimeRemaining = settings.votingTime;
        return { phaseChanged: true, meetingResolved: false };
      }
      return { phaseChanged: false, meetingResolved: false };
    }

    if (this.currentMeeting.phase === 'VOTING') {
      const allVoted = this.haveAllLivingVoted(livingPlayerIds);
      if (this.currentMeeting.phaseTimeRemaining <= 0 || allVoted) {
        this.currentMeeting.phase = 'RESOLVING';
        this.currentMeeting.phaseTimeRemaining = 5; // 5s result display
        const result = this.resolveMeeting(settings, livingPlayerIds);
        return { phaseChanged: true, meetingResolved: true, result };
      }
      return { phaseChanged: false, meetingResolved: false };
    }

    if (this.currentMeeting.phase === 'RESOLVING') {
      if (this.currentMeeting.phaseTimeRemaining <= 0) {
        // Conclude meeting
        this.currentMeeting = null;
        return { phaseChanged: true, meetingResolved: false };
      }
    }

    return { phaseChanged: false, meetingResolved: false };
  }

  public resolveMeeting(settings: RoomSettings, livingPlayerIds: string[]): MeetingResult {
    if (!this.currentMeeting) {
      throw new Error('Cannot resolve when no meeting is active');
    }

    // Automatically count uncast votes from living players as SKIP if time ran out
    for (const livingId of livingPlayerIds) {
      if (!this.currentMeeting.votes[livingId]) {
        this.currentMeeting.votes[livingId] = 'SKIP';
      }
    }

    const tally = tallyVotes(this.currentMeeting.votes);

    const result: MeetingResult = {
      ejectedPlayerId: tally.ejectedPlayerId,
      isTie: tally.isTie,
      isSkip: tally.isSkip,
      voteCounts: tally.voteCounts,
      voterDetails: settings.anonymousVoting ? undefined : { ...this.currentMeeting.votes },
    };

    this.lastMeetingResult = result;
    return result;
  }

  public endMeeting(): void {
    this.currentMeeting = null;
  }

  public reset(): void {
    this.currentMeeting = null;
    this.lastMeetingResult = null;
  }
}
