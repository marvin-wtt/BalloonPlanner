import { Balloon, Car, Flight, Person, VehicleGroup } from 'src/lib/entities';

type MapObject<T> = {
  [key: string]: T;
};

type PersonObject = {
  name: string;
  flights: number;
  nation: string;
  supervisor: boolean;
};

type BalloonObject = {
  name: string;
  capacity: number;
  operator: string | null;
  allowedOperators: string[];
  passengers: string[];
};

type CarObject = {
  name: string;
  capacity: number;
  reservedCapacity: number;
  operator: string | null;
  allowedOperators: string[];
  passengers: string[];
};

type VehicleGroupObject = {
  balloon: string;
  cars: string[];
};

type FlightObject = {
  timestamp: number;
  balloons: MapObject<BalloonObject>;
  cars: MapObject<CarObject>;
  people: MapObject<PersonObject>;
  vehicleGroups: MapObject<VehicleGroupObject>;
};

export function flightFromObject(obj: FlightObject): Flight {
  const people = peopleFromObject(obj.people);
  const balloons = balloonsFromObject(obj.balloons, people);
  const cars = carsFromObject(obj.cars, people);
  const vehicleGroups = vehicleGroupFromObject(
    obj.vehicleGroups,
    balloons,
    cars
  );

  const flight = new Flight(balloons, cars, people, vehicleGroups);
  if (flightId != null) {
    flight.id = flightId;
  }
  flight.timestamp = obj.timestamp;

  return flight;
}

export function flightToObject(flight: Flight): FlightObject {
  return {
    timestamp: flight.timestamp,
    balloons: balloonsToObject(flight.balloons),
    cars: carsToObject(flight.cars),
    people: peopleToObject(flight.people),
    vehicleGroups: vehcileGroupsToObject(flight.vehicleGroups),
  };
}

export function personToObject(person: Person): PersonObject {
  return {
    name: person.name,
    flights: person.numberOfFlights,
    nation: person.nation,
    supervisor: person.supervisor,
  };
}

export function peopleToObject(people: Person[]): MapObject<PersonObject> {
  const result: MapObject<PersonObject> = {};

  for (const person of people) {
    result[person.id] = personToObject(person);
  }

  return result;
}

export function peopleFromObject(data: MapObject<PersonObject>): Person[] {
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
      obj.flights
    );
    person.id = id;
    people.push(person);
  }

  return people;
}

export function balloonToObject(balloon: Balloon): BalloonObject {
  return {
    name: balloon.name,
    capacity: balloon.capacity,
    operator: balloon.operator?.id ?? null,
    allowedOperators: balloon.allowedOperators.map((value) => value.id),
    passengers: balloon.passengers.map((value) => value.id),
  };
}

export function balloonsToObject(
  balloons: Balloon[]
): MapObject<BalloonObject> {
  const result: MapObject<BalloonObject> = {};
  for (const balloon of balloons) {
    result[balloon.id] = balloonToObject(balloon);
  }

  return result;
}

export function balloonsFromObject(
  data: MapObject<BalloonObject>,
  people: Person[]
): Balloon[] {
  if (data == null) {
    return [];
  }

  const balloons: Balloon[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];

    const allowedOperators = people.filter((value) =>
      obj.allowedOperators.includes(value.id)
    );
    const operator = people.find((value) => obj.operator === value.id);
    const passengers = obj.passengers.map(pId => people.find(person =>  person.id === pId));
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

export function carToObject(car: Car): CarObject {
  return {
    name: car.name,
    capacity: car.capacity,
    reservedCapacity: car.reservedCapacity,
    operator: car.operator?.id ?? null,
    allowedOperators: car.allowedOperators.map((value) => value.id),
    passengers: car.passengers.map((value) => value.id),
  };
}

export function carsToObject(cars: Car[]): MapObject<CarObject> {
  const result: MapObject<CarObject> = {};
  for (const car of cars) {
    result[car.id] = carToObject(car);
  }

  return result;
}

export function carsFromObject(
  data: MapObject<CarObject>,
  people: Person[]
): Car[] {
  if (data == null) {
    return [];
  }

  const cars: Car[] = [];
  for (const id of Object.keys(data)) {
    const obj = data[id];

    const allowedOperators = people.filter((value) =>
      obj.allowedOperators.includes(value.id)
    );
    const operator = people.find((value) => obj.operator === value.id);
    const passengers = obj.passengers.map(pId => people.find(person =>  person.id === pId));
    if (passengers.includes(undefined)) {
      throw new Error('invalid_passenger_id');
    }
    const car = new Car(obj.name, obj.capacity, allowedOperators);
    car.id = id;
    car.reservedCapacity = obj.reservedCapacity;
    car.operator = operator;
    car.passengers = passengers as Person[];
    cars.push(car);
  }

  return cars;
}

export function vehcileGroupToObject(
  vehicleGroup: VehicleGroup
): VehicleGroupObject {
  return {
    balloon: vehicleGroup.balloon.id,
    cars: vehicleGroup.cars.map((value) => value.id),
  };
}

export function vehcileGroupsToObject(
  vehicleGroups: VehicleGroup[]
): MapObject<VehicleGroupObject> {
  const result: MapObject<VehicleGroupObject> = {};
  for (const vehicleGroup of vehicleGroups) {
    result[vehicleGroup.id] = vehcileGroupToObject(vehicleGroup);
  }

  return result;
}

export function vehicleGroupFromObject(
  data: MapObject<VehicleGroupObject>,
  balloons: Balloon[],
  cars: Car[]
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

  return vehicleGroups;
}
