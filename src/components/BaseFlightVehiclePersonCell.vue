<template>
  <draggable-item
      v-if="person !== undefined"
      :item="person"
      @removed="onDragEnd"
  >
    <component class="vehicle-person" :is="operator ? 'th' : 'td'">
      {{ editable ? createPersonLable(person).value : person.name }}
    </component>
  </draggable-item>

  <drop-zone v-else :accepted="isDropAllowed" @dropped="onDrop">
    <component :is="operator ? 'th' : 'td'" class="vehicle-person"/>
  </drop-zone>
</template>

<script lang="ts" setup>
import { Person } from 'src/lib/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';
import DraggableItem from 'components/drag/DraggableItem.vue';

interface Props {
  person: Person;
  editable?: boolean;
  operator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  operator: false,
  editable: true,
});

const emit = defineEmits<{
  (e: 'personAdd', person: Person): void;
  (e: 'personRemove', person: Person): void;
}>();

function createPersonLable(person: Person) {
  return computed(() => {
    if (person === undefined) {
      return '';
    }

    return person.name + ' (' + (person.numberOfFlights - 1) + ')';
  });
}

function onDragEnd(element: Person) {
  emit('personAdd', element);
}

function isDropAllowed(element: Identifyable): boolean {
  if (!(element instanceof Person)) {
    return false;
  }

  // TODO
  // if (
  //     props.operator &&
  //     !props.vehicle.information.allowedOperators.includes(person)
  // ) {
  //   return false;
  // }
  //
  // if (!props.operator && props.vehicle.passengers.includes(person)) {
  //   return false;
  // }

  return true;
}

function onDrop(element: Person) {
  emit('personRemove', element);
}
</script>

<style scoped>
th {
  border-bottom: 2px solid;
}

.highlighted {
  background-color: #31ccec;
}

.vehicle-person {
  min-width: 120px;
  height: 30px;
  padding: 0 0.5em;
  border-left: 2px solid;
}

td.vehicle-person {
  border-bottom: 0.5px dotted;
}
</style>