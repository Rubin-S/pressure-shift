import {
  RoomState,
  RoomSettings,
  RoomStateView,
  PlayerPublicView,
  PlayerPrivateView,
  PlayerRole,
  DeadBody,
  TaskMeterState,
  GameOverSummary,
  ChatMessageBroadcastPayload,
  DEFAULT_ROOM_SETTINGS,
  GAMEPLAY_CONSTANTS,
  FACILITY_ROOMS,
  Position2D,
  distance2D,
  sanitizePlayerForClient,
  sanitizePlayerRosterForClient,
  checkWinCondition,
  canTransition,
  SabotageType,
  FacilityRoomId,
  ActiveSabotage,
  MeetingState,
  MeetingResult,
} from '@pressure-shift/shared';
import { ServerPlayer } from '../types.js';
import { validateMovement, findCurrentFacilityRoom } from './movement.js';
import { assignTasksToPlayer, calculateTaskMeter, isPlayerNearTask } from './tasks.js';
import { SabotageManager } from './sabotage.js';
import { MeetingManager } from './meeting.js';

export interface RoomEventsListener {
  onRoomStateChanged: (room: GameRoom) => void;
  onPlayerMoved: (playerId: string, x: number, y: number, vx?: number, vy?: number, facing?: any) => void;
  onGameOver: (summary: GameOverSummary) => void;
  onMeetingStarted: (meeting: MeetingState) => void;
  onMeetingResult: (result: MeetingResult) => void;
  onSabotageActive: (sabotage: ActiveSabotage) => void;
  onSabotageCleared: (sabotageType: SabotageType) => void;
  onPlayerKilled: (victimId: string, killerId?: string, position?: Position2D) => void;
  onTaskProgress: (progress: TaskMeterState, playerCompletedId?: string, taskId?: string) => void;
  onChatMessage: (msg: ChatMessageBroadcastPayload) => void;
}

export class GameRoom {
  public readonly roomCode: string;
  public hostId: string;
  public state: RoomState = 'LOBBY';
  public settings: RoomSettings;
  public players: Map<string, ServerPlayer> = new Map();
  public deadBodies: DeadBody[] = [];
  public taskMeter: TaskMeterState = { completedTasks: 0, totalTasks: 0, progressPercent: 0 };
  public gameOverSummary: GameOverSummary | null = null;
  public countdownRemaining: number | null = null;

  public readonly sabotageManager: SabotageManager = new SabotageManager();
  public readonly meetingManager: MeetingManager = new MeetingManager();

  private tickInterval: NodeJS.Timeout | null = null;
  private eventListener?: RoomEventsListener;

  constructor(roomCode: string, hostPlayer: ServerPlayer, initialSettings?: Partial<RoomSettings>) {
    this.roomCode = roomCode;
    this.hostId = hostPlayer.id;
    this.settings = { ...DEFAULT_ROOM_SETTINGS, ...initialSettings };
    this.addPlayer(hostPlayer);

    // Start 1-second server tick loop for timers
    this.tickInterval = setInterval(() => this.tick(1), 1000);
    if (this.tickInterval.unref) {
      this.tickInterval.unref();
    }
  }

  public setEventListener(listener: RoomEventsListener): void {
    this.eventListener = listener;
  }

  public getPlayer(playerId: string): ServerPlayer | undefined {
    return this.players.get(playerId);
  }

