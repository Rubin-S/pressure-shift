export type FacilityRoomId =
  | 'docking_cradle'
  | 'sonar_control'
  | 'hydroponics'
  | 'pressure_lab'
  | 'thermal_plant'
  | 'communications'
  | 'observation_gallery'
  | 'medical_bay'
  | 'central_junction';

export interface RoomBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FacilityRoomInfo {
  id: FacilityRoomId;
  sectorCode?: string;
  name: string;
  description: string;
  bounds: RoomBoundingBox;
  spawnPoint: { x: number; y: number };
  emergencyConsole?: { x: number; y: number };
  ventIds?: string[];
}

export interface FacilityVent {
  id: string;
  room: FacilityRoomId;
  position: { x: number; y: number };
  connectedVentIds: string[];
}
