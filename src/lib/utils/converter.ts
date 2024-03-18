import {
  Balloon,
  Car,
  Flight,
  Person,
  Project,
  VehicleGroup,
} from 'src/lib/entities';

type MapObject<T> = Record<string, T>;

export type IPerson = {
  name: string;
  flights: number;
  nation: string;
  supervisor: boolean;
  firstFlight: boolean;
};

export type IBalloon = {
  name: string;
  capacity: number;
  operator: string | null;
  allowedOperators: string[];
  passengers: string[];
};

export type ICar = {
  name: string;
  trailerHitch: boolean;
  capacity: number;
  reservedCapacity: number;
  operator: string | null;
  allowedOperators: string[];
  passengers: string[];
};

export type IVehicleGroup = {
  balloon: string;
  cars: string[];
};

export type IFlight = {
  projectId?: string;
  timestamp: number;
  balloons: MapObject<IBalloon>;
  cars: MapObject<ICar>;
  people: MapObject<IPerson>;
  vehicleGroups: MapObject<IVehicleGroup>;
};

export type IProject = {
  name: string;
  description: string;
  collaborators: string[];
  flights: string[];
};

export function projectFromObject(obj: IProject, projectId: string): Project {
  const name = obj.name;
  const description = obj.description;
  const collaborators = obj.collaborators;

  const flights: Flight[] = obj.flights.map((value) => {
    // TODO Maybe this flight can be lazy loading?
    const flight = new Flight([], [], []);
    flight.id = value;

    return flight;
  });

  const project = new Project(name, description, flights, collaborators);
  if (projectId != null) {
    project.id = projectId;
  }

  return project;
}

export function projectToObject(project: Project): IProject {
  return {
    name: project.name,
    description: project.description,
    flights: project.flights.map((value) => value.id),
    collaborators: project.collaborators,
  };
}

export function flightFromObject(obj: IFlight, flightId?: string): Flight {
  const people = peopleFromObject(obj.people);
  const balloons = balloonsFromObject(obj.balloons, people);
  const cars = carsFromObject(obj.cars, people);
  const vehicleGroups = vehicleGroupFromObject(
    obj.vehicleGroups,
    balloons,
    cars,
  );

  const flight = new Flight(balloons, cars, people, vehicleGroups);
  if (flightId != null) {
    flight.id = flightId;
  }
  flight.timestamp = obj.timestamp;

  return flight;
}

export function flightToObject(flight: Flight, projectId?: string): IFlight {
  return {
    projectId: projectId,
    timestamp: flight.timestamp,
    balloons: balloonsToObject(flight.balloons),
    cars: carsToObject(flight.cars),
    people: peopleToObject(flight.people),
    vehicleGroups: vehicleGroupsToObject(flight.vehicleGroups),
  };
}

export function personToObject(person: Person): IPerson {
  return {
    name: person.name,
    flights: person.numberOfFlights,
    nation: person.nation,
    supervisor: person.supervisor,
    firstFlight: person.firstTime,
  };
}

export function peopleToObject(people: Person[]): MapObject<IPerson> {
  const result: MapObject<IPerson> = {};

  for (const person of people) {
    result[person.id] = personToObject(person);
  }

  return result;
}

export function peopleFromObject(data: MapObject<IPerson>): Person[] {
  if (data == null) {
    return [];
  }

  const people: Person[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];
    const person = new Person(
      obj.name,
      obj.nation,
      obj.supervisor,
      obj.flights,
      obj.firstFlight,
    );
    person.id = id;
    people.push(person);
  }

  return people;
}

export function balloonToObject(balloon: Balloon): IBalloon {
  return {
    name: balloon.name,
    capacity: balloon.capacity,
    operator: balloon.operator?.id ?? null,
    allowedOperators: balloon.allowedOperators.map((value) => value.id),
    passengers: balloon.passengers.map((value) => value.id),
  };
}

