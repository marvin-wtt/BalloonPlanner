<template>
  <drop-zone
    class="full-width row justify-center items-center"
    :classify="classifyDrop"
    @dropped="onDrop"
  >
    <div
      v-if="empty"
      class="col-12 text-center text-body1 flight-body"
    >
      Drop a balloon here to start.
    </div>

    <div
      v-else
      class="full-width column flight-body"
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
} from '@/../src-common/entities';
import DropZone from '@/components/drag/DropZone.vue';
import { computed, onBeforeUnmount, watch } from 'vue';
import { type QNotifyCreateOptions, useQuasar } from 'quasar';
import BaseVehicleGroup from '@/components/BaseVehicleGroup.vue';
import { useFlightOperations } from '@/composables/flightOperations';
import { storeToRefs } from 'pinia';
import { useFlightStore } from '@/stores/flight';
import { useProjectSettings } from '@/composables/projectSettings';
import { useVehicleGroupProtection } from '@/composables/vehicleGroupProtection';
import {
  validateFlightLegAndSeries,
  type FlightValidationResult,
} from '@/util/flight-validator';
import { NULL_ID } from '@/../src-common/constants';
import { vehicleGroupLabel } from '@/util/group';

const quasar = useQuasar();
const flightStore = useFlightStore();
const { availablePeople, availableCars, availableBalloons } =
  storeToRefs(flightStore);
const { groupAlignment } = useProjectSettings();
const { addVehicleGroup, addCarToVehicleGroup } = useFlightOperations();
const { protectionActive, carIsPlaced, confirmChange } =
  useVehicleGroupProtection();

const { project, flightSeries, flightLeg, editable } = defineProps<{
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

function classifyDrop(element: Identifiable): 'accept' | 'warn' | 'reject' {
  if (!editable) {
    return 'reject';
  }

  if (elementIsPerson(element)) {
    const isAllowed = !availablePeople.value.some(
      (person) => person.id === element.id,
    );

    return isAllowed ? 'accept' : 'reject';
  }

  if (elementIsCar(element)) {
    const isAllowed =
      !availableCars.value.some((car) => car.id === element.id) ||
      // Only allow one group without a balloon
      !flightSeries.vehicleGroups.some((group) => group.balloonId === NULL_ID);

    if (!isAllowed) {
      return 'reject';
    }

    // Pulling an already-placed car out into its own group clears assignments
    // in the other legs, so warn that the drop will ask for confirmation.
    return protectionActive.value && carIsPlaced(element.id)
      ? 'warn'
      : 'accept';
  }

  if (elementIsBalloon(element)) {
    return flightContainsBalloon(element) ? 'reject' : 'accept';
  }

  return 'reject';
}

function flightContainsBalloon(balloon: Balloon): boolean {
  return !availableBalloons.value.some((b) => b.id === balloon.id);
}

async function onDrop(element: Identifiable) {
  // If the dropped element is a car, add it as a group without a balloon.
  if (elementIsCar(element)) {
    // Moving an already-placed car is destructive; a fresh car from the tray
    // is not. The removal from the source group shares this decision, so the
    // dialog is shown only once per move.
    if (carIsPlaced(element.id)) {
      const confirmed = await confirmChange();
      if (!confirmed) {
        return;
      }
    }

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

const validationError = computed<FlightValidationResult | null>(() => {
  return validateFlightLegAndSeries(project, flightSeries, flightLeg);
});

// Show the validation error as a persistent notification with an optional
// "Fix" action instead of an inline banner, so it never competes with the
// flight layout or the page FAB for space.
let updateNotification: ReturnType<typeof quasar.notify> | null = null;

function hideNotification() {
  updateNotification?.();
  updateNotification = null;
}

function showNotification(error: FlightValidationResult) {
  const props: QNotifyCreateOptions = {
    type: 'negative',
    icon: 'warning',
    message: error.message,
    timeout: 0,
    position: 'bottom',
    actions:
      error.fix && editable
        ? [
            {
              label: 'Fix',
              color: 'white',
              rounded: true,
              handler: () => error.fix?.(),
            },
          ]
        : [],
  };

  if (updateNotification) {
    updateNotification(props);
  } else {
    updateNotification = quasar.notify(props);
  }
}

watch(
  () => [validationError.value, editable] as const,
  ([error]) => {
    if (error) {
      showNotification(error);
    } else {
      hideNotification();
    }
  },
  { immediate: true },
);

onBeforeUnmount(hideNotification);
</script>

<style scoped>
/* Structural wrappers must fill the drop zone so the scroll area can grow. */
.drop-zone,
.flight-body {
  height: 100%;
}
</style>
