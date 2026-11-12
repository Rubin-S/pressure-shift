import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  PlayerPublicView,
  PlayerPrivateView,
  RoomStateView,
  RoomState,
  RoomSettings,
  PlayerRole,
  PlayerTask,
  ActiveSabotage,
  MeetingState,
  MeetingResult,
  GameOverSummary,
  ChatMessageBroadcastPayload,
  RoomErrorPayload,
  SabotageType,
  FacilityRoomId,
  DEFAULT_ROOM_SETTINGS,
  DeadBody,
  TaskMeterState,
} from '@pressure-shift/shared';
import { networkManager } from '../../network/socket.js';
import { NetworkConnectionStatus, UserSession } from '../../network/types.js';
import { soundEngine } from '../audio/soundEngine.js';
import { gameBridge, InteractableTarget } from '../bridge/gameBridge.js';

interface GameContextType {
  // Network & Session
  connectionStatus: NetworkConnectionStatus;
  latency: number;
  toast: { message: string; type: 'error' | 'info' | 'success' | 'alert' } | null;
  dismissToast: () => void;

  // Player Profile
  localPlayerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  playerCosmetic: string;
  setPlayerCosmetic: (cosmetic: string) => void;
  isHost: boolean;
  role: PlayerRole;
  isAlive: boolean;
  disruptorPeers: string[];
  assignedTasks: PlayerTask[];
  killCooldown: number;
  sabotageCooldown: number;
  emergencyMeetingsRemaining: number;

  // Room & Match
  roomCode: string | null;
  roomState: RoomState;
  roomSettings: RoomSettings;
  updateRoomSettings: (settings: Partial<RoomSettings>) => void;
  players: PlayerPublicView[];
  deadBodies: DeadBody[];
  taskMeter: TaskMeterState;
  activeSabotage: ActiveSabotage | null;
  currentMeeting: MeetingState | null;
  lastMeetingResult: MeetingResult | null;
  gameOverSummary: GameOverSummary | null;
  countdownRemaining: number | null;

  // Interactivity & Overlays
  nearbyInteractable: InteractableTarget;
  killableTargetId: string | null;
  reportableBodyId: string | null;
  currentRoomName: string;
  localPlayerPos: { x: number; y: number };
  activeTaskModal: PlayerTask | null;
  activeSabotageRepairModal: { type: SabotageType; stationId?: string } | null;
  isMinimapOpen: boolean;
  isSabotageMenuOpen: boolean;
  isChatOpen: boolean;
  chatMessages: ChatMessageBroadcastPayload[];
  hasVoted: boolean;

  // Visual & Sound Settings
  crtShaderEnabled: boolean;
  soundMuted: boolean;
  touchControlsEnabled: boolean;
  toggleCrtShader: () => void;
  toggleSound: () => void;
  toggleTouchControls: () => void;
  toggleMinimap: () => void;
  toggleSabotageMenu: () => void;
  toggleChat: () => void;

  // Actions
  createRoom: (name?: string, color?: string, cosmetic?: string, settings?: Partial<RoomSettings>) => Promise<void>;
  joinRoom: (code: string, name?: string, color?: string, cosmetic?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  openTaskModal: (task: PlayerTask) => void;
  closeTaskModal: () => void;
  completeTask: (taskId: string, proof?: Record<string, unknown>) => Promise<void>;
  openSabotageRepairModal: (type: SabotageType, stationId?: string) => void;
  closeSabotageRepairModal: () => void;
  triggerSabotage: (type: SabotageType, targetRoom?: FacilityRoomId) => Promise<void>;
  repairSabotage: (type: SabotageType, stationId?: string, stepData?: Record<string, unknown>) => Promise<void>;
  attemptKill: () => Promise<void>;
  reportBody: () => Promise<void>;
  callEmergencyMeeting: () => Promise<void>;
  castVote: (votedPlayerId: string) => Promise<void>;
  skipVote: () => Promise<void>;
  sendChat: (text: string) => Promise<void>;
  returnToLobby: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSession = useRef<UserSession>(networkManager.loadSavedSession()).current;

  // Network & Session
  const [connectionStatus, setConnectionStatus] = useState<NetworkConnectionStatus>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' | 'alert' } | null>(null);

  // Profile
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(initialSession.playerId || null);
  const [playerName, setPlayerName] = useState<string>(initialSession.playerName || 'Cadet');
  const [playerColor, setPlayerColor] = useState<string>(initialSession.color || 'neon_cyan');
  const [playerCosmetic, setPlayerCosmetic] = useState<string>(initialSession.cosmetic || 'standard_helm');
  const [role, setRole] = useState<PlayerRole>('OPERATOR');
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [disruptorPeers, setDisruptorPeers] = useState<string[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<PlayerTask[]>([]);
  const [killCooldown, setKillCooldown] = useState<number>(0);
  const [sabotageCooldown, setSabotageCooldown] = useState<number>(0);
  const [emergencyMeetingsRemaining, setEmergencyMeetingsRemaining] = useState<number>(1);

  // Room State
  const [roomCode, setRoomCode] = useState<string | null>(initialSession.roomCode || null);
  const [roomState, setRoomState] = useState<RoomState>('LOBBY');
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [players, setPlayers] = useState<PlayerPublicView[]>([]);
  const [deadBodies, setDeadBodies] = useState<DeadBody[]>([]);
  const [taskMeter, setTaskMeter] = useState<TaskMeterState>({ completedTasks: 0, totalTasks: 0, progressPercent: 0 });
  const [activeSabotage, setActiveSabotage] = useState<ActiveSabotage | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingState | null>(null);
  const [lastMeetingResult, setLastMeetingResult] = useState<MeetingResult | null>(null);
  const [gameOverSummary, setGameOverSummary] = useState<GameOverSummary | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);

  // UI Interactivity
  const [nearbyInteractable, setNearbyInteractable] = useState<InteractableTarget>(null);
  const [killableTargetId, setKillableTargetId] = useState<string | null>(null);
  const [reportableBodyId, setReportableBodyId] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>('docking_cradle');
  const [localPlayerPos, setLocalPlayerPos] = useState<{ x: number; y: number }>({ x: 350, y: 300 });
  const [activeTaskModal, setActiveTaskModal] = useState<PlayerTask | null>(null);
  const [activeSabotageRepairModal, setActiveSabotageRepairModal] = useState<{ type: SabotageType; stationId?: string } | null>(null);
  const [isMinimapOpen, setIsMinimapOpen] = useState<boolean>(false);
  const [isSabotageMenuOpen, setIsSabotageMenuOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageBroadcastPayload[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // Visuals & Sound
  const [crtShaderEnabled, setCrtShaderEnabled] = useState<boolean>(true);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState<boolean>(false);

  // Toast helper
  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' | 'alert' = 'info') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Update room settings (host only)
  const updateRoomSettings = useCallback((newSettings: Partial<RoomSettings>) => {
    setRoomSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Local player isHost calculation
  const isHost = players.find((p) => p.id === localPlayerId)?.isHost ?? false;

  // Save session when profile changes
  useEffect(() => {
    networkManager.saveSession({
      playerName,
      color: playerColor,
      cosmetic: playerCosmetic,
      roomCode: roomCode || undefined,
      playerId: localPlayerId || undefined,
    });
  }, [playerName, playerColor, playerCosmetic, roomCode, localPlayerId]);

  // Setup Network Listeners
  useEffect(() => {
    networkManager.setCallbacks({
      onConnectionStatus: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          showToast('Connected to Sub-Oceanic Dispatch', 'info');
        } else if (status === 'reconnecting') {
          showToast('Acoustic link unstable - reconnecting...', 'alert');
        } else if (status === 'error') {
          showToast('Failed to connect to facility server', 'error');
        }
      },
      onLatency: (ping) => {
        setLatency(ping);
      },
      onRoomState: (state: RoomStateView) => {
        setRoomCode(state.roomCode);
        setRoomState(state.state);
        setRoomSettings(state.settings);
        setPlayers(state.players);
        setDeadBodies(state.deadBodies);
        setTaskMeter(state.taskMeter);
        setActiveSabotage(state.activeSabotage);
        setCurrentMeeting(state.currentMeeting);
        setLastMeetingResult(state.lastMeetingResult);
        setGameOverSummary(state.gameOverSummary);
        setCountdownRemaining(state.countdownRemaining ?? null);

        // Update local player alive status from roster
        if (localPlayerId) {
          const me = state.players.find((p) => p.id === localPlayerId);
          if (me) {
            setIsAlive(me.isAlive);
            if (me.role) setRole(me.role);
          }
        }
      },
      onGameStart: (data) => {
        setRole(data.role as PlayerRole);
        setIsAlive(true);
        setLocalPlayerId(data.yourPlayerId);
        setAssignedTasks(data.assignedTasks || []);
        if (data.disruptorPeers) setDisruptorPeers(data.disruptorPeers);
        setKillCooldown(data.settings?.killCooldown || 25);
        setSabotageCooldown(15);
        setRoomState('PLAYING');
        soundEngine.playSonarPing();
        showToast(data.role === 'DISRUPTOR' ? 'YOU ARE A DISRUPTOR. Sabotage the facility and eliminate Operators.' : 'YOU ARE AN OPERATOR. Complete all tasks or eject all Disruptors.', data.role === 'DISRUPTOR' ? 'alert' : 'info');
      },
      onSyncState: (data) => {
        setRoomCode(data.room.roomCode);
        setRoomState(data.room.state);
        setRoomSettings(data.room.settings);
        setPlayers(data.room.players);
        setDeadBodies(data.room.deadBodies);
        setTaskMeter(data.room.taskMeter);
        setActiveSabotage(data.room.activeSabotage);
        setCurrentMeeting(data.room.currentMeeting);
        setLastMeetingResult(data.room.lastMeetingResult);
        setGameOverSummary(data.room.gameOverSummary);

        const me = data.yourPlayer;
        setLocalPlayerId(me.id);
        setRole(me.role);
        setIsAlive(me.isAlive);
        setAssignedTasks(me.assignedTasks || []);
        if (me.disruptorPeers) setDisruptorPeers(me.disruptorPeers);
        if (typeof me.killCooldownRemaining === 'number') setKillCooldown(me.killCooldownRemaining);
        if (typeof me.sabotageCooldownRemaining === 'number') setSabotageCooldown(me.sabotageCooldownRemaining);
        setEmergencyMeetingsRemaining(me.emergencyMeetingsRemaining ?? 1);
      },
      onPlayerJoined: (player) => {
        setPlayers((prev) => {
          if (prev.some((p) => p.id === player.id)) return prev;
          return [...prev, player];
        });
        soundEngine.playClick(600);
      },
      onPlayerLeft: ({ playerId, reason, newHostId }) => {
        setPlayers((prev) =>
          prev.filter((p) => p.id !== playerId).map((p) => (p.id === newHostId ? { ...p, isHost: true } : p))
        );
        showToast(`Crew member left: ${reason || 'Disconnected'}`, 'info');
      },
      onPlayerMoved: ({ playerId, x, y, facing }) => {
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, position: { x, y }, facing: (facing as any) || p.facing } : p))
        );
      },
      onTaskAssigned: (tasks) => {
        setAssignedTasks(tasks);
      },
      onTaskProgress: (data) => {
        setTaskMeter({
          completedTasks: data.totalCompleted,
          totalTasks: data.totalTasks,
          progressPercent: data.percent,
        });
      },
      onSabotageActive: (sabotage) => {
        setActiveSabotage(sabotage);
        soundEngine.playSabotage();
        if (sabotage.isCritical) {
          soundEngine.startEmergencyAlarm();
          showToast(`CRITICAL ALARM: ${sabotage.name}! Repair immediately!`, 'alert');
        } else {
          showToast(`SABOTAGE ACTIVE: ${sabotage.name}`, 'alert');
        }
      },
      onSabotageCleared: () => {
        setActiveSabotage(null);
        soundEngine.stopEmergencyAlarm();
        showToast('Sabotage Cleared: Sub-systems normalized', 'success');
      },
      onPlayerKilled: ({ victimId }) => {
        soundEngine.playKill();
        if (victimId === localPlayerId) {
          setIsAlive(false);
          showToast('You were eliminated! You are now a Spectator ghost.', 'error');
        }
      },
      onMeetingStarted: (meeting) => {
        setCurrentMeeting(meeting);
        setRoomState('MEETING');
        setHasVoted(false);
        setActiveTaskModal(null);
        setActiveSabotageRepairModal(null);
        setIsSabotageMenuOpen(false);
        soundEngine.startEmergencyAlarm();
        setTimeout(() => soundEngine.stopEmergencyAlarm(), 2500);
        showToast(`EMERGENCY MEETING CALLED by ${meeting.callerName}`, 'alert');
      },
      onVoteUpdate: (data) => {
        if (localPlayerId && data.votedPlayerIds.includes(localPlayerId)) {
          setHasVoted(true);
        }
        soundEngine.playTimerTick();
      },
      onMeetingResult: (result) => {
        setLastMeetingResult(result);
        setRoomState('VOTING_RESULTS');
        soundEngine.playEjection();
      },
      onGameOver: (summary) => {
        setGameOverSummary(summary.summary);
        setRoomState('GAME_OVER');
        soundEngine.stopEmergencyAlarm();
        if (summary.winner === 'OPERATORS') {
          soundEngine.playTaskComplete();
        } else {
          soundEngine.playKill();
        }
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => [...prev.slice(-49), msg]);
        soundEngine.playClick(900);
      },
      onError: (err: RoomErrorPayload) => {
        showToast(`Error: ${err.message}`, 'error');
        soundEngine.playError();
      },
    });

