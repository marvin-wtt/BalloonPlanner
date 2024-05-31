<template>
  <drop-zone
    class="full-width row justify-center items-center"
    :accepted="isDropAllowed"
    @dropped="onDrop"
  >
    <div
      v-if="empty"
      class="col-12 text-center text-body1"
    >
      <!-- TODO Add translation -->
      Drop a balloon here to start.
    </div>

    <q-scroll-area
      v-else
      class="col-grow"
    >
      <div class="full-width row">
        <slot />
      </div>
    </q-scroll-area>
  </drop-zone>
</template>

<script lang="ts" setup>
import { Balloon, Flight, Person } from 'src/lib/entities';
import DropZone from 'components/drag/DropZone.vue';
import { Identifiable } from 'src/lib/utils/Identifiable';
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

function elementIsBalloon(element: Identifiable): element is Balloon {
  return element instanceof Balloon;
}

function elementIsPerson(element: Identifiable): element is Person {
  return element instanceof Person;
}

function isDropAllowed(element: Identifiable): boolean {
  if (elementIsPerson(element)) {
    return true;
  }

  return elementIsBalloon(element) && !flightContainsBalloon(element);
}

function flightContainsBalloon(balloon: Balloon): boolean {
  return (
    props.flight.vehicleGroups.findIndex(
      (value) => value.balloon.id === balloon.id,
    ) >= 0
  );
}

function onDrop(element: Identifiable) {
  if (!elementIsBalloon(element)) {
    return;
  }

  if (flightContainsBalloon(element)) {
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
