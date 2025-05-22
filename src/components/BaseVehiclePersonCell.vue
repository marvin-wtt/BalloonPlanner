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
        >
          <q-item-section @click="onEdit()"> Edit </q-item-section>
        </q-item>
        <q-item
          clickable
          v-close-popup
        >
          <q-item-section
            @click="onDragEnd()"
            class="text-negative"
          >
            Remove
          </q-item-section>
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
} from 'app/src-common/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';

const flightStore = useFlightStore();

const { personMap, numberOfFlights } = storeToRefs(flightStore);

const {
  person,
  vehicle,
  assignment,
  editable = false,
  flightHint = false,
  weightHint = false,
  operator = false,
} = defineProps<{
  person?: Person;
  vehicle: Vehicle;
  assignment: VehicleAssignment;
  editable?: boolean;
  flightHint?: boolean;
  weightHint?: boolean;
  operator?: boolean;
}>();

const emit = defineEmits<{
  (e: 'add', person: Person): void;
  (e: 'edit'): void;
  (e: 'remove'): void;
}>();

const personLabel = computed<string>(() => {
  if (!person) {
    return '';
  }

  let label = person.name;

  if (!editable) {
    return label;
  }

  if (flightHint) {
    const flights = numberOfFlights.value[person.id] ?? 0;

    label += ` (${flights})`;
  }

  if (weightHint) {
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
  emit('add', element as Person);
}

function onDragEnd() {
  emit('remove');
}

function onEdit() {
  emit('edit');
}
</script>

<style scoped></style>
