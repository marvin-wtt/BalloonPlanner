export interface SolverAPI {
  buildVehicleGroups: (
    data: BuildGroupsRequest,
  ) => Promise<BuildGroupsResponse>;
  solveFlight: (
    data: SolveLegRequest,
    options?: Record<string, unknown>,
  ) => Promise<SolveLegResponse>;
}

export type ID = string;

export interface BuildGroupsRequest {
  vehicleGroups: Record<ID, ID[]>;
  balloons: {
    id: ID;
    maxCapacity: number;
  }[];
  cars: {
    id: ID;
    maxCapacity: number;
    hasTrailerClutch: boolean;
  }[];
  peopleCount: number;
}

export interface BuildGroupsResponse {
  vehicleGroups: Record<ID, ID[]>;
}

export interface SolveLegRequest {
  balloons: {
    id: ID;
    maxCapacity: number;
    allowedOperatorIds: ID[];
    maxWeight?: number;
  }[];

  cars: {
    id: ID;
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
  >; // key: vehicleId, value: assignment
  groupHistory: Record<ID, ID[]>; // key: personId, value: balloonIds

  people: {
    id: ID;
    role: 'participant' | 'counselor';
    flightsSoFar: number;
    languages?: string[];
    weight?: number;
    nationality?: string;
    firstTime?: boolean;
  }[];
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
