<template>
  <drop-zone
    :accepted="isDropAccepted"
    class="q-ma-md vehicle-group"
    :class="styleClass"
    @dropped="drop"
  >
    <div
      class="relative-position row q-gutter-md q-pa-md q-pb-lg"
      :class="groupAlignment === 'vertical' ? 'row' : 'column'"
    >
      <q-badge
        v-if="showWarning"
        color="warning"
        floating
        rounded
      >
        <q-icon
          name="warning"
          color="white"
          size="1rem"
        />
        <q-tooltip>
          {{ warningText }}
        </q-tooltip>
      </q-badge>
      <!-- Balloon -->
      <div>
        <base-vehicle
          :key="group.balloon.id"
          type="balloon"
          :assignment="group.balloon"
          :group
          :editable
        />
      </div>

      <!-- Cars -->
      <div>
        <base-vehicle
          v-for="car in group.cars"
          :key="car.id"
          type="car"
          :assignment="car"
          :group
          :editable
        />
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
import { useFlightOperations } from 'src/composables/flight-operations';
import { useSettingsStore } from 'stores/settings';

const settingsStore = useSettingsStore();
const { groupAlignment, groupStyle } = storeToRefs(settingsStore);
const flightStore = useFlightStore();
const { flight, carMap, balloonMap } = storeToRefs(flightStore);
const { addCarToVehicleGroup } = useFlightOperations();

const { group, editable = false } = defineProps<{
  group: VehicleGroup;
  editable?: boolean;
}>();

const styleClass = computed<string>(() => {
  return groupStyle.value === 'dashed'
    ? 'vehicle-group__dashed'
    : 'vehicle-group__highlighted';
});

const showWarning = computed<boolean>(() => {
  return trailerHitchWarning.value || reservedCapacityWarning.value;
});

const warningText = computed<string>(() => {
  return trailerHitchWarning.value
    ? 'The group is missing a trailer clutch'
    : reservedCapacityWarning.value
      ? 'The group does not have enough car capacity'
      : 'Unknown error';
});

const cars = computed<Car[]>(() => {
  return group.cars.map(({ id }) => carMap.value[id]);
});

const balloon = computed<Balloon>(() => {
  return balloonMap.value[group.balloon.id];
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
  return flight.value.carIds.includes(element.id);
}

function isDropAccepted(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!elementIsCar(element)) {
    return false;
  }

  return !group.cars.some((car) => car.id === element.id);
}

function drop(element: Identifiable) {
  if (!elementIsCar(element)) {
    return;
  }

  addCarToVehicleGroup(group.balloon.id, element.id);
}
</script>

<style scoped>
.vehicle-group {
  border-radius: 15px;
}

.vehicle-group__dashed {
  border-style: dashed;
  border-width: 2px;
  border-color: #757575;
  background-color: inherit;
}

.vehicle-group__highlighted {
  border: none;
  background-color: #bdbdbd;
}
</style>
