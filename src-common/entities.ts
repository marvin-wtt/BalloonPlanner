export type PersonRole = 'participant' | 'counselor';
export type VehicleKind = 'car' | 'balloon';

export type ID = string;

export interface Identifiable {
  readonly id: ID;
}

export interface Person extends Identifiable {
  role: PersonRole;
  name: string;
  nationality: string;
  weight?: number;
  firstTime?: boolean;
  languages?: string[];
}

export interface VehicleBase extends Identifiable {
  type: VehicleKind;
  name: string;
  allowedOperatorIds: ID[];
  maxCapacity: number;
}

export interface Car extends VehicleBase {
  type: 'car';
  hasTrailerClutch: boolean;
}

export interface Balloon extends VehicleBase {
  type: 'balloon';
  maxWeight?: number;
}

export type Vehicle = Car | Balloon;

export interface VehicleAssignment {
  operatorId: ID | null;
  passengerIds: ID[];
}

export interface VehicleGroup {
  balloonId: ID;
  carIds: ID[];
}

export type VehicleAssignmentMap = Record<ID, VehicleAssignment>;

export interface FlightLeg extends Identifiable {
  assignments: VehicleAssignmentMap;
}

export interface FlightSeries extends Identifiable {
  date?: string;
  personIds: ID[];
  balloonIds: ID[];
  carIds: ID[];

  vehicleGroups: VehicleGroup[];
  legs: FlightLeg[];
}

export interface ProjectSettings {
  showVehicleIndex?: boolean;
  showVehicleLabel?: boolean;
  showGroupLabel?: boolean;
  showNumberOfFlights?: boolean;
  showPersonWeight?: boolean;
  showVehicleWeight?: boolean;
  personDefaultWeight?: number;
  groupAlignment?: 'horizontal' | 'vertical';
  groupStyle?: 'dashed' | 'highlighted';
  balloonColor?: string;
  carColor?: string;
}

export interface Project extends Identifiable {
  name: string;
  description?: string;
  createdAt: string; // ISO timestamp
  version: string;

  people: Person[];
  cars: Car[];
  balloons: Balloon[];
  flights: FlightSeries[];
  settings?: ProjectSettings;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  filePath: string;
  isInternal?: boolean;
}

export interface SmartFillPayload {
  people: (Person & { flights: number })[];
  cars: Car[];
  balloons: Balloon[];
  groups: VehicleGroup[];
  history: FlightLeg[];
}

export interface SmartFillOptions {
  wPilotFairness?: number;
  wPassengerFairness?: number;
  wNationalityDiversity?: number;
  wVehicleRotation?: number;
  wSecondLegFairness?: number;
  wSecondLegOverweight?: number;
  wNoSoloParticipant?: number;
  wClusterPassengerBalance?: number;
  counselorFlightDiscount?: number;
  timeLimit?: number;
  defaultPersonWeight?: number;
  leg?: 'first' | 'second' | undefined;
}
