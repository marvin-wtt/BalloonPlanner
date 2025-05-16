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
import type { Balloon, Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import type { Identifiable } from 'src/lib/utils/Identifiable';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  person?: Person;
  vehicle: Vehicle;
  editable?: boolean;
  operator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  operator: false,
  editable: true,
});

const emit = defineEmits<{
  (e: 'add', person: Person): void;
  (e: 'edit'): void;
  (e: 'remove'): void;
}>();

const personLabel = computed<string>(() => {
  if (!props.person) {
    return '';
  }

  let label = props.person.name;
  if (props.editable) {
    const isBalloon = props.vehicle instanceof Balloon;
    const flights = props.person.numberOfFlights;

    label += isBalloon ? ` (${flights - 1})` : `(${flights})`;
  }

  return label;
});

function isDropAllowed(element: Identifiable): boolean {
  if (!(element instanceof Person)) {
    return false;
  }

  if (props.operator) {
    return props.vehicle.allowedOperators.includes(element);
  }

  return !props.vehicle.passengers.includes(element);
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
