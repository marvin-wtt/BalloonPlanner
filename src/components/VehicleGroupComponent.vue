<template>
  <div class="column">
    <vehicle-component
      type="balloov"
      :data="data.balloon"
      :key="data.balloon.id"
    />
    <vehicle-component
      v-for="vehicle in data.cars"
      type="car"
      :data="vehicle"
      :key="vehicle.id"
    />
  </div>
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
      default: false
    },
  },
};
</script>

<style scoped></style>
