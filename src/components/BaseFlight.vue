<template>
  <drop-zone class="row" :accepted="isDropAllowed" @dropped="onDrop">
    <slot/>
  </drop-zone>
</template>

<script lang="ts" setup>
import BaseFlightVehicleGroup from 'components/BaseVehicleGroup.vue';

import { Balloon, Flight } from 'src/lib/entities';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';

interface Props {
  flight: Flight;
}

const props = defineProps<Props>();

function isDropAllowed(element: Identifyable): boolean {
  return element instanceof Balloon;
}

function onDrop(element: Balloon) {
  const balloon = element as Balloon;

  // TODO
}
</script>

<style scoped></style>