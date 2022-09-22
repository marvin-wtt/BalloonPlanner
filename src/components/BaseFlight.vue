<template>
  <drop-zone class="full-width row justify-center items-center" :accepted="isDropAllowed" @dropped="onDrop">
    <div v-if="empty" class="drop-hint col-12 text-center text-body1">
        Drop a balloon here to start.
    </div>

    <q-scroll-area v-else class="col-grow">
      <div class="full-width row">

        <slot />
      </div>
    </q-scroll-area>
  </drop-zone>
</template>

<script lang="ts" setup>
import { Balloon, Flight, Person } from 'src/lib/entities';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { computed } from 'vue';

interface Props {
  flight: Flight;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'balloonAdd', vehicle: Balloon): void;
}>();

const empty = computed(() => {
  return props.flight.vehicleGroups.length === 0;
});

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
  return (
    props.flight.vehicleGroups.findIndex(
      (value) => value.balloon.id === element.id
    ) >= 0
  );
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

<style scoped>
div {
  height: 100%;
}
</style>
