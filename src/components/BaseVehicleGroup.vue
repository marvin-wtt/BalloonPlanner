<template>
  <drop-zone :accepted="isDropAccepted" @dropped="drop" class="col-shrink">
    <slot name="balloon" />
    <slot name="cars" />
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from 'components/drag/DropZone.vue';

import { Car, VehicleGroup } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

interface Props {
  group: VehicleGroup;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
});

const emit = defineEmits<{
  (e: 'carAdd', person: Car): void;
}>();

function isDropAccepted(element: Identifyable): boolean {
  if (!(element instanceof Car)) {
    return false;
  }

  if (props.group.cars.includes(element)) {
    return false;
  }

  return true;
}

function drop(element: Car) {
  emit('carAdd', element);
}
</script>

<style scoped>
.vehicle-group {
  border: 1px solid #1976d2;
}

drop-zone {
  margin: 1rem;
}
</style>
