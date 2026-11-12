import {
  SabotageType,
  ActiveSabotage,
  FacilityRoomId,
  SABOTAGE_DEFINITIONS,
  LOCKDOWN_DURATION_SECONDS,
  Position2D,
  distance2D,
  GAMEPLAY_CONSTANTS,
} from '@pressure-shift/shared';

export class SabotageManager {
  private activeSabotage: ActiveSabotage | null = null;
  private sabotageCooldownRemaining: number = 0;

  constructor() {
    this.sabotageCooldownRemaining = 15; // Initial match buffer
  }

  public getActiveSabotage(): ActiveSabotage | null {
    return this.activeSabotage;
  }

  public getSabotageCooldown(): number {
    return this.sabotageCooldownRemaining;
  }

  public setSabotageCooldown(seconds: number): void {
    this.sabotageCooldownRemaining = Math.max(0, seconds);
  }

  public canTriggerSabotage(): boolean {
    return this.activeSabotage === null && this.sabotageCooldownRemaining <= 0;
  }

  public triggerSabotage(
    type: SabotageType,
    targetRoom?: FacilityRoomId
  ): { success: boolean; error?: string; sabotage?: ActiveSabotage } {
    if (this.activeSabotage !== null) {
      return { success: false, error: 'A sabotage is already active' };
    }

    if (this.sabotageCooldownRemaining > 0) {
      return {
        success: false,
        error: `Sabotage is on cooldown (${Math.ceil(this.sabotageCooldownRemaining)}s remaining)`,
      };
    }

    const def = SABOTAGE_DEFINITIONS[type];
    if (!def) {
      return { success: false, error: `Unknown sabotage type: ${type}` };
    }

    const now = Date.now();
    const stations = def.defaultStations.map((st) => ({
      id: st.id,
      name: st.name,
      room: st.room,
      location: { ...st.location },
      isActivated: false,
    }));

    const isCritical = def.isCritical;
    const duration = isCritical ? (def.criticalTimerSeconds || 45) : null;

    this.activeSabotage = {
      type,
      name: def.name,
      isCritical,
      timeRemaining: type === 'door_lockdown' ? LOCKDOWN_DURATION_SECONDS : duration,
      totalDuration: type === 'door_lockdown' ? LOCKDOWN_DURATION_SECONDS : duration,
      triggeredAt: now,
      targetRoom: type === 'door_lockdown' ? targetRoom : undefined,
      lockdownEndTime: type === 'door_lockdown' ? now + LOCKDOWN_DURATION_SECONDS * 1000 : undefined,
      requiredStations: stations,
    };

    // Put on cooldown
    this.sabotageCooldownRemaining = def.cooldownSeconds;

    return {
      success: true,
      sabotage: this.activeSabotage,
    };
  }

  public repairStation(
    type: SabotageType,
    stationId?: string,
    playerId?: string,
    playerPosition?: Position2D
  ): { success: boolean; error?: string; cleared: boolean; sabotage?: ActiveSabotage } {
    if (!this.activeSabotage) {
      return { success: false, error: 'No active sabotage to repair', cleared: false };
    }

    if (this.activeSabotage.type !== type) {
      return {
        success: false,
        error: `Active sabotage is ${this.activeSabotage.type}, not ${type}`,
        cleared: false,
      };
    }

    // Door lockdown clears automatically after duration
    if (type === 'door_lockdown') {
      return { success: false, error: 'Door lockdown cannot be manually repaired', cleared: false };
    }

    // Single-station sabotages (e.g. communications)
    if (this.activeSabotage.requiredStations.length === 1 && !stationId) {
      stationId = this.activeSabotage.requiredStations[0].id;
    }

    const station = this.activeSabotage.requiredStations.find((st) => st.id === stationId);
    if (!station) {
      return { success: false, error: `Repair station '${stationId}' not found`, cleared: false };
    }

    // Distance verification if playerPosition provided
    if (playerPosition) {
      const dist = distance2D(playerPosition, station.location);
      if (dist > GAMEPLAY_CONSTANTS.INTERACT_RADIUS * 1.5) {
        return {
          success: false,
          error: `Player is too far from repair console (${dist.toFixed(1)} > max allowed)`,
          cleared: false,
        };
      }
    }

    station.isActivated = true;
    station.activatedBy = playerId;

    // Check if all required stations are now activated
    const allCleared = this.activeSabotage.requiredStations.every((st) => st.isActivated);
    if (allCleared) {
      const clearedType = this.activeSabotage.type;
      const def = SABOTAGE_DEFINITIONS[clearedType];
      this.activeSabotage = null;
      this.sabotageCooldownRemaining = def ? def.cooldownSeconds : 30;
      return { success: true, cleared: true };
    }

    return {
      success: true,
      cleared: false,
      sabotage: this.activeSabotage,
    };
  }

  /**
   * Advances the sabotage timers.
   * Returns true if a critical sabotage timer expired (triggering game over!).
   */
  public tick(deltaSec: number): { criticalExpired: boolean; lockdownEnded: boolean } {
    if (this.sabotageCooldownRemaining > 0) {
      this.sabotageCooldownRemaining = Math.max(0, this.sabotageCooldownRemaining - deltaSec);
    }

    let criticalExpired = false;
    let lockdownEnded = false;

    if (this.activeSabotage) {
      if (this.activeSabotage.type === 'door_lockdown') {
        const timeExpired =
          this.activeSabotage.timeRemaining !== null &&
          (this.activeSabotage.timeRemaining -= deltaSec) <= 0;
        const clockExpired =
          this.activeSabotage.lockdownEndTime && Date.now() >= this.activeSabotage.lockdownEndTime;
        if (timeExpired || clockExpired) {
          this.activeSabotage = null;
          lockdownEnded = true;
        }
      } else if (this.activeSabotage.isCritical && this.activeSabotage.timeRemaining !== null) {
        this.activeSabotage.timeRemaining -= deltaSec;
        if (this.activeSabotage.timeRemaining <= 0) {
          this.activeSabotage.timeRemaining = 0;
          criticalExpired = true;
        }
      }
    }

    return { criticalExpired, lockdownEnded };
  }

  public clearActiveSabotage(): void {
    if (this.activeSabotage) {
      const def = SABOTAGE_DEFINITIONS[this.activeSabotage.type];
      this.activeSabotage = null;
      this.sabotageCooldownRemaining = def ? def.cooldownSeconds : 30;
    }
  }

  public reset(): void {
    this.activeSabotage = null;
    this.sabotageCooldownRemaining = 15;
  }
}
