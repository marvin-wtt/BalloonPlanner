<template>
  <draggable-item
    v-if="person"
    :tag="operator ? 'th' : 'td'"
    :item="person"
    :disabled="!editable"
    @remove="onDragEnd()"
  >
    {{ personLabel }}

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
} from 'app/src-common/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from 'stores/settings';
import { useFlightOperations } from 'src/composables/flight-operations';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const flightStore = useFlightStore();
const { personMap, numberOfFlights } = storeToRefs(flightStore);
const settingsStore = useSettingsStore();
const { showPersonWeight, showNumberOfFlights } = storeToRefs(settingsStore);
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
} = defineProps<{
  person?: Person;
  vehicle: Vehicle;
  assignment: VehicleAssignment;
  group: VehicleGroup;
  operator?: boolean;
  editable?: boolean;
}>();

const personLabel = computed<string>(() => {
  if (!person) {
    return '';
  }

  let label = person.name;

  if (!editable) {
    return label;
  }

  if (showNumberOfFlights.value) {
    const flights = numberOfFlights.value[person.id] ?? 0;
    const suffix = flights === 0 && person.firstTime ? '*' : '';

    label += ` (${flights}${suffix})`;
  }

  if (showPersonWeight.value) {
    label += ` (${person.weight ?? '?'} kg)`;
  }

  return label;
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
        existingNames: Object.values(personMap.value).map(({ name }) => name),
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
