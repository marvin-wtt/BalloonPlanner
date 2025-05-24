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
      <div class="full-width row">
        <base-vehicle-group
          v-for="(group, i) in flight.vehicleGroups"
          :key="`vg-${i}`"
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
  Flight,
  Person,
  Identifiable,
} from 'app/src-common/entities';
import DropZone from 'components/drag/DropZone.vue';
import { computed } from 'vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import { useFlightOperations } from 'src/composables/flight-operations';

const { addVehicleGroup } = useFlightOperations();

const { flight, editable = false } = defineProps<{
  flight: Flight;
  editable?: boolean;
}>();

const empty = computed(() => {
  return flight.vehicleGroups.length === 0;
});

function elementIsBalloon(element: Identifiable): element is Balloon {
  return flight.balloonIds.includes(element.id);
}

function elementIsPerson(element: Identifiable): element is Person {
  return flight.personIds.includes(element.id);
}

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (elementIsPerson(element)) {
    return true;
  }

  return elementIsBalloon(element) && !flightContainsBalloon(element);
}

function flightContainsBalloon(balloon: Balloon): boolean {
  return (
    flight.vehicleGroups.findIndex(
      (value) => value.balloon.id === balloon.id,
    ) >= 0
  );
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
