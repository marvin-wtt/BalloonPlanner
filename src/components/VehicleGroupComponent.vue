<template>
  <vehicle-component
    type="balloov"
    :vehicle="data.balloon"
    :key="data.balloon.id"
  />
  <vehicle-component
    v-for="vehicle in data.cars"
    type="car"
    :vehicle="vehicle"
    :key="vehicle.id"
  />
</template>

<script>
import VehicleComponent from 'src/components/VehicleComponent.vue';
import { VehicleGroup } from 'src/lib/entities/VehicleGroup';

export default {
  name: 'VehicleGroupComponent',
  components: { VehicleComponent },
  props: {
    data: {
      type: VehicleGroup,
      required: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped></style>
