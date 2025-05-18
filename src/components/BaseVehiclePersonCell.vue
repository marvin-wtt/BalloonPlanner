<template>
  <draggable-item
    :tag="operator ? 'th' : 'td'"
    v-if="person"
    :item="person"
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
          <q-item-section @click="onEdit()">
            {{ t('edit') }}
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-close-popup
        >
          <q-item-section
            @click="onDragEnd()"
            class="text-negative"
          >
            {{ t('remove') }}
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
import { Person, type Vehicle } from 'src/lib/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import type { Identifiable } from 'src/lib/utils/Identifiable';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useI18n } from 'vue-i18n';
import { useFlightStore } from 'stores/flight';

const { t } = useI18n();
const flightStore = useFlightStore();

const {
  person,
  vehicle,
  editable = false,
  operator = false,
} = defineProps<{
  person?: Person;
  vehicle: Vehicle;
  editable?: boolean;
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
  if (editable) {
    const flights = flightStore.personFlights[person.id] ?? 0;

    label += ` (${flights})`;
  }

  return label;
});

function isDropAllowed(element: Identifiable): boolean {
  if (!(element instanceof Person)) {
    return false;
  }

  if (operator) {
    return vehicle.allowedOperators.includes(element);
  }

  return !vehicle.passengers.includes(element);
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
