<template>
  <draggable-item
    v-if="person"
    :tag="operator ? 'th' : 'td'"
    :item="person"
    :label="person.name"
    :disabled="!editable"
    :class="overfilled ? 'text-negative' : ''"
    @remove="onDragEnd()"
  >
    <div class="row no-wrap items-center">
      <div class="col-grow">
        <span>
          {{ person.name }}
        </span>
        <span
          v-if="showNumberOfFlights"
          :class="coloredLabels ? 'text-blue' : ''"
        >
          {{ flightsLabel }}
        </span>
        <span
          v-if="showPersonWeight"
          :class="coloredLabels ? 'text-orange' : ''"
        >
          {{ weightLabel }}
        </span>
      </div>

      <div
        v-if="showInfo"
        class="q-ml-xs"
      >
        <q-icon
          name="sym_o_error"
          :color="infoColor"
          size="sm"
          dense
        >
          <q-tooltip>
            {{ infoText }}
          </q-tooltip>
        </q-icon>
      </div>
    </div>

    <q-menu
      touch-position
      context-menu
    >
      <q-list
        dense
        style="min-width: 100px"
      >
        <q-item
          clickable
          v-close-popup
          @click="onEdit()"
        >
          <q-item-section>Edit</q-item-section>
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="onDragEnd()"
        >
          <q-item-section class="text-negative">Remove</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </draggable-item>

  <drop-zone
    v-else
    :tag="operator ? 'th' : 'td'"
    :accepted="isDropAllowed"
    @dropped="onDrop"
  />
</template>

<script lang="ts" setup>
import type {
  Person,
  Vehicle,
  Identifiable,
  VehicleAssignment,
  VehicleGroup,
  Flight,
} from 'app/src-common/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';
import { useFlightOperations } from 'src/composables/flightOperations';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useQuasar } from 'quasar';
import { useProjectStore } from 'stores/project';
import { useProjectSettings } from 'src/composables/projectSettings';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { personMap, numberOfFlights, flight } = storeToRefs(flightStore);
const { showPersonWeight, showNumberOfFlights, personDefaultWeight } =
  useProjectSettings();
const {
  editPerson,
  addCarPassenger,
  addBalloonPassenger,
  addCarOperator,
  addBalloonOperator,
  removeCarPassenger,
  removeBalloonPassenger,
  removeCarOperator,
  removeBalloonOperator,
} = useFlightOperations();

const {
  person,
  vehicle,
  group,
  assignment,
  editable = false,
  operator = false,
  overfilled = false,
} = defineProps<{
  person?: Person;
  vehicle: Vehicle;
  assignment: VehicleAssignment;
  group: VehicleGroup;
  operator?: boolean;
  editable?: boolean;
  overfilled?: boolean;
}>();

const flightsLabel = computed<string>(() => {
  const flights = numberOfFlights.value[person.id] ?? 0;
  const suffix = flights === 0 && person.firstTime ? '*' : '';

  return ` (${flights}${suffix})`;
});

const weightLabel = computed<string>(() => {
  const weight = person.weight ?? personDefaultWeight.value ?? '?';
  const suffix = !person.weight && personDefaultWeight.value ? '*' : '';

  return ` (${weight}${suffix} kg)`;
});

const coloredLabels = computed<boolean>(() => {
  return showPersonWeight.value && showNumberOfFlights.value;
});

const showInfo = computed<boolean>(() => {
  return (
    overfilled ||
    hasInvalidOperator.value ||
    hasMultiLegError.value ||
    hasLanguageWarning.value
  );
});

const infoColor = computed<string>(() => {
  if (overfilled || hasInvalidOperator.value || hasMultiLegError.value) {
    return 'negative';
  }

  if (hasLanguageWarning.value) {
    return 'warning';
  }

  return 'info';
});

const infoText = computed<string>(() => {
  if (overfilled) {
    return 'Vehicle capacity exceeded';
  }

  if (hasInvalidOperator.value) {
    return 'Person not allowed to operate this vehicle';
  }

  if (hasMultiLegError.value) {
    return 'Person was not assigned to this group in previous flight';
  }

  if (hasLanguageWarning.value) {
    return 'No common language with passenger';
  }

  return '';
});

const hasLanguageWarning = computed<boolean>(() => {
  if (operator || !assignment.operatorId || !person.languages) {
    return false;
  }

  const languages = personMap.value[assignment.operatorId]?.languages;
  if (languages == undefined) {
    return false;
  }

  return !languages.some((language) => person.languages.includes(language));
});

const hasMultiLegError = computed<boolean>(() => {
  if (!flight.value?.isContinuationLeg) {
    return false;
  }

  const index = project.value.flights.indexOf(flight.value);
  if (index <= 0) {
    return false;
  }

  const previousFlight: Flight = project.value.flights[index - 1];
  const previousGroup = previousFlight.vehicleGroups.find(
    (prevGroup) => group.balloon.id === prevGroup.balloon.id,
  );

  // There is an error with the group assignments
  if (!previousGroup) {
    return false;
  }

  return (
    previousGroup.balloon.operatorId !== person.id &&
    !previousGroup.balloon.passengerIds.includes(person.id) &&
    !previousGroup.cars.some(
      (car) =>
        car.operatorId === person.id || car.passengerIds.includes(person.id),
    )
  );
});

const hasInvalidOperator = computed<boolean>(() => {
  if (!operator) {
    return false;
  }

  return !vehicle.allowedOperatorIds.includes(person.id);
});

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!personMap.value[element.id]) {
    return false;
  }

  if (operator) {
    return vehicle.allowedOperatorIds.includes(element.id);
  }

  return !assignment.passengerIds.includes(element.id);
}

function onDrop(element: Identifiable) {
  addPersonToVehicle(element.id);
}

function onDragEnd() {
  removePersonFromVehicle(person.id);
}

function onEdit() {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        existingNames: project.value.people.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      editPerson(person.id, payload);
    });
}

function addPersonToVehicle(personId: string) {
  if (vehicle.type === 'balloon') {
    if (operator) {
      addBalloonOperator(assignment.id, personId);
    } else {
      addBalloonPassenger(assignment.id, personId);
    }
  } else {
    if (operator) {
      addCarOperator(group.balloon.id, assignment.id, personId);
    } else {
      addCarPassenger(group.balloon.id, assignment.id, personId);
    }
  }
}

function removePersonFromVehicle(personId: string) {
  if (vehicle.type === 'balloon') {
    if (operator) {
      removeBalloonOperator(assignment.id);
    } else {
      removeBalloonPassenger(assignment.id, personId);
    }
  } else {
    if (operator) {
      removeCarOperator(group.balloon.id, assignment.id);
    } else {
      removeCarPassenger(group.balloon.id, assignment.id, personId);
    }
  }
}
</script>

<style scoped></style>
