<template>
  <drop-zone
    :accepted="isDropAccepted"
    class="vehicle-group"
    :class="styleClass"
    @dropped="drop"
  >
    <div class="relative-position">
      <div class="vehicle-group__label">
        <span v-if="label && showGroupLabel">
          {{ label }}
        </span>

        <q-badge
          v-if="warningText"
          color="warning"
          class="q-ml-sm"
          rounded
        >
          <q-icon
            name="priority_high"
            color="white"
            size="1em"
          />
          <q-tooltip>
            {{ warningText }}
          </q-tooltip>
        </q-badge>
      </div>

      <div
        class="q-gutter-md q-pa-md q-pb-lg"
        :class="groupAlignment === 'vertical' ? 'row' : 'column'"
      >
        <!-- Balloon -->
        <div>
          <base-vehicle
            :key="group.balloonId"
            type="balloon"
            :id="group.balloonId"
            :assignment="
              flightLeg.assignments[group.balloonId] ?? {
                operatorId: null,
                passengerIds: [],
              }
            "
            :group
            :editable
          />
        </div>

        <!-- Cars -->
        <div
          v-for="id in group.carIds"
          :key="id"
        >
          <base-vehicle
            type="car"
            :id
            :assignment="flightLeg.assignments[id]"
            :group
            :editable
          />
        </div>
      </div>
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from 'components/drag/DropZone.vue';
import type {
  Car,
  VehicleGroup,
  Identifiable,
  Balloon,
} from 'app/src-common/entities';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import BaseVehicle from 'components/BaseVehicle.vue';
import { useFlightOperations } from 'src/composables/flightOperations';
import { useProjectSettings } from 'src/composables/projectSettings';

const { groupAlignment, groupStyle, showGroupLabel } = useProjectSettings();
const flightStore = useFlightStore();
const { flightSeries, flightLeg, carMap, balloonMap } =
  storeToRefs(flightStore);
const { addCarToVehicleGroup } = useFlightOperations();

const {
  group,
  label,
  editable = false,
} = defineProps<{
  group: VehicleGroup;
  label?: string;
  editable?: boolean;
}>();

console.log(flightLeg.value.assignments);

const styleClass = computed<string>(() => {
  return groupStyle.value === 'dashed'
    ? 'vehicle-group__dashed'
    : 'vehicle-group__highlighted';
});

const warningText = computed<string | null>(() => {
  if (trailerHitchWarning.value) {
    return 'The group is missing a trailer clutch';
  }

  if (reservedCapacityWarning.value) {
    return 'The group does not have enough car capacity';
  }

  return null;
});

const cars = computed<Car[]>(() => {
  return group.carIds.map((id) => carMap.value[id]);
});

const balloon = computed<Balloon>(() => {
  return balloonMap.value[group.balloonId];
});

const trailerHitchWarning = computed<boolean>(() => {
  return !cars.value.some((car) => car.hasTrailerClutch);
});

const reservedCapacityWarning = computed<boolean>(() => {
  const availableCapacity = cars.value.reduce(
    (prev, curr) => prev + curr.maxCapacity - 1,
    0,
  );

  return balloon.value.maxCapacity > availableCapacity;
});

function elementIsCar(element: Identifiable): element is Car {
  return flightSeries.value.carIds.includes(element.id);
}

function isDropAccepted(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!elementIsCar(element)) {
    return false;
  }

  return !group.carIds.some((id) => id === element.id);
}

function drop(element: Identifiable) {
  if (!elementIsCar(element)) {
    return;
  }

  // Search for the current assignment before applying the changes
  const previousCarId = flightSeries.value.vehicleGroups
    .flatMap((g) => g.carIds)
    .find((id) => id === element.id);
  const previousAssignment = flightLeg.value.assignments[previousCarId];

  addCarToVehicleGroup(group.balloonId, element.id);

  if (!previousCarId) {
    return;
  }

  flightLeg.value.assignments[element.id] = previousAssignment;
}
</script>

<style lang="scss" scoped>
.vehicle-group {
  border-radius: 15px;
}

.vehicle-group > div {
  padding: 0 3px;
  margin-top: -0.8em;
}

.vehicle-group__label {
  background: white none repeat scroll 0 0;
  display: inline-block;
  padding: 0 5px;
  border-radius: 10px;
  margin-left: 1em;
  font-weight: bold;
}

.vehicle-group__dashed {
  border-style: dashed;
  border-width: 2px;
  border-color: $grey-7;
  background-color: $grey-3;

  .vehicle-group__label {
    background-color: $grey-3;
  }
}

.vehicle-group__highlighted {
  border: none;
  background-color: $grey-5;
}
</style>
