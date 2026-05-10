<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 420px">
      <q-form
        @reset="onDialogCancel"
        @submit="onSubmit"
      >
        <q-card-section class="text-h6">Create flight</q-card-section>

        <q-card-section class="q-pt-none">
          <q-btn-toggle
            v-model="mode"
            :options="[
              { label: 'Add Leg', value: 'leg' },
              { label: 'New Series', value: 'series' },
            ]"
            no-caps
            spread
            rounded
          />
        </q-card-section>

        <!-- Series: date + copy source -->
        <q-card-section
          v-if="mode === 'series'"
          class="q-pt-none q-gutter-y-md"
        >
          <div class="row items-center q-gutter-md">
            <q-input
              v-model="date"
              type="date"
              label="Date"
              outlined
              rounded
              dense
              class="col"
            />
            <q-btn-toggle
              v-model="period"
              no-caps
              rounded
              :options="[
                { label: 'Morning', value: 'morning' },
                { label: 'Evening', value: 'evening' },
              ]"
            />
          </div>

          <q-select
            v-model="referenceFlight"
            label="Copy setup from"
            :options="flightOptions"
            emit-value
            map-options
            clearable
            outlined
            rounded
          />
        </q-card-section>

        <!-- Assignment copy options (leg always, series when a source is selected) -->
        <q-card-section
          v-if="mode === 'leg' || referenceFlight != null"
          class="q-pt-none"
        >
          <q-item-label
            header
            class="q-px-none q-pb-xs"
          >
            Copy assignments
          </q-item-label>
          <q-list>
            <q-item
              v-for="option in keepAssignmentOptions"
              :key="option.value"
              v-ripple
              tag="label"
              dense
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

function localDateString(d: Date): string {
  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeNextSlot(): { date: string; period: 'morning' | 'evening' } {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 18) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: localDateString(tomorrow), period: 'morning' };
  }

  return {
    date: localDateString(now),
    period: hour >= 6 ? 'evening' : 'morning',
  };
}

const nextSlot = computeNextSlot();

const mode = ref<'leg' | 'series'>(flights.length > 0 ? 'leg' : 'series');
const keepAssignment = ref<'none' | 'pilots' | 'operators' | 'counselors'>(
  'none',
);
const referenceFlight = ref<FlightSeries | undefined | null>(
  flights.length > 0 ? flights[flights.length - 1] : null,
);
const date = ref<string>(nextSlot.date);
const period = ref<'morning' | 'evening'>(nextSlot.period);

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
    caption: 'Keep only the balloon pilots',
    value: 'pilots',
  },
  {
    label: 'Operators',
    caption: 'Keep all vehicle operators',
    value: 'operators',
  },
  {
    label: 'Counselors',
    caption: 'Keep all counselors and vehicle operators',
    value: 'counselors',
  },
];

const flightOptions = computed<QSelectOption<FlightSeries | null>[]>(() =>
  flights
    .map((flight, index) => ({
      label: `Flight ${(index + 1).toString()}`,
      value: flight,
    }))
    .reverse(),
);

export interface CreateFlightDialogData {
  mode: 'leg' | 'series';
  date?: string;
  vehicleGroups?: VehicleGroup[];
  assignments?: VehicleAssignmentMap;
}

function buildDate(): string {
  const utcHour = period.value === 'morning' ? 6 : 18;
  return new Date(
    `${date.value}T${utcHour.toString().padStart(2, '0')}:00:00.000Z`,
  ).toISOString();
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
      date: date.value ? buildDate() : undefined,
      vehicleGroups: referenceFlight.value
        ? cloneVehicleGroups(referenceFlight.value.vehicleGroups)
        : undefined,
      assignments: createAssignments(),
    });
  }
}

function cloneVehicleGroups(groups: VehicleGroup[]): VehicleGroup[] {
  return groups.map((g) => ({
    balloonId: g.balloonId,
    carIds: [...g.carIds],
  }));
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
        operatorId: assignment.operatorId,
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

  const series = referenceFlight.value;
  if (!series) {
    return undefined;
  }

  return series.legs[series.legs.length - 1];
}

function submit(data: CreateFlightDialogData) {
  onDialogOK(data);
}
</script>
