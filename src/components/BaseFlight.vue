<template>
  <drop-zone class="row" :accepted="isDropAllowed" @dropped="onDrop">
    <div class="column" v-for="group in flight.vehicleGroups" :key="group.id">
      <base-flight-vehicle-group :group="group"/>
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import BaseFlightVehicleGroup from 'components/BaseFlightVehicleGroup.vue';

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