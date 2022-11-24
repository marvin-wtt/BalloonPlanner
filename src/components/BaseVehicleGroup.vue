<template>
  <drop-zone
    :accepted="isDropAccepted"
    @dropped="drop"
    class="q-ma-md bg-grey-6 rounded-borders"
  >
    <div class="relative-position">
      <q-badge v-if="reservedCapacityWarning" color="warning" floating rounded>
        <q-icon name="warning" color="white" size="1rem" />
        <q-tooltip>
          {{ $t('tooltip_insufficient_capacity') }}
        </q-tooltip>
      </q-badge>
      <slot name="balloon" />
      <slot name="cars" />
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from 'components/drag/DropZone.vue';

import { Car, VehicleGroup } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { computed } from 'vue';

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

const reservedCapacityWarning = computed(() => {
  const availableCapacity = props.group.cars.reduce(
    (prev, curr) => prev + curr.capacity - 1,
    0
  );

  return props.group.balloon.capacity > availableCapacity;
});

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

<style scoped></style>
