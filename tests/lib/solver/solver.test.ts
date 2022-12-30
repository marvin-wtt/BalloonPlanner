import { faker } from '@faker-js/faker';

import { Balloon, Car, Flight, Person } from 'src/lib/entities';
import { solve } from 'src/lib/solver/solver';

it('creates a vehicle group for every balloon', async () => {
  const p1 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p2 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p3 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p4 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p5 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p6 = new Person(faker.name.firstName(), faker.locale, true, 0);

  const b1 = new Balloon('D-OAAA', 3, [p1]);
  const b2 = new Balloon('D-OAAB', 3, [p2]);
  const b3 = new Balloon('D-OAAC', 3, [p3]);

  const c1 = new Car('Car1', 9, [p4]);
  const c2 = new Car('Car2', 9, [p5]);
  const c3 = new Car('Car3', 9, [p6]);

  const f = new Flight([b1, b2, b3], [c1, c2, c3], [p1, p2, p3, p4, p5, p6]);

  const result = await solve(f);

  expect(result.vehicleGroups.length).toBe(3);
  expect(
    result.vehicleGroups.find((value) => value.balloon.id == b1.id)
  ).toBeDefined();
  expect(
    result.vehicleGroups.find((value) => value.balloon.id == b2.id)
  ).toBeDefined();
  expect(
    result.vehicleGroups.find((value) => value.balloon.id == b3.id)
  ).toBeDefined();
});

it('adds a pilot to every balloon', async () => {
  const p1 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p2 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p3 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p4 = new Person(faker.name.firstName(), faker.locale, true, 0);

  const b1 = new Balloon('D-OAAA', 3, [p1]);
  const b2 = new Balloon('D-OAAB', 3, [p2]);

  const c1 = new Car('Car1', 9, [p3]);
  const c2 = new Car('Car2', 9, [p4]);

  const f = new Flight([b1, b2], [c1, c2], [p1, p2, p3, p4]);

  const result = await solve(f);

  expect(result.vehicleGroups[0].balloon.operator).toBeDefined();
  expect(
    result.vehicleGroups[0].balloon.allowedOperators.includes(
      result.vehicleGroups[0].balloon.operator!
    )
  ).toBeTruthy();

  expect(result.vehicleGroups[1].balloon.operator).toBeDefined();
  expect(
    result.vehicleGroups[1].balloon.allowedOperators.includes(
      result.vehicleGroups[1].balloon.operator!
    )
  ).toBeTruthy();
});

it('increments the flights for every pilot', async () => {
  const p1 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p2 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p3 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p4 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p5 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p6 = new Person(faker.name.firstName(), faker.locale, true, 0);

  const b1 = new Balloon('D-OAAA', 3, [p1]);
  const b2 = new Balloon('D-OAAB', 3, [p2]);
  const b3 = new Balloon('D-OAAC', 3, [p3]);

  const c1 = new Car('Car1', 9, [p4]);
  const c2 = new Car('Car2', 9, [p5]);
  const c3 = new Car('Car3', 9, [p6]);

  const f = new Flight([b1, b2, b3], [c1, c2, c3], [p1, p2, p3, p4, p5, p6]);

  const result = await solve(f);

  expect(result.vehicleGroups[0].balloon.operator?.numberOfFlights).toBe(1);
  expect(result.vehicleGroups[1].balloon.operator?.numberOfFlights).toBe(1);
  expect(result.vehicleGroups[2].balloon.operator?.numberOfFlights).toBe(1);
});

it('adds at least one car to every group', async () => {
  const p1 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p2 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p3 = new Person(faker.name.firstName(), faker.locale, true, 0);
  const p4 = new Person(faker.name.firstName(), faker.locale, true, 0);

  const b1 = new Balloon('D-OAAA', 3, [p1]);
  const b2 = new Balloon('D-OAAB', 3, [p2]);

  const c1 = new Car('Car1', 9, [p3]);
  const c2 = new Car('Car2', 9, [p4]);

  const f = new Flight([b1, b2], [c1, c2], [p1, p2, p3, p4]);

  const result = await solve(f);

  expect(result.vehicleGroups[0].cars.length).toBe(1);
  expect(result.vehicleGroups[1].cars.length).toBe(1);
});

it.todo('does not overfill vehicles');

it.todo('adds all people to a vehicle');

it.todo('asigns each person only once');

it.todo('dds each car at most once to a flight');

it.todo('asignes cars to group with sufficiant capacity');

it.todo('distributes crew size between groups');

it.todo('removes groups if not enough cars are available');

it.todo('adds a pilot to every balloon');

it.todo('ignores smallest balloon if no operator available');

it.todo('adds a driver to every car');

it.todo('only uses allowed operators');

it.todo('throws error if the capacity is not sufficiant for everyone');

it.todo('increments the flight for every person inside a balloon');

it('prioritises participants who never flew before', async () => {
  const p1 = new Person(faker.name.firstName(), faker.locale, true, 0, false);
  const p2 = new Person(faker.name.firstName(), faker.locale, true, 0, false);
  const p3 = new Person(faker.name.firstName(), faker.locale, false, 0, false);
  const p4 = new Person(faker.name.firstName(), faker.locale, false, 0, false);
  const p5 = new Person(faker.name.firstName(), faker.locale, false, 0, false);
  const p6 = new Person(faker.name.firstName(), faker.locale, false, 0, true);
  const p7 = new Person(faker.name.firstName(), faker.locale, false, 0, true);

  const b1 = new Balloon('D-OAAA', 3, [p1]);

  const c1 = new Car('Car1', 9, [p2]);

  const f = new Flight([b1], [c1], [p1, p2, p3, p4, p5, p6, p7]);

  const result = await solve(f);

  expect(
    result.vehicleGroups[0].balloon.passengers.find(
      (value) => value.id === p6.id
    )
  ).toBeDefined();
  expect(
    result.vehicleGroups[0].balloon.passengers.find(
      (value) => value.id === p7.id
    )
  ).toBeDefined();
});

it.todo('prioritises participants with frewer flights');

it.todo('prioritises teamer who never flew before');

it.todo('prioritises teamer with no flights');

it.todo('prioritises solutions with frewer cars');