export function balloonsToObject(balloons: Balloon[]): MapObject<IBalloon> {
  const result: MapObject<IBalloon> = {};
  for (const balloon of balloons) {
    result[balloon.id] = balloonToObject(balloon);
  }

  return result;
}

export function balloonsFromObject(
  data: MapObject<IBalloon>,
  people: Person[],
): Balloon[] {
  if (data == null) {
    return [];
  }

  const balloons: Balloon[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];

    const allowedOperators = people.filter((value) =>
      obj.allowedOperators.includes(value.id),
    );
    const operator = people.find((value) => obj.operator === value.id);
    // Decrement number of flights because setter will increment is again
    operator?.decrementFlights();
    const passengers = obj.passengers.map((pId) =>
      people.find((person) => person.id === pId),
    );
    if (passengers.includes(undefined)) {
      throw new Error('invalid_passenger_id');
    }
    const balloon = new Balloon(obj.name, obj.capacity, allowedOperators);
    balloon.id = id;
    balloon.operator = operator;
    balloon.passengers = passengers as Person[];
    balloons.push(balloon);
  }

  return balloons;
}

export function carToObject(car: Car): ICar {
  return {
    name: car.name,
    trailerHitch: car.trailerHitch,
    capacity: car.capacity,
    reservedCapacity: car.reservedCapacity,
    operator: car.operator?.id ?? null,
    allowedOperators: car.allowedOperators.map((value) => value.id),
    passengers: car.passengers.map((value) => value.id),
  };
}

export function carsToObject(cars: Car[]): MapObject<ICar> {
  const result: MapObject<ICar> = {};
  for (const car of cars) {
    result[car.id] = carToObject(car);
  }

  return result;
}

export function carsFromObject(data: MapObject<ICar>, people: Person[]): Car[] {
  if (data == null) {
    return [];
  }

  const cars: Car[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];

    const allowedOperators = people.filter((value) =>
      obj.allowedOperators.includes(value.id),
    );
    const operator = people.find((value) => obj.operator === value.id);
    const passengers = obj.passengers.map((pId) =>
      people.find((person) => person.id === pId),
    );
    if (passengers.includes(undefined)) {
      throw new Error('invalid_passenger_id');
    }
    const car = new Car(
      obj.name,
      obj.capacity,
      allowedOperators,
      obj.trailerHitch,
    );
    car.id = id;
    car.reservedCapacity = obj.reservedCapacity;
    car.operator = operator;
    car.passengers = passengers as Person[];
    cars.push(car);
  }

  return cars;
}

export function vehicleGroupToObject(
  vehicleGroup: VehicleGroup,
): IVehicleGroup {
  return {
    balloon: vehicleGroup.balloon.id,
    cars: vehicleGroup.cars.map((value) => value.id),
  };
}

export function vehicleGroupsToObject(
  vehicleGroups: VehicleGroup[],
): MapObject<IVehicleGroup> {
  const result: MapObject<IVehicleGroup> = {};
  for (const vehicleGroup of vehicleGroups) {
    result[vehicleGroup.id] = vehicleGroupToObject(vehicleGroup);
  }

  return result;
}

export function vehicleGroupFromObject(
  data: MapObject<IVehicleGroup>,
  balloons: Balloon[],
  cars: Car[],
): VehicleGroup[] {
  if (data == null) {
    return [];
  }

  const vehicleGroups: VehicleGroup[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];

    const balloon = balloons.find((value) => value.id === obj.balloon);
    if (balloon == null) {
      throw new Error('Failed to map balloon with id ' + id);
    }
    const vehicleGroup = new VehicleGroup(balloon);
    vehicleGroup.id = id;
    vehicleGroup.cars = cars.filter((value) => obj.cars.includes(value.id));
    vehicleGroups.push(vehicleGroup);
  }
  // FIXME Sorting is forbidden here. It breaks the solver
  // vehicleGroups = vehicleGroups.sort((a, b) => a.id.localeCompare(b.id));

  return vehicleGroups;
}
