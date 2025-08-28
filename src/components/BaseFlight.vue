<template>
  <drop-zone
    class="full-width row justify-center items-center"
    :accepted="isDropAllowed"
    @dropped="onDrop"
  >
    <div
      v-if="empty"
      class="col-12 text-center text-body1"
    >
      Drop a balloon here to start.
    </div>

    <q-scroll-area
      v-else
      class="col-grow"
    >
      <div
        id="flight-content"
        class="full-width q-gutter-md q-pa-sm q-mt-xs"
        :class="groupAlignment === 'vertical' ? 'column' : 'row'"
      >
        <base-vehicle-group
          v-for="(group, i) in flight.vehicleGroups"
          :key="`vg-${i}`"
          :label="`Group ${String.fromCharCode(65 + i)}`"
          :group
          :editable
        />
      </div>
    </q-scroll-area>
  </drop-zone>
</template>

<script lang="ts" setup>
import type {
  Balloon,
  FlightSeries,
  Person,
  Identifiable,
} from 'app/src-common/entities';
import DropZone from 'components/drag/DropZone.vue';
import { computed } from 'vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import { useFlightOperations } from 'src/composables/flightOperations';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import { useProjectSettings } from 'src/composables/projectSettings';

const flightStore = useFlightStore();
const { availablePeople, availableCars, availableBalloons } =
  storeToRefs(flightStore);
const { groupAlignment } = useProjectSettings();
const { addVehicleGroup } = useFlightOperations();

const { flight, editable = false } = defineProps<{
  flight: FlightSeries;
  editable?: boolean;
}>();

const empty = computed<boolean>(() => {
  return flight.vehicleGroups.length === 0;
});

function elementIsBalloon(element: Identifiable): element is Balloon {
  return flight.balloonIds.includes(element.id);
}

function elementIsCar(element: Identifiable): element is Balloon {
  return flight.carIds.includes(element.id);
}

function elementIsPerson(element: Identifiable): element is Person {
  return flight.personIds.includes(element.id);
}

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (elementIsPerson(element)) {
    return !availablePeople.value.some((person) => person.id === element.id);
  }

  if (elementIsCar(element)) {
    return !availableCars.value.some((car) => car.id === element.id);
  }

  if (elementIsBalloon(element)) {
    return !flightContainsBalloon(element);
  }

  return false;
}

function flightContainsBalloon(balloon: Balloon): boolean {
  return !availableBalloons.value.some((b) => b.id === balloon.id);
}

function onDrop(element: Identifiable) {
  if (!elementIsBalloon(element)) {
    return;
  }

  if (flightContainsBalloon(element)) {
    return;
  }

  addVehicleGroup(element.id);
}
</script>

<style scoped>
div {
  height: 100%;
}
</style>
