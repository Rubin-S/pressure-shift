# Pressure Shift: Game Design Document

## 1. Concept & Setting

**Title**: Pressure Shift  
**Genre**: Top-Down 2D Multiplayer Underwater Social Deduction  
**Setting**: *Hadal Station Nadir-7*, submerged 8,500 meters below sea level in the Mariana Trench.  
**Theme**: Crushing atmospheric pressure, isolation, dark abyssal corridors, flickering emergency beacons, and acoustic paranoia.

---

## 2. Player Roles & Objectives

### 2.1 Operators (Station Crew)
- **Primary Goal**: Restore full station operational equilibrium by completing maintenance tasks across all 8 sectors, or identify and eject all Disruptors through emergency meetings.
- **Abilities**:
  - `INTERACT / USE` (Key `E` or UI Button): Engage with mini-game terminals when within 75 px.
  - `REPORT` (Key `R` or UI Button): Report a dead diver body discovered within 85 px to trigger an immediate Emergency Meeting.
  - `EMERGENCY BUTTON`: Located in `docking_cradle`. Limited to 1 use per player per game. Initiates an Emergency Meeting.
  - `REPAIR SABOTAGE`: Intervene at damaged subsystems during emergencies (oxygen depletion, reactor thermal runaway, electrical failure).
- **Spectator / Ghost State**: Ejected or killed Operators become translucent submersibles/ghosts. They can swim through bulkheads and continue completing tasks to advance the team task meter, but cannot speak in meetings or interact with living crew.

### 2.2 Disruptors (Infiltrators)
- **Primary Goal**: Sabotage station life support systems to force emergency failure, or reduce the living Operator count until Disruptors equal or outnumber Operators.
- **Abilities**:
  - `KILL` (Key `Q` or UI Button): Target an Operator within 60 px. Triggers a 25–30 second cooldown.
  - `SABOTAGE` (Key `M` or UI Button): Trigger critical emergencies:
    - **Pressure / Oxygen Depletion**: 45s countdown. Requires dual-terminal clearance in `pressure_lab` and `docking_cradle`.
    - **Reactor Overheat**: 45s countdown. Requires manual coolant dump in `thermal_plant`.
    - **Communications Jamming**: Disables minimap markers, task UI guides, and status feeds until repaired in `communications`.
    - **Bulkhead Lockdown**: Closes safety blast doors for 10 seconds.
  - **Pretense**: Disruptors can open task stations and pretend to perform tasks.

---

## 3. Mini-Game Task Specifications

Eight interactive mini-games provide mechanical engagement:

| # | Task Name | Sector | Mechanic | Win Condition |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Sonar Calibration** | `sonar_control` | Two oscillating frequency sliders (Sine vs Square wave). Align phase and amplitude. | Match within 5% tolerance for 1.5s |
| 2 | **Electrical Circuit** | `thermal_plant` | 4 color-coded wire terminal pairs (Red, Cyan, Amber, White). Drag to connect opposite leads. | All 4 wires connected correctly |
| 3 | **Pressure Valve Balance** | `pressure_lab` | Hydrostatic needle fluctuating due to external water pressure. Hold balance button inside green threshold. | Maintain in target zone for 3 seconds |
| 4 | **Power Grid Routing** | `thermal_plant` | 3x3 switchboard grid. Flip breakers to route continuous electrical flow from source to terminal. | Complete circuit path |
| 5 | **Bio Sample Sort** | `hydroponics` | 3 specimens requiring chemical classification based on bioluminescent color spectrum. | Drag 3 specimens to matching vials |
| 6 | **Sensor Alignment** | `observation_gallery` | Rotate Azimuth (0°–360°) and Elevation (-45° to +45°) dials to lock onto deep-sea beacon. | Align crosshairs within reticle |
| 7 | **Ballast Pump Purge** | `docking_cradle` | Rapid click / tap pump piston lever to expel excess seawater and equalize buoyancy. | Fill progress meter to 100% |
| 8 | **Filtration Sieve Clear** | `medical_bay` | Drag sea silt and thermal debris out of the micro-filter grid mesh. | Clear all 5 debris items |

---

## 4. Emergency Meetings & Voting Mechanics

1. **Trigger Condition**:
   - Operator or Disruptor presses `docking_cradle` Emergency Console (subject to game settings: 1 call per player).
   - Any diver reports a fallen crew member (`report:body`).
2. **Phases**:
   - **Alarm & Assembly**: All players instantly teleported to the Central Table in `docking_cradle`. Dead bodies cleared from station floor.
   - **Discussion Phase**: Configurable timer (e.g. 15–30 seconds) during which players exchange text messages or discuss suspects.
   - **Voting Phase**: Configurable timer (e.g. 30–60 seconds). Every alive player can cast 1 vote for any alive player, or select `Skip Vote`.
   - **Tally & Tie-Breaking**:
     - Strict majority required for ejection.
     - In case of a tie between highest candidates, or if `Skip` votes equal or exceed highest candidate, no one is ejected.
   - **Ejection Sequence**:
     - Ejected player is shown being cast out into the crushing abyssal trench through the Nadir-7 airlock.
     - If `confirmEjects` is enabled: displays `"[Player] was a Disruptor"` or `"[Player] was not a Disruptor"`.
     - Disruptor remaining count updated.

---

## 5. Win Conditions

| Condition | Victor | Trigger Logic |
| :--- | :--- | :--- |
| **All Disruptors Ejected** | Operators | Living Disruptors == 0 |
| **All Tasks Completed** | Operators | Global Task Meter reaches 100% |
| **Disruptor Parity** | Disruptors | Living Disruptors >= Living Operators |
| **Critical Sabotage Failure** | Disruptors | Active emergency timer reaches 0 without repair |
