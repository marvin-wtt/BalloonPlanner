<template>
  <draggable-item
    :tag="operator ? 'th' : 'td'"
    v-if="person !== undefined"
    :item="person"
    @remove="onDragEnd"
  >
    {{ personLabel }}
  </draggable-item>

  <drop-zone
    v-else
    :tag="operator ? 'th' : 'td'"
    :accepted="isDropAllowed"
    @dropped="onDrop"
  />
</template>

<script lang="ts" setup>
import { Balloon, Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';
import DraggableItem from 'components/drag/DraggableItem.vue';

interface Props {
  person: Person;
  vehicle: Vehicle;
  editable?: boolean;
  operator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  operator: false,
  editable: true,
});

const emit = defineEmits<{
  (e: 'operatorAdd', person: Person): void;
  (e: 'operatorRemove', person: Person): void;
  (e: 'passengerAdd', person: Person): void;
  (e: 'passengerRemove', person: Person): void;
}>();

const personLabel = computed(() => {
  if (props.person === undefined) {
    return '';
  }

  let label = props.person.name;
  if (props.editable) {
    const flights =
      props.vehicle instanceof Balloon
        ? props.person.numberOfFlights - 1
        : props.person.numberOfFlights;
    label += ' (' + flights + ')';
  }

  return label;
});

function isDropAllowed(element: Identifyable): boolean {
  if (!(element instanceof Person)) {
    return false;
  }

  if (props.operator) {
    return props.vehicle.allowedOperators.includes(element);
  }

  return !props.vehicle.passengers.includes(element);
}

function onDrop(element: Person) {
  if (props.operator) {
    emit('operatorAdd', element);
  } else {
    emit('passengerAdd', element);
  }
}

function onDragEnd(element: Person) {
  if (props.operator) {
    emit('operatorRemove', element);
  } else {
    emit('passengerRemove', element);
  }
}
</script>

<style scoped></style>
