<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 400px">
      <q-form
        @reset="onDialogCancel"
        @submit="onSubmit"
      >
        <q-card-section class="text-h6">Create flight</q-card-section>

        <q-card-section>
          <q-btn-toggle
            v-model="mode"
            :options="[
              { label: 'Leg', value: 'leg' },
              { label: 'Series', value: 'series' },
            ]"
            no-caps
            spread
            rounded
          />
        </q-card-section>

        <q-card-section
          v-if="mode"
          class="q-pt-none q-gutter-y-md"
        >
          <q-select
            v-if="mode === 'series'"
            v-model="referenceFlight"
            label="Flight reference"
            :options="flightOptions"
            emit-value
            map-options
            clearable
            outlined
            rounded
          />

          <transition>
            <q-list v-if="mode === 'leg' || referenceFlight != null">
              <q-item
                v-for="option in keepAssignmentOptions"
                :key="option.value"
                v-ripple
                tag="label"
              >
                <q-item-section avatar>
                  <q-radio
                    v-model="keepAssignment"
                    :val="option.value"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                  <q-item-label
                    v-if="option.caption"
                    caption
                  >
                    {{ option.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </transition>
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
            :disable="mode === undefined"
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
import type {
  FlightLeg,
  FlightSeries,
  VehicleAssignmentMap,
  VehicleGroup,
} from 'app/src-common/entities';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const flightStore = useFlightStore();
const { flightSeries, personMap, balloonMap } = storeToRefs(flightStore);

const { flights } = defineProps<{
  flights: FlightSeries[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const mode = ref<'leg' | 'series'>(flights.length > 0 ? 'leg' : 'series');
const keepAssignment = ref<'none' | 'pilots' | 'operators' | 'counselors'>(
  'none',
);
const referenceFlight = ref<FlightSeries | undefined | null>(
  flights.length > 0 ? flights[flights.length - 1] : null,
);

interface RadioOption {
  label: string;
  caption?: string;
  value: string;
}

const keepAssignmentOptions: RadioOption[] = [
  {
    label: 'None',
    value: 'none',
  },
  {
    label: 'Pilots',
    caption: 'Keep only the pilots',
    value: 'pilots',
  },
  {
    label: 'Operators',
    caption: 'Keep operators of all vehicles (including balloons)',
    value: 'operators',
  },
  {
    label: 'Counselors',
    caption: 'Keep all counselors (including vehicle operators)',
    value: 'counselors',
  },
];

const flightOptions = computed<QSelectOption<FlightSeries | null>[]>(() => {
  const none = {
    label: 'None',
    value: null,
  };

  const options = flights
    .map((flight, index) => ({
      label: `Flight-${(index + 1).toString()}`,
      value: flight,
    }))
    .reverse();

  return [...options, none];
});

export interface CreateFlightDialogData {
  mode: 'leg' | 'series';
  vehicleGroups?: VehicleGroup[];
  assignments?: VehicleAssignmentMap;
}

function onSubmit() {
  if (mode.value === 'leg') {
    submit({
      mode: 'leg',
      assignments: createAssignments(),
    });
  } else {
    submit({
      mode: 'series',
      vehicleGroups: referenceFlight.value
        ? referenceFlight.value.vehicleGroups
        : undefined,
      assignments: createAssignments(),
    });
  }
}

function createAssignments(): VehicleAssignmentMap {
  const leg = getLatestLeg();
  if (!leg) {
    return {};
  }

  if (keepAssignment.value === 'operators') {
    return Object.entries(leg.assignments).reduce((acc, [id, assignment]) => {
      acc[id] = {
        operatorId: assignment.operatorId,
        passengerIds: [],
      };

      return acc;
    }, {});
  }

  if (keepAssignment.value === 'pilots') {
    return Object.entries(leg.assignments).reduce((acc, [id, assignment]) => {
      acc[id] = {
        operatorId: Object.keys(balloonMap.value).includes(id)
          ? assignment.operatorId
          : null,
        passengerIds: [],
      };

      return acc;
    }, {});
  }

  if (keepAssignment.value === 'counselors') {
    return Object.entries(leg.assignments).reduce((acc, [id, assignment]) => {
      acc[id] = {
        operatorId: assignment.operatorId, // We assume that every operator is a counselor
        passengerIds: assignment.passengerIds.filter(
          (pid) => personMap.value[pid]?.role === 'counselor',
        ),
      };

      return acc;
    }, {});
  }

  return {};
}

function getLatestLeg(): FlightLeg | undefined {
  if (mode.value === 'leg') {
    if (!flightSeries.value) {
      return undefined;
    }

    return flightSeries.value.legs[flightSeries.value.legs.length - 1];
  }

  const series = flights[flights.length - 1];
  if (!series) {
    return undefined;
  }

  return series.legs[series.legs.length - 1];
}

function submit(data: CreateFlightDialogData) {
  onDialogOK(data);
}
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
