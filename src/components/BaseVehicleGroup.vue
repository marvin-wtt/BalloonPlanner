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

import { Car, type VehicleGroup } from 'src/lib/entities';
import type { Identifiable } from 'src/lib/utils/Identifiable';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  group: VehicleGroup;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
});

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

const trailerHitchWarning = computed(() => {
  return !props.group.cars.some((value) => value.trailerHitch);
});

const reservedCapacityWarning = computed(() => {
  const availableCapacity = props.group.cars.reduce(
    (prev, curr) => prev + curr.capacity - 1,
    0,
  );

  return props.group.balloon.capacity > availableCapacity;
});

function isDropAccepted(element: Identifiable): boolean {
  if (!(element instanceof Car)) {
    return false;
  }

  return !props.group.cars.includes(element);
}

function drop(element: Identifiable) {
  emit('carAdd', element as Car);
}
</script>

<style scoped></style>
