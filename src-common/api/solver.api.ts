export interface SolverAPI {
  solveVehicleGroups: (
    data: SolveVehicleGroupsRequest,
  ) => Promise<BuildGroupsResponse>;
  solveFlightLeg: (data: SolveFlightLegRequest) => Promise<SolveLegResponse>;
}

export type ID = string;

export interface SolveVehicleGroupsRequest {
  vehicleGroups: Record<ID, ID[]>;
  balloons: {
    id: ID;
    name: string;
    maxCapacity: number;
    allowedOperatorIds: ID[];
  }[];
  cars: {
    id: ID;
    name: string;
    maxCapacity: number;
    allowedOperatorIds: ID[];
    hasTrailerClutch: boolean;
  }[];
  people: {
    id: ID;
    role: 'participant' | 'counselor';
    languages?: string[];
    nationality?: string;
  }[];
}

export interface BuildGroupsResponse {
  vehicleGroups: Record<ID, ID[]>;
}

export interface SolveFlightLegRequest {
  balloons: {
    id: ID;
    name: string;
    maxCapacity: number;
    allowedOperatorIds: ID[];
    maxWeight?: number;
  }[];

  cars: {
    id: ID;
    name: string;
    maxCapacity: number;
    allowedOperatorIds: ID[];
  }[];

  vehicleGroups: Record<ID, ID[]>; // key: balloonId, value: carIds
  preAssignments: Record<
    ID,
    {
      operatorId: ID | null;
      passengerIds: ID[];
    }
  >; // key: vehicleId
  groupHistory?: Record<ID, Record<ID, number>>; // key: personId, value: balloonIds -> count
  peopleMeetHistory?: Record<ID, Record<ID, number>>; // key: personId, value: balloonIds -> count
  fixedGroups?: Record<ID, ID>;

  people: {
    id: ID;
    role: 'participant' | 'counselor';
    flightsSoFar: number;
    languages?: string[];
    weight?: number;
    nationality?: string;
    firstTime?: boolean;
  }[];

  options?: SolveFlightLegOptions;
}

export interface SolveFlightLegOptions extends Record<string, unknown> {
  pilotFairness?: number;
  passengerFairness?: number;
  meetingNewPeople?: number;
  tiebreakFairness?: number;
  groupRotation?: number;
  diverseNationalities?: number;
  noSoloParticipant?: number;
  groupPassengerBalance?: number;
  lowFlightsLookahead?: number;
  defaultPersonWeight?: number;
  planningHorizonDepth?: number;
  counselorFlightDiscount?: number;
  timeLimit?: number;
}

export interface SolveLegResponse {
  assignments: Record<
    ID,
    {
      operatorId: ID | null;
      passengerIds: ID[];
    }
  >;
}
