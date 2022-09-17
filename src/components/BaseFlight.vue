<template>
  <drop-zone class="row" :accepted="isDropAllowed" @dropped="onDrop">
    <q-scroll-area class="col-grow">
      <div class="row">
        <slot/>
      </div>
    </q-scroll-area>
  </drop-zone>
</template>

<script lang="ts" setup>
import { Balloon, Flight, Person } from 'src/lib/entities';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';

interface Props {
  flight: Flight;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'balloonAdd', vehicle: Balloon): void;
}>();

function isDropAllowed(element: Identifyable): boolean {
  if (element instanceof Person) {
    return true;
  }

  if (element instanceof Balloon && !flightContainsElement(element)) {
    return true;
  }

  return false;
}

function flightContainsElement(element: Identifyable): boolean {
  return props.flight.vehicleGroups.findIndex(
    (value) => value.balloon.id === element.id
  ) >= 0;
}

function onDrop(element: Balloon) {
  if (!(element instanceof Balloon)) {
    return;
  }

  if (flightContainsElement(element)) {
    return;
  }

  emit('balloonAdd', element);
}
</script>

<style scoped></style>