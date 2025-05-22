import type {
  Project,
  VehicleGroup,
  Car,
  Flight,
  VehicleAssignment,
  Person,
  Balloon,
} from 'app/src-common/entities';

// --- primitive helpers ---
function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function isNumber(x: unknown): x is number {
  return typeof x === 'number';
}

// --- PersonRole ---
const _personRoles = ['participant', 'counselor'] as const;
type PersonRole = (typeof _personRoles)[number];
function isPersonRole(x: unknown): x is PersonRole {
  return isString(x) && (_personRoles as readonly string[]).includes(x);
}

// --- Person ---
function isPerson(x: unknown): x is Person {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Partial<Person>;
  if (!isString(p.id)) return false;
  if (!isPersonRole(p.role)) return false;
  if (!isString(p.name)) return false;
  if (!isString(p.nationality)) return false;
  if (p.weight !== undefined && !isNumber(p.weight)) return false;
  return true;
}

// --- VehicleAssignment ---
function isVehicleAssignment(x: unknown): x is VehicleAssignment {
  if (typeof x !== 'object' || x === null) return false;
  const va = x as Partial<VehicleAssignment>;
  if (!isString(va.id)) return false;
  if (!(va.operatorId === null || isString(va.operatorId))) return false;
  if (!Array.isArray(va.passengerIds) || !va.passengerIds.every(isString))
    return false;
  return true;
}

// --- VehicleGroup ---
function isVehicleGroup(x: unknown): x is VehicleGroup {
  if (typeof x !== 'object' || x === null) return false;
  const vg = x as Partial<VehicleGroup>;
  if (!isVehicleAssignment(vg.balloon)) return false;
  if (!Array.isArray(vg.cars) || !vg.cars.every(isVehicleAssignment))
    return false;
  return true;
}

// --- Flight ---
function isFlight(x: unknown): x is Flight {
  if (typeof x !== 'object' || x === null) return false;
  const f = x as Partial<Flight>;
  if (!isString(f.id)) return false;
  if (f.date !== undefined && !isString(f.date)) return false;
  if (!Array.isArray(f.vehicleGroups) || !f.vehicleGroups.every(isVehicleGroup))
    return false;
  if (!Array.isArray(f.personIds) || !f.personIds.every(isString)) return false;
  if (!Array.isArray(f.balloonIds) || !f.balloonIds.every(isString))
    return false;
  if (!Array.isArray(f.carIds) || !f.carIds.every(isString)) return false;
  return true;
}

// --- Car ---
function isCar(x: unknown): x is Car {
  if (typeof x !== 'object' || x === null) return false;
  const c = x as Partial<Car>;
  if (!isString(c.id)) return false;
  if (c.type !== 'car') return false;
  if (!isString(c.name)) return false;
  if (
    !Array.isArray(c.allowedOperatorIds) ||
    !c.allowedOperatorIds.every(isString)
  )
    return false;
  if (!isNumber(c.maxCapacity)) return false;
  if (c.hasTrailerClutch !== true && c.hasTrailerClutch !== false) return false;
  return true;
}

// --- Balloon ---
function isBalloon(x: unknown): x is Balloon {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Partial<Balloon>;
  if (!isString(b.id)) return false;
  if (b.type !== 'balloon') return false;
  if (!isString(b.name)) return false;
  if (
    !Array.isArray(b.allowedOperatorIds) ||
    !b.allowedOperatorIds.every(isString)
  )
    return false;
  if (!isNumber(b.maxCapacity)) return false;
  if (b.maxWeight !== undefined && !isNumber(b.maxWeight)) return false;
  return true;
}

// --- Project guard ---
export function isProject(data: unknown): data is Project {
  if (typeof data !== 'object' || data === null) return false;
  const p = data as Partial<Project>;
  if (!isString(p.id)) return false;
  if (!isString(p.name)) return false;
  if (p.description !== undefined && !isString(p.description)) return false;
  if (!isString(p.createdAt)) return false;

  if (!Array.isArray(p.people) || !p.people.every(isPerson)) return false;
  if (!Array.isArray(p.cars) || !p.cars.every(isCar)) return false;
  if (!Array.isArray(p.balloons) || !p.balloons.every(isBalloon)) return false;
  if (!Array.isArray(p.flights) || !p.flights.every(isFlight)) return false;

  return true;
}
