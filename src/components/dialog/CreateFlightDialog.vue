<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 300px">
      <q-form
        @reset="onDialogCancel"
        @submit="onSubmit"
      >
        <q-card-section class="text-h6">Create flight</q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-select
            v-model="referenceFlight"
            label="Flight reference"
            :options="flightOptions"
            emit-value
            map-options
            outlined
            rounded
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            label="Cancel"
            type="reset"
            color="primary"
            rounded
            outline
          />
          <q-btn
            label="Create"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { computed, ref } from 'vue';
import type { FlightSeries } from 'app/src-common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { flights } = defineProps<{
  flights: FlightSeries[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const referenceFlight = ref<FlightSeries | null>(
  flights.length > 0 ? flights[flights.length - 1] : null,
);

const flightOptions = computed<QSelectOption<FlightSeries>[]>(() => {
  const none = {
    label: 'None',
    value: null,
  };

  const options = flights
    .map((flight, index) => ({
      label: `Flight-${index + 1}`,
      value: flight,
    }))
    .reverse();

  return [...options, none];
});

function onSubmit() {
  const data: Partial<Omit<FlightSeries, 'id'>> = {
    vehicleGroups: referenceFlight.value
      ? referenceFlight.value.vehicleGroups
      : undefined,
  };

  onDialogOK(data);
}
</script>

<style scoped></style>
