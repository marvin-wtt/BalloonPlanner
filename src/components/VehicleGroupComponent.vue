<template>
  <vehicle-component
    type="balloov"
    :vehicle="group.balloon"
    :key="group.balloon.id"
  />
  <vehicle-component
    v-for="vehicle in group.cars"
    type="car"
    :vehicle="vehicle"
    :key="vehicle.id"
  />
</template>

<script lang="ts" setup>
import VehicleComponent from 'src/components/VehicleComponent.vue';
import { VehicleGroup } from 'src/lib/entities';

interface Props {
  group: VehicleGroup;
  editable?: boolean;
}

withDefaults(defineProps<Props>(), {
  editable: true,
});
</script>

<style scoped></style>
