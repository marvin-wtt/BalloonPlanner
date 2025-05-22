import { useFlightStore } from 'stores/flight';
import type { VehicleGroup } from 'app/src-common/entities';

function useFlightUtils() {
  const flightStore = useFlightStore();

  function remainingCapacity(group: VehicleGroup): Record<string, number> {
    const balloon = flightStore.balloonMap[group.balloon.id];
    const cars = group.cars.map(({ id }) => flightStore.carMap[id]);

    const resultMaxCapacity: Record<string, number> = {};
    let remainingCapacity = balloon.maxCapacity;
    for (const car of cars) {
      // Reserve sone place for the driver
      const availableCapacity = car.maxCapacity - 1;

      // Reserve capacity for all vehicles
      if (remainingCapacity <= availableCapacity) {
        // Case A: Vehicle has more available capacity than we need
        //         Reserve all remaining
        resultMaxCapacity[car.id] = car.maxCapacity - remainingCapacity;
        remainingCapacity = 0;
      } else {
        // Case B: Vehicle has less capacity than the vehicle has to offer
        //         Reserve all available capacities
        resultMaxCapacity[car.id] = 1;
        remainingCapacity -= availableCapacity;
      }
    }

    return resultMaxCapacity;
  }

  return {
    remainingCapacity,
  };
}

export { useFlightUtils };
