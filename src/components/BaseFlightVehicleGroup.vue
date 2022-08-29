<template>
  <drop-zone :accepted="isDropAccepted" @dropped="drop">
    <base-flight-vehicle
        type="balloon"
        :vehicle="group.balloon"
        :key="group.balloon.id"
    />
    <base-flight-vehicle
        v-for="vehicle in group.cars"
        type="car"
        :vehicle="vehicle"
        :key="vehicle.id"
    />
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from 'components/drag/DropZone.vue';
import BaseFlightVehicle from 'components/BaseFlightVehicle.vue';

import { Car, VehicleGroup } from 'src/lib/entities';
import { Identifyable } from 'src/lib/utils/Identifyable';

interface Props {
  group: VehicleGroup;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
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
  console.log('Called');
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