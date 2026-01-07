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

    <div
      v-else
      class="full-width column"
    >
      <q-scroll-area class="col-grow">
        <div
          id="flight-content"
          class="full-width q-gutter-md q-pa-sm q-mt-xs"
          :class="groupAlignment === 'vertical' ? 'column' : 'row'"
        >
          <base-vehicle-group
            v-for="(group, i) in flightSeries.vehicleGroups"
            :key="`vg-${i}`"
            :label="`Group ${vehicleGroupLabel(i)}`"
            :flight-series
            :flight-leg
            :group
            :editable
          />
        </div>
      </q-scroll-area>

      <div
        v-if="errorText"
        class="bg-negative text-white col-shrink q-px-md"
      >
        Error: {{ errorText }}
      </div>
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import type {
  Balloon,
  FlightSeries,
  Person,
  Identifiable,
  FlightLeg,
  Project,
} from 'app/src-common/entities';
import DropZone from 'components/drag/DropZone.vue';
import { computed } from 'vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import { useFlightOperations } from 'src/composables/flightOperations';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import { useProjectSettings } from 'src/composables/projectSettings';
import { validateFlightLegAndSeries } from 'src/util/flight-validator';
import { NULL_ID } from 'app/src-common/constants';
import { vehicleGroupLabel } from 'src/util/group';

const flightStore = useFlightStore();
const { availablePeople, availableCars, availableBalloons } =
  storeToRefs(flightStore);
const { groupAlignment } = useProjectSettings();
const { addVehicleGroup, addCarToVehicleGroup } = useFlightOperations();

const {
  project,
  flightSeries,
  flightLeg,
  editable = false,
} = defineProps<{
  project: Project;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  editable?: boolean;
}>();

const empty = computed<boolean>(() => {
  return flightSeries.vehicleGroups.length === 0;
});

function elementIsBalloon(element: Identifiable): element is Balloon {
  return flightSeries.balloonIds.includes(element.id);
}

function elementIsCar(element: Identifiable): element is Balloon {
  return flightSeries.carIds.includes(element.id);
}

function elementIsPerson(element: Identifiable): element is Person {
  return flightSeries.personIds.includes(element.id);
}

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (elementIsPerson(element)) {
    return !availablePeople.value.some((person) => person.id === element.id);
  }

  if (elementIsCar(element)) {
    return (
      !availableCars.value.some((car) => car.id === element.id) ||
      // Only allow one group without a balloon
      !flightSeries.vehicleGroups.some((group) => group.balloonId === NULL_ID)
    );
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
  // If the dropped element is a car, add it as a group without a balloon.
  if (elementIsCar(element)) {
    addVehicleGroup(NULL_ID);
    addCarToVehicleGroup(NULL_ID, element.id);
    return;
  }

  if (!elementIsBalloon(element)) {
    return;
  }

  if (flightContainsBalloon(element)) {
    return;
  }

  addVehicleGroup(element.id);
}

const errorText = computed<string | null>(() => {
  return validateFlightLegAndSeries(project, flightSeries, flightLeg);
});
</script>

<style scoped>
div {
  height: 100%;
}
</style>