  public getPlayerBySocketId(socketId: string): ServerPlayer | undefined {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player;
    }
    return undefined;
  }

  public getPlayerBySessionToken(token: string): ServerPlayer | undefined {
    for (const player of this.players.values()) {
      if (player.sessionToken === token) return player;
    }
    return undefined;
  }

  public getAllPlayersList(): ServerPlayer[] {
    return Array.from(this.players.values());
  }

  public getLivingPlayersList(): ServerPlayer[] {
    return this.getAllPlayersList().filter((p) => p.isAlive);
  }

  public addPlayer(player: ServerPlayer): boolean {
    if (this.players.size >= GAMEPLAY_CONSTANTS.MAX_PLAYERS_PER_ROOM) {
      return false;
    }
    this.players.set(player.id, player);
    return true;
  }

  public removePlayer(playerId: string): { newHostId?: string; roomEmpty: boolean } {
    const player = this.players.get(playerId);
    if (player?.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    this.players.delete(playerId);

    if (this.players.size === 0) {
      this.destroy();
      return { roomEmpty: true };
    }

    let newHostId: string | undefined;
    if (this.hostId === playerId) {
      // Transfer host to first available connected player
      const nextHost = Array.from(this.players.values()).find((p) => p.connected) || Array.from(this.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
        this.hostId = nextHost.id;
        newHostId = nextHost.id;
      }
    }

    // If match is active, check if win conditions are affected
    if (this.isMatchInProgress()) {
      this.evaluateWinCondition();
    }

    return { newHostId, roomEmpty: false };
  }

  public updateSettings(newSettings: Partial<RoomSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public setPlayerReady(playerId: string, ready: boolean): void {
    const player = this.players.get(playerId);
    if (player && this.state === 'LOBBY') {
      player.isReady = ready;
    }
  }

  /**
   * Authoritatively starts the match with role assignments.
   */
  public startMatch(customSettings?: Partial<RoomSettings>): { success: boolean; error?: string } {
    if (this.state !== 'LOBBY') {
      return { success: false, error: `Cannot start match while in '${this.state}' state` };
    }

    if (customSettings) {
      this.updateSettings(customSettings);
    }

    const playerList = this.getAllPlayersList();
    // Allow start if players >= 2 for development/testing flexibility, ideally numDisruptors + 1
    const minRequired = Math.max(2, this.settings.numDisruptors + 1);
    if (playerList.length < minRequired) {
      return {
        success: false,
        error: `Insufficient players to start: ${playerList.length} present, minimum ${minRequired} required`,
      };
    }

    // 1. Transition state machine: LOBBY -> STARTING -> PLAYING
    if (!canTransition(this.state, 'STARTING')) {
      return { success: false, error: 'Illegal state transition to STARTING' };
    }
    this.state = 'STARTING';

    // 2. Authoritative role assignment
    const shuffled = [...playerList].sort(() => Math.random() - 0.5);
    const disruptorCount = Math.min(this.settings.numDisruptors, Math.floor(playerList.length / 2) || 1);

    const disruptorIds = new Set<string>();
    for (let i = 0; i < disruptorCount; i++) {
      disruptorIds.add(shuffled[i].id);
    }

    const spawnPoint = FACILITY_ROOMS.central_junction.spawnPoint;

    for (const player of playerList) {
      const isDisruptor = disruptorIds.has(player.id);
      player.role = isDisruptor ? 'DISRUPTOR' : 'OPERATOR';
      player.isAlive = true;
      player.isReady = false;
      player.position = { x: spawnPoint.x + (Math.random() * 40 - 20), y: spawnPoint.y + (Math.random() * 40 - 20) };
      player.lastMovePosition = { ...player.position };
      player.lastMoveTimestamp = Date.now();
      player.currentRoom = 'central_junction';
      player.currentTask = null;
      player.emergencyMeetingsRemaining = this.settings.emergencyMeetingLimit;
      player.killCooldownRemaining = this.settings.killCooldown;
      player.sabotageCooldownRemaining = 15; // 15s initial grace cooldown

      // Assign tasks to Operators
      const assigned = assignTasksToPlayer(player.id, this.settings.operatorTaskCount);
      player.assignedTasks = assigned;
      player.tasks = assigned;
    }

    this.deadBodies = [];
    this.sabotageManager.reset();
    this.meetingManager.reset();
    this.taskMeter = calculateTaskMeter(playerList);
    this.gameOverSummary = null;

    // Transition to PLAYING
    this.state = 'PLAYING';
    this.countdownRemaining = null;

    return { success: true };
  }

  /**
   * Validates and updates player position with authoritative anti-cheat checks.
   */
  public handlePlayerMove(
    playerId: string,
    to: Position2D,
    timestamp: number,
    facing?: any
  ): { valid: boolean; reason?: string } {
    const player = this.players.get(playerId);
    if (!player) return { valid: false, reason: 'Player not found' };

    if (!player.connected) return { valid: false, reason: 'Player is disconnected' };

    // Movement is only permitted during active PLAYING state
    if (this.state !== 'PLAYING') {
      return { valid: false, reason: `Movement rejected during room state '${this.state}'` };
    }

    const now = Date.now();
    const deltaTimeMs = Math.max(1, now - (player.lastMoveTimestamp || now - 100));

    const maxSpeed = this.settings.playerSpeed || DEFAULT_ROOM_SETTINGS.playerSpeed || 200;
    const result = validateMovement(player.position, to, deltaTimeMs, maxSpeed);

    if (!result.valid) {
      player.speedViolationsCount++;
      return result;
    }

    // Apply movement
    player.position = { x: to.x, y: to.y };
    player.lastMovePosition = { x: to.x, y: to.y };
    player.lastMoveTimestamp = now;
    if (facing) player.facing = facing;
    player.currentRoom = result.detectedRoom ?? findCurrentFacilityRoom(to);

    return { valid: true };
  }

  /**
   * Authoritative Kill Execution.
   */
  public handleKillAttempt(
    killerId: string,
    targetPlayerId: string
  ): { success: boolean; error?: string } {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot kill outside of PLAYING state' };
    }

    const killer = this.players.get(killerId);
    if (!killer || killer.role !== 'DISRUPTOR' || !killer.isAlive) {
      return { success: false, error: 'Only living Disruptors can perform kills' };
    }

    if (killer.killCooldownRemaining > 0) {
      return {
        success: false,
        error: `Kill ability is on cooldown (${Math.ceil(killer.killCooldownRemaining)}s remaining)`,
      };
    }

    const victim = this.players.get(targetPlayerId);
    if (!victim || !victim.isAlive) {
      return { success: false, error: 'Target player is not alive' };
    }

    if (victim.role === 'DISRUPTOR') {
      return { success: false, error: 'Disruptors cannot eliminate fellow Disruptors' };
    }

    const killDistance = this.settings.killDistance || DEFAULT_ROOM_SETTINGS.killDistance || 75;
    const dist = distance2D(killer.position, victim.position);
    if (dist > killDistance * 1.3) {
      return {
        success: false,
        error: `Target is too far (${dist.toFixed(1)} > kill distance ${killDistance})`,
      };
    }

    // Execute kill
    victim.isAlive = false;
    killer.killCooldownRemaining = this.settings.killCooldown;

    // Place dead body at victim's coordinates
    const body: DeadBody = {
      id: `body_${victim.id}_${Date.now()}`,
      victimId: victim.id,
      victimName: victim.name,
      victimColor: victim.color,
      position: { x: victim.position.x, y: victim.position.y },
      room: victim.currentRoom,
      reported: false,
      createdAt: Date.now(),
    };
    this.deadBodies.push(body);

    if (this.eventListener) {
      this.eventListener.onPlayerKilled(victim.id, killer.id, body.position);
    }

    // Evaluate win condition immediately after kill
    this.evaluateWinCondition();

    return { success: true };
  }

  /**
   * Authoritative Dead Body Reporting.
   */
  public handleReportBody(reporterId: string, victimPlayerId: string): { success: boolean; error?: string } {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot report bodies outside of active match' };
    }

    const reporter = this.players.get(reporterId);
    if (!reporter || !reporter.isAlive) {
      return { success: false, error: 'Only living players can report dead bodies' };
    }

    const body = this.deadBodies.find((b) => b.victimId === victimPlayerId && !b.reported);
    if (!body) {
      return { success: false, error: 'No reportable dead body found for this victim' };
    }

    const dist = distance2D(reporter.position, body.position);
    if (dist > GAMEPLAY_CONSTANTS.REPORT_BODY_DISTANCE * 1.4) {
      return { success: false, error: 'Reporter is too far from the dead body' };
    }

    body.reported = true;
    body.reportedBy = reporter.id;

    const victim = this.players.get(victimPlayerId);

    // Call meeting
    return this.triggerMeeting('BODY_REPORTED', reporter, victim);
  }

  /**
   * Authoritative Emergency Button Call.
   */
  public handleCallEmergencyMeeting(callerId: string): { success: boolean; error?: string } {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot call emergency meeting outside of active match' };
    }

    const caller = this.players.get(callerId);
    if (!caller || !caller.isAlive) {
      return { success: false, error: 'Only living players can call emergency meetings' };
    }

    if (caller.emergencyMeetingsRemaining <= 0) {
      return { success: false, error: 'No emergency meetings remaining for this player' };
    }

    // Emergency button disabled during active critical sabotage
    const activeSabotage = this.sabotageManager.getActiveSabotage();
    if (activeSabotage && activeSabotage.isCritical) {
      return { success: false, error: 'Emergency button is offline during critical crisis' };
    }

    const consolePos = FACILITY_ROOMS.central_junction.emergencyConsole || { x: 1200, y: 900 };
    const dist = distance2D(caller.position, consolePos);
    if (dist > GAMEPLAY_CONSTANTS.EMERGENCY_BUTTON_DISTANCE * 1.5) {
      return { success: false, error: 'Caller is too far from the emergency console' };
    }

    caller.emergencyMeetingsRemaining--;
    return this.triggerMeeting('EMERGENCY_BUTTON', caller);
  }

  private triggerMeeting(
    triggerType: 'EMERGENCY_BUTTON' | 'BODY_REPORTED',
    caller: ServerPlayer,
    victim?: ServerPlayer
  ): { success: boolean; error?: string } {
    if (!canTransition(this.state, 'MEETING')) {
      return { success: false, error: `Illegal transition from ${this.state} to MEETING` };
    }

    this.state = 'MEETING';

    // Clear active non-critical sabotage or door lockdowns
    const sabotage = this.sabotageManager.getActiveSabotage();
    if (sabotage && !sabotage.isCritical) {
      this.sabotageManager.clearActiveSabotage();
    }

    // Clean up all dead bodies
    this.deadBodies = [];

    // Gather living players to Central Junction for the meeting
    const junctionSpawn = FACILITY_ROOMS.central_junction.spawnPoint;
    for (const player of this.players.values()) {
      if (player.isAlive) {
        player.position = { ...junctionSpawn };
        player.currentRoom = 'central_junction';
      }
    }

    const meeting = this.meetingManager.startMeeting({
      triggerType,
      caller,
      settings: this.settings,
      reportedVictim: victim,
    });

    if (this.eventListener) {
      this.eventListener.onMeetingStarted(meeting);
      this.eventListener.onRoomStateChanged(this);
    }

    return { success: true };
  }

  public handleCastVote(voterId: string, targetId: string): { success: boolean; error?: string } {
    const livingIds = this.getLivingPlayersList().map((p) => p.id);
    const res = this.meetingManager.castVote(voterId, targetId, livingIds);
    if (res.success && this.eventListener) {
      this.eventListener.onRoomStateChanged(this);
    }
    return res;
  }

  public handleSkipVote(voterId: string): { success: boolean; error?: string } {
    const livingIds = this.getLivingPlayersList().map((p) => p.id);
    const res = this.meetingManager.castVote(voterId, 'SKIP', livingIds);
    if (res.success && this.eventListener) {
      this.eventListener.onRoomStateChanged(this);
    }
    return res;
  }

  public handleTaskInteract(playerId: string, taskId: string, action: 'start' | 'cancel'): { success: boolean; error?: string } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot interact with tasks outside of active match' };
    }

    const task = player.assignedTasks.find((t) => t.taskId === taskId);
    if (!task) return { success: false, error: 'Task not assigned to this player' };

    if (action === 'start') {
      if (!isPlayerNearTask(player.position, taskId)) {
        return { success: false, error: 'Player is too far from task console' };
      }
      player.currentTask = taskId;
      if (task.status === 'NOT_STARTED') {
        task.status = 'IN_PROGRESS';
      }
    } else {
      player.currentTask = null;
    }

    return { success: true };
  }

  public handleTaskComplete(playerId: string, taskId: string): { success: boolean; percent: number; error?: string } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, percent: 0, error: 'Player not found' };

    if (this.state !== 'PLAYING') {
      return { success: false, percent: 0, error: 'Cannot complete tasks outside of active match' };
    }

    const taskList = player.tasks || player.assignedTasks || [];
    const task = taskList.find((t) => t.id === taskId || t.taskId === taskId);
    if (!task) return { success: false, percent: 0, error: 'Task not assigned to this player' };

    if (task.status === 'COMPLETED') {
      return { success: true, percent: this.taskMeter.progressPercent };
    }

    const dist = distance2D(player.position, task.location);
    const maxAllowedDist = (GAMEPLAY_CONSTANTS.INTERACT_RADIUS || 65) * 1.5;
    if (dist > maxAllowedDist) {
      return { success: false, percent: 0, error: `Too far from station (${dist.toFixed(1)} > ${maxAllowedDist})` };
    }

    task.status = 'COMPLETED';
    task.completedAt = Date.now();
    player.currentTask = null;

    // Recalculate task meter
    this.taskMeter = calculateTaskMeter(this.getAllPlayersList());

    if (this.eventListener) {
      this.eventListener.onTaskProgress(this.taskMeter, player.id, taskId);
    }

    // Check win condition
    this.evaluateWinCondition();

    return { success: true, percent: this.taskMeter.progressPercent };
  }

  public handleTriggerSabotage(
    playerId: string,
    type: SabotageType,
    targetRoom?: FacilityRoomId
  ): { success: boolean; error?: string } {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot sabotage outside of PLAYING state' };
    }

    const player = this.players.get(playerId);
    if (!player || player.role !== 'DISRUPTOR' || !player.isAlive) {
      return { success: false, error: 'Only living Disruptors can trigger sabotages' };
    }

    if (player.sabotageCooldownRemaining <= 0) {
      this.sabotageManager.setSabotageCooldown(0);
    }

    const res = this.sabotageManager.triggerSabotage(type, targetRoom);
    if (res.success && res.sabotage && this.eventListener) {
      this.eventListener.onSabotageActive(res.sabotage);
      this.eventListener.onRoomStateChanged(this);
    }

    return res;
  }

  public handleRepairSabotage(
    playerId: string,
    type: SabotageType,
    stationId?: string
  ): { success: boolean; error?: string } {
    if (this.state !== 'PLAYING') {
      return { success: false, error: 'Cannot repair sabotage outside of active match' };
    }

    const player = this.players.get(playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'Only living players can repair sabotages' };
    }

    const res = this.sabotageManager.repairStation(type, stationId, player.id, player.position);
    if (res.success) {
      if (res.cleared && this.eventListener) {
        this.eventListener.onSabotageCleared(type);
      }
      if (this.eventListener) {
        this.eventListener.onRoomStateChanged(this);
      }
    }

    return res;
  }

  /**
   * Main game server tick loop.
   */
  public tick(deltaSec: number): void {
    if (this.state === 'STARTING') {
      if (this.countdownRemaining !== null) {
        this.countdownRemaining -= deltaSec;
        if (this.countdownRemaining <= 0) {
          this.countdownRemaining = null;
          this.state = 'PLAYING';
          if (this.eventListener) {
            this.eventListener.onRoomStateChanged(this);
          }
        }
      }
      return;
    }

    if (this.state === 'PLAYING') {
      // 1. Tick cooldowns for disruptors
      for (const player of this.players.values()) {
        if (player.role === 'DISRUPTOR') {
          if (player.killCooldownRemaining > 0) {
            player.killCooldownRemaining = Math.max(0, player.killCooldownRemaining - deltaSec);
          }
        }
      }

      // 2. Tick sabotages
      const { criticalExpired } = this.sabotageManager.tick(deltaSec);
      if (criticalExpired) {
        this.triggerGameOver('DISRUPTORS', 'CRITICAL_SABOTAGE_COLLAPSE');
        return;
      }
    } else if (this.state === 'MEETING') {
      const livingIds = this.getLivingPlayersList().map((p) => p.id);
      const { phaseChanged, meetingResolved, result } = this.meetingManager.tick(
        deltaSec,
        this.settings,
        livingIds
      );

      if (meetingResolved && result) {
        this.state = 'VOTING_RESULTS';
        this.handleMeetingEjection(result);
        if (this.eventListener) {
          this.eventListener.onMeetingResult(result);
          this.eventListener.onRoomStateChanged(this);
        }
      } else if (phaseChanged) {
        if (this.eventListener) {
          this.eventListener.onRoomStateChanged(this);
        }
      }
    } else if (this.state === 'VOTING_RESULTS') {
      const livingIds = this.getLivingPlayersList().map((p) => p.id);
      const { phaseChanged } = this.meetingManager.tick(deltaSec, this.settings, livingIds);
      if (phaseChanged && !this.meetingManager.isInMeeting()) {
        // Meeting is complete, transition back to PLAYING if not game over
        if (this.state === 'VOTING_RESULTS' && canTransition(this.state, 'PLAYING')) {
          this.state = 'PLAYING';
          // Reset kill cooldowns when resuming match
          for (const player of this.players.values()) {
            if (player.role === 'DISRUPTOR') {
              player.killCooldownRemaining = this.settings.killCooldown;
            }
          }
          if (this.eventListener) {
            this.eventListener.onRoomStateChanged(this);
          }
        }
      }
    }
  }

  private handleMeetingEjection(result: MeetingResult): void {
    if (result.ejectedPlayerId) {
      const victim = this.players.get(result.ejectedPlayerId);
      if (victim) {
        victim.isAlive = false;
        result.ejectedPlayerName = victim.name;

        if (this.settings.confirmEjects) {
          result.ejectedPlayerRole = victim.role;
          result.wasDisruptor = victim.role === 'DISRUPTOR';
          const remainingDisruptors = this.getAllPlayersList().filter((p) => p.role === 'DISRUPTOR' && p.isAlive).length;
          result.remainingDisruptors = remainingDisruptors;
        }
      }
    }

    // Check win condition after ejection
    this.evaluateWinCondition();
  }

  /**
   * Authoritatively evaluates win conditions.
   */
  public evaluateWinCondition(): GameOverSummary | null {
    if (!this.isMatchInProgress()) return null;

    const summary = checkWinCondition({
      players: this.getAllPlayersList().map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isAlive: p.isAlive,
      })),
      completedTasks: this.taskMeter.completedTasks,
      totalTasks: this.taskMeter.totalTasks,
      criticalSabotageExpired: false,
    });

    if (summary) {
      this.triggerGameOver(summary.winner, summary.reason, summary);
      return summary;
    }

    return null;
  }

  public triggerGameOver(
    winner: 'OPERATORS' | 'DISRUPTORS',
    reason: any,
    summaryOverride?: GameOverSummary
  ): void {
    if (this.state === 'GAME_OVER') return;

    this.state = 'GAME_OVER';

    const disruptorIds = this.getAllPlayersList().filter((p) => p.role === 'DISRUPTOR').map((p) => p.id);
    this.gameOverSummary = summaryOverride || {
      winner,
      reason,
      disruptorIds,
      allPlayers: this.getAllPlayersList().map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isAlive: p.isAlive,
      })),
    };

    if (this.eventListener) {
      this.eventListener.onGameOver(this.gameOverSummary);
      this.eventListener.onRoomStateChanged(this);
    }
  }

  public isMatchInProgress(): boolean {
    return (
      this.state === 'PLAYING' ||
      this.state === 'MEETING' ||
      this.state === 'VOTING_RESULTS'
    );
  }

  /**
   * Generates sanitized room state view for a specific player (STRICT ANTI-CHEAT).
   */
  public getSanitizedStateForPlayer(viewerId: string): RoomStateView {
    const viewer = this.players.get(viewerId);
    const viewerRole = viewer?.role;
    const isGameOver = this.state === 'GAME_OVER';

    const playerViews = sanitizePlayerRosterForClient(
      this.getAllPlayersList(),
      viewerId,
      viewerRole,
      isGameOver
    );

    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      state: this.state,
      settings: { ...this.settings },
      players: playerViews,
      deadBodies: this.deadBodies.map((b) => ({ ...b })),
      taskMeter: { ...this.taskMeter },
      activeSabotage: this.sabotageManager.getActiveSabotage(),
      currentMeeting: this.meetingManager.getCurrentMeeting(),
      lastMeetingResult: this.meetingManager.getLastMeetingResult(),
      gameOverSummary: this.gameOverSummary,
      countdownRemaining: this.countdownRemaining,
    };
  }

  /**
   * Generates private player view (including private role, assigned tasks, cooldowns).
   */
  public getPrivateViewForPlayer(playerId: string): PlayerPrivateView | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    const disruptorPeers =
      player.role === 'DISRUPTOR'
        ? this.getAllPlayersList().filter((p) => p.role === 'DISRUPTOR' && p.id !== player.id).map((p) => p.id)
        : undefined;

    return {
      id: player.id,
      name: player.name,
      color: player.color,
      cosmetic: player.cosmetic,
      role: player.role,
      isAlive: player.isAlive,
      isReady: player.isReady,
      position: { ...player.position },
      facing: player.facing,
      currentRoom: player.currentRoom,
      currentTask: player.currentTask,
      isHost: player.isHost,
      connected: player.connected,
      assignedTasks: player.assignedTasks.map((t) => ({ ...t })),
      disruptorPeers,
      killCooldownRemaining: player.killCooldownRemaining,
      sabotageCooldownRemaining: this.sabotageManager.getSabotageCooldown(),
      emergencyMeetingsRemaining: player.emergencyMeetingsRemaining,
    };
  }

  public resetToLobby(): void {
    if (this.state !== 'GAME_OVER') return;
    this.state = 'LOBBY';
    this.deadBodies = [];
    this.sabotageManager.reset();
    this.meetingManager.reset();
    this.gameOverSummary = null;

    for (const player of this.players.values()) {
      player.isReady = false;
      player.isAlive = true;
      player.currentTask = null;
      player.assignedTasks = [];
    }

    if (this.eventListener) {
      this.eventListener.onRoomStateChanged(this);
    }
  }

  public destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    for (const player of this.players.values()) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
    }
    this.players.clear();
  }
}
