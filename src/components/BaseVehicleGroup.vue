<template>
  <drop-zone
    :accepted="isDropAccepted"
    class="q-ma-md bg-grey-6 rounded-borders"
    @dropped="drop"
  >
    <div class="relative-position">
      <q-badge
        v-if="showWarning"
        color="warning"
        floating
        rounded
      >
        <q-icon
          name="warning"
          color="white"
          size="1rem"
        />
        <q-tooltip>
          {{ warningText }}
        </q-tooltip>
      </q-badge>
      <slot name="balloon" />
      <slot name="cars" />
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from 'components/drag/DropZone.vue';
import type {
  Car,
  VehicleGroup,
  Identifiable,
  Flight,
  Balloon,
} from 'app/src-common/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';

const { t } = useI18n();

const flightStore = useFlightStore();
const { carMap, balloonMap } = storeToRefs(flightStore);

const {
  group,
  flight,
  editable = false,
} = defineProps<{
  flight: Flight;
  group: VehicleGroup;
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'carAdd', person: Car): void;
}>();

const showWarning = computed(() => {
  return trailerHitchWarning.value || reservedCapacityWarning.value;
});

const warningText = computed(() => {
  return trailerHitchWarning.value
    ? t('tooltip_missing_trailer_hitch')
    : reservedCapacityWarning.value
      ? t('tooltip_insufficient_capacity')
      : '';
});

const cars = computed<Car[]>(() => {
  return group.cars.map(({ id }) => carMap.value[id]);
});

const balloon = computed<Balloon>(() => {
  return balloonMap.value[group.balloon.id];
});

const trailerHitchWarning = computed<boolean>(() => {
  return !cars.value.some((car) => car.hasTrailerClutch);
});

const reservedCapacityWarning = computed<boolean>(() => {
  const availableCapacity = cars.value.reduce(
    (prev, curr) => prev + curr.maxCapacity - 1,
    0,
  );

  return balloon.value.maxCapacity > availableCapacity;
});

function isDropAccepted(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!flight.carIds.includes(element.id)) {
    return false;
  }

  return !group.cars.some((car) => car.id === element.id);
}

function drop(element: Identifiable) {
  emit('carAdd', element as Car);
}
</script>

<style scoped></style>