    // Auto-connect socket
    networkManager.connect();

    // Listen to gameBridge events from Phaser
    const unbindInteractableIn = gameBridge.on('interactable:in_range', (info) => {
      setNearbyInteractable({
        type: info.type as any,
        id: info.id,
        name: info.name,
        room: info.room || undefined,
        details: info.metadata,
      });
      if (info.type === 'body') {
        setReportableBodyId(info.id);
      }
    });

    const unbindInteractableOut = gameBridge.on('interactable:out_of_range', () => {
      setNearbyInteractable(null);
      setReportableBodyId(null);
    });

    const unbindKillTarget = gameBridge.on('kill_target:updated', (target) => {
      setKillableTargetId(target ? target.targetId : null);
    });

    const unbindPlayerMoved = gameBridge.on('player:moved', (payload) => {
      setLocalPlayerPos({ x: payload.x, y: payload.y });
    });

    const unbindRoomChanged = gameBridge.on('player:room_changed', (newRoom) => {
      setCurrentRoomName(newRoom);
    });

    return () => {
      unbindInteractableIn();
      unbindInteractableOut();
      unbindKillTarget();
      unbindPlayerMoved();
      unbindRoomChanged();
    };
  }, [localPlayerId, showToast]);

  // Timers countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      // Countdown for match start
      setCountdownRemaining((prev) => (prev && prev > 0 ? prev - 1 : null));

      // Kill cooldown
      setKillCooldown((prev) => (prev > 0 ? prev - 1 : 0));

      // Sabotage cooldown
      setSabotageCooldown((prev) => (prev > 0 ? prev - 1 : 0));

      // Meeting timer
      setCurrentMeeting((prev) => {
        if (!prev) return null;
        if (prev.phaseTimeRemaining <= 1) return prev;
        return { ...prev, phaseTimeRemaining: prev.phaseTimeRemaining - 1 };
      });

      // Sabotage critical timer
      setActiveSabotage((prev) => {
        if (!prev || prev.timeRemaining === null) return prev;
        if (prev.timeRemaining <= 1) return { ...prev, timeRemaining: 0 };
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Actions
  const createRoom = useCallback(
    async (name?: string, color?: string, cosmetic?: string, settings?: Partial<RoomSettings>) => {
      try {
        const pName = name || playerName;
        const pColor = color || playerColor;
        const pCosmetic = cosmetic || playerCosmetic;
        const res = await networkManager.createRoom({
          playerName: pName,
          color: pColor,
          cosmetic: pCosmetic,
          roomSettings: settings || roomSettings,
        });
        setRoomCode(res.roomCode);
        setLocalPlayerId(res.playerId);
        setRoomState('LOBBY');
        showToast(`Created Room ${res.roomCode}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to create room', 'error');
        soundEngine.playError();
      }
    },
    [playerName, playerColor, playerCosmetic, roomSettings, showToast]
  );

  const joinRoom = useCallback(
    async (code: string, name?: string, color?: string, cosmetic?: string) => {
      try {
        const pName = name || playerName;
        const pColor = color || playerColor;
        const pCosmetic = cosmetic || playerCosmetic;
        const res = await networkManager.joinRoom({
          roomCode: code.toUpperCase(),
          playerName: pName,
          color: pColor,
          cosmetic: pCosmetic,
        });
        setRoomCode(res.roomCode);
        setLocalPlayerId(res.playerId);
        setRoomState('LOBBY');
        showToast(`Joined Room ${res.roomCode}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to join room', 'error');
        soundEngine.playError();
      }
    },
    [playerName, playerColor, playerCosmetic, showToast]
  );

  const leaveRoom = useCallback(async () => {
    try {
      await networkManager.leaveRoom();
      setRoomCode(null);
      setRoomState('LOBBY');
      setPlayers([]);
      setAssignedTasks([]);
      setActiveSabotage(null);
      setCurrentMeeting(null);
      setGameOverSummary(null);
      showToast('Left the room', 'info');
    } catch (err: any) {
      showToast(err.message || 'Error leaving room', 'error');
    }
  }, [showToast]);

  const toggleReady = useCallback(async () => {
    const me = players.find((p) => p.id === localPlayerId);
    const nextReady = !me?.isReady;
    try {
      await networkManager.setReady(nextReady);
      soundEngine.playClick();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }, [players, localPlayerId, showToast]);

  const startGame = useCallback(async () => {
    try {
      await networkManager.startGame({ settings: roomSettings });
      soundEngine.playClick();
    } catch (err: any) {
      showToast(err.message, 'error');
      soundEngine.playError();
    }
  }, [roomSettings, showToast]);

  const openTaskModal = useCallback((task: PlayerTask) => {
    setActiveTaskModal(task);
    gameBridge.setMovementEnabled(false);
    networkManager.interactTask(task.taskId, 'start').catch(() => {});
    soundEngine.playClick(950);
  }, []);

  const closeTaskModal = useCallback(() => {
    if (activeTaskModal) {
      networkManager.interactTask(activeTaskModal.taskId, 'cancel').catch(() => {});
    }
    setActiveTaskModal(null);
    gameBridge.setMovementEnabled(true);
    soundEngine.playClick(400);
  }, [activeTaskModal]);

  const completeTask = useCallback(
    async (taskId: string, proof?: Record<string, unknown>) => {
      try {
        await networkManager.completeTask(taskId, proof);
        setAssignedTasks((prev) =>
          prev.map((t) => (t.taskId === taskId ? { ...t, status: 'COMPLETED', completedAt: Date.now() } : t))
        );
        soundEngine.playTaskComplete();
        showToast('Task Complete!', 'success');
        closeTaskModal();
      } catch (err: any) {
        showToast(err.message || 'Failed to complete task', 'error');
        soundEngine.playError();
      }
    },
    [closeTaskModal, showToast]
  );

  const openSabotageRepairModal = useCallback((type: SabotageType, stationId?: string) => {
    setActiveSabotageRepairModal({ type, stationId });
    gameBridge.setMovementEnabled(false);
    soundEngine.playClick(900);
  }, []);

  const closeSabotageRepairModal = useCallback(() => {
    setActiveSabotageRepairModal(null);
    gameBridge.setMovementEnabled(true);
    soundEngine.playClick(400);
  }, []);

  const triggerSabotage = useCallback(
    async (type: SabotageType, targetRoom?: FacilityRoomId) => {
      try {
        await networkManager.triggerSabotage(type, targetRoom);
        setSabotageCooldown(30);
        setIsSabotageMenuOpen(false);
        soundEngine.playSabotage();
        showToast(`Sabotage Triggered: ${type}`, 'alert');
      } catch (err: any) {
        showToast(err.message || 'Sabotage failed', 'error');
        soundEngine.playError();
      }
    },
    [showToast]
  );

  const repairSabotage = useCallback(
    async (type: SabotageType, stationId?: string, stepData?: Record<string, unknown>) => {
      try {
        await networkManager.repairSabotage(type, stationId, stepData);
        closeSabotageRepairModal();
        soundEngine.playTaskComplete();
        showToast('Sabotage station repaired!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Repair failed', 'error');
        soundEngine.playError();
      }
    },
    [closeSabotageRepairModal, showToast]
  );

  const attemptKill = useCallback(async () => {
    if (!killableTargetId) return;
    try {
      await networkManager.attemptKill(killableTargetId);
      setKillCooldown(roomSettings.killCooldown || 25);
      soundEngine.playKill();
    } catch (err: any) {
      showToast(err.message || 'Kill attempt failed', 'error');
      soundEngine.playError();
    }
  }, [killableTargetId, roomSettings.killCooldown, showToast]);

  const reportBody = useCallback(async () => {
    if (!reportableBodyId) return;
    try {
      await networkManager.reportBody(reportableBodyId);
      soundEngine.playClick(750);
    } catch (err: any) {
      showToast(err.message || 'Failed to report body', 'error');
      soundEngine.playError();
    }
  }, [reportableBodyId, showToast]);

  const callEmergencyMeeting = useCallback(async () => {
    try {
      await networkManager.callMeeting('Emergency Console Button Activated');
      soundEngine.playClick(600);
    } catch (err: any) {
      showToast(err.message || 'Cannot call meeting', 'error');
      soundEngine.playError();
    }
  }, [showToast]);

  const castVote = useCallback(
    async (votedPlayerId: string) => {
      try {
        await networkManager.castVote(votedPlayerId);
        setHasVoted(true);
        soundEngine.playClick(1000);
        showToast('Vote confirmed', 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to cast vote', 'error');
        soundEngine.playError();
      }
    },
    [showToast]
  );

  const skipVote = useCallback(async () => {
    try {
      await networkManager.skipVote('Abstain');
      setHasVoted(true);
      soundEngine.playClick(700);
      showToast('Vote skipped', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to skip vote', 'error');
      soundEngine.playError();
    }
  }, [showToast]);

  const sendChat = useCallback(
    async (text: string) => {
      try {
        await networkManager.sendChatMessage(text);
      } catch (err: any) {
        showToast(err.message || 'Chat message failed', 'error');
      }
    },
    [showToast]
  );

  const returnToLobby = useCallback(() => {
    setRoomState('LOBBY');
    setGameOverSummary(null);
    setCurrentMeeting(null);
    setLastMeetingResult(null);
    setActiveSabotage(null);
  }, []);

  const toggleCrtShader = useCallback(() => {
    setCrtShaderEnabled((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    const next = soundEngine.toggleMute();
    setSoundMuted(next);
  }, []);

  const toggleTouchControls = useCallback(() => {
    setTouchControlsEnabled((prev) => !prev);
  }, []);

  const toggleMinimap = useCallback(() => {
    setIsMinimapOpen((prev) => !prev);
    soundEngine.playClick(800);
  }, []);

  const toggleSabotageMenu = useCallback(() => {
    setIsSabotageMenuOpen((prev) => !prev);
    soundEngine.playClick(850);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
    soundEngine.playClick(750);
  }, []);

  return (
    <GameContext.Provider
      value={{
        connectionStatus,
        latency,
        toast,
        dismissToast,
        localPlayerId,
        playerName,
        setPlayerName,
        playerColor,
        setPlayerColor,
        playerCosmetic,
        setPlayerCosmetic,
        isHost,
        role,
        isAlive,
        disruptorPeers,
        assignedTasks,
        killCooldown,
        sabotageCooldown,
        emergencyMeetingsRemaining,
        roomCode,
        roomState,
        roomSettings,
        updateRoomSettings,
        players,
        deadBodies,
        taskMeter,
        activeSabotage,
        currentMeeting,
        lastMeetingResult,
        gameOverSummary,
        countdownRemaining,
        nearbyInteractable,
        killableTargetId,
        reportableBodyId,
        currentRoomName,
        localPlayerPos,
        activeTaskModal,
        activeSabotageRepairModal,
        isMinimapOpen,
        isSabotageMenuOpen,
        isChatOpen,
        chatMessages,
        hasVoted,
        crtShaderEnabled,
        soundMuted,
        touchControlsEnabled,
        toggleCrtShader,
        toggleSound,
        toggleTouchControls,
        toggleMinimap,
        toggleSabotageMenu,
        toggleChat,
        createRoom,
        joinRoom,
        leaveRoom,
        toggleReady,
        startGame,
        openTaskModal,
        closeTaskModal,
        completeTask,
        openSabotageRepairModal,
        closeSabotageRepairModal,
        triggerSabotage,
        repairSabotage,
        attemptKill,
        reportBody,
        callEmergencyMeeting,
        castVote,
        skipVote,
        sendChat,
        returnToLobby,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
