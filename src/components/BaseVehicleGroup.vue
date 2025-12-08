<template>
  <drop-zone
    :accepted="isDropAccepted"
    class="vehicle-group"
    :class="styleClass"
    @dropped="drop"
  >
    <div class="relative-position">
      <div class="vehicle-group__label">
        <span v-if="isCanceled">
          <i>Canceled</i>
        </span>

        <span v-else-if="showGroupLabel">
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
        <div v-if="balloon.id !== NULL_ID">
          <base-vehicle
            :key="group.balloonId"
            :vehicle-id="group.balloonId"
            type="balloon"
            :assignment="
              flightLeg?.assignments[group.balloonId] ?? emptyAssignment
            "
            :flight-series
            :flight-leg
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
            :vehicle-id="id"
            :assignment="flightLeg?.assignments[id] ?? emptyAssignment"
            :flight-series
            :flight-leg
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
  Identifiable,
  Balloon,
  VehicleAssignment,
  FlightSeries,
  FlightLeg,
  VehicleGroup,
} from 'app/src-common/entities';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import BaseVehicle from 'components/BaseVehicle.vue';
import { useFlightOperations } from 'src/composables/flightOperations';
import { useProjectSettings } from 'src/composables/projectSettings';
import { NULL_ID } from 'app/src-common/constants';

const { groupAlignment, groupStyle, showGroupLabel } = useProjectSettings();
const flightStore = useFlightStore();
const { carMap, balloonMap } = storeToRefs(flightStore);
const { addCarToVehicleGroup } = useFlightOperations();

const {
  flightSeries,
  flightLeg,
  group,
  label = '',
  editable = false,
} = defineProps<{
  group: VehicleGroup;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  label?: string;
  editable?: boolean;
}>();

const emptyAssignment: VehicleAssignment = {
  operatorId: null,
  passengerIds: [],
};

const styleClass = computed<string>(() => {
  return [
    isCanceled.value ? 'vehicle-group__canceled' : undefined,
    groupStyle.value === 'dashed'
      ? 'vehicle-group__dashed'
      : 'vehicle-group__highlighted',
  ]
    .filter(Boolean)
    .join(' ');
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return group.carIds.map((id) => carMap.value[id]!);
});

const balloon = computed<Balloon>(() => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return balloonMap.value[group.balloonId]!;
});

const trailerHitchWarning = computed<boolean>(() => {
  return (
    group.balloonId !== NULL_ID &&
    !cars.value.some((car) => car.hasTrailerClutch)
  );
});

const reservedCapacityWarning = computed<boolean>(() => {
  const availableCapacity = cars.value.reduce(
    (prev, curr) => prev + curr.maxCapacity - 1,
    0,
  );

  return balloon.value.maxCapacity > availableCapacity;
});

const isCanceled = computed<boolean>(() => {
  return flightLeg.canceledBalloonIds.includes(group.balloonId);
});

function elementIsCar(element: Identifiable): element is Car {
  return flightSeries.carIds.includes(element.id);
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

  addCarToVehicleGroup(group.balloonId, element.id);
}
</script>

<style lang="scss" scoped>
.vehicle-group {
  border-radius: 15px;
}

.vehicle-group__canceled {
  opacity: 0.5;
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
