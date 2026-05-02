<template>
  <q-menu
    anchor="top right"
    self="top start"
  >
    <q-card class="person-info-menu">
      <!-- Header -->
      <q-card-section class="q-pa-sm q-pb-xs">
        <div class="row items-start no-wrap q-gutter-sm">
          <q-avatar
            size="32px"
            :color="person.role === 'counselor' ? 'secondary' : 'primary'"
            text-color="white"
          >
            <q-icon
              name="person"
              size="20px"
            />
          </q-avatar>

          <div class="col-grow">
            <div class="row items-center no-wrap q-mb-none">
              <div class="text-subtitle2 col-shrink ellipsis q-mr-xs">
                {{ person.name }}
              </div>
              <q-icon
                v-if="person.firstTime"
                name="grade"
                size="16px"
                color="amber-7"
                class="q-ml-xs"
              >
                <q-tooltip>First flight</q-tooltip>
              </q-icon>
            </div>

            <div class="text-caption text-grey-7">
              <span>{{ roleLabel }}</span>
              <template v-if="nationalityLabel">
                <span class="text-grey-5"> · </span>
                <span>{{ nationalityLabel }}</span>
              </template>
              <template v-if="hasWeight">
                <span class="text-grey-5"> · </span>
                <span>{{ person.weight }}&thinsp;kg</span>
              </template>
            </div>

            <div
              v-if="hasLanguages"
              class="row items-center no-wrap q-mt-xs q-gutter-xs"
            >
              <q-chip
                v-for="lang in person.languages"
                :key="lang"
                dense
                size="sm"
                class="q-ma-none q-px-xs"
              >
                {{ lang }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Flight history -->
      <template v-if="hasHistory">
        <q-separator
          spaced
          inset
        />

        <q-card-section class="q-pa-xs q-pt-none">
          <div
            class="row items-center q-px-xs q-mb-xs text-caption text-grey-6"
          >
            <q-icon
              name="flight_takeoff"
              size="14px"
              class="q-mr-xs"
            />
            <span>Flights</span>
          </div>

          <q-list
            dense
            class="person-history-list"
          >
            <q-item
              v-for="flight in flightHistory"
              :key="flight.seriesId"
              dense
              :active="flight.isCurrentFlight"
              active-class="person-history-active"
            >
              <q-item-section>
                <q-item-label class="flight-header text-caption">
                  <span class="text-weight-medium">{{
                    flightLabel(flight)
                  }}</span>
                  <q-badge
                    v-if="flight.isCurrentFlight"
                    color="primary"
                    class="q-ml-xs"
                  >
                    now
                  </q-badge>
                </q-item-label>

                <q-item-label class="text-caption q-mt-xs">
                  <div
                    v-for="v in flight.vehicles"
                    :key="v.id"
                    class="row items-center q-mb-xs vehicle-row"
                    :class="
                      v.kind === 'balloon'
                        ? 'vehicle-row--balloon'
                        : 'vehicle-row--car'
                    "
                  >
                    <q-icon
                      :name="
                        v.kind === 'balloon' ? 'flight' : 'airport_shuttle'
                      "
                      :color="v.kind === 'balloon' ? 'primary' : 'grey-6'"
                      size="14px"
                      class="q-mr-xs"
                    />
                    <span class="ellipsis col-grow">{{ v.name }}</span>
                    <span
                      v-if="v.group"
                      class="group-label q-ml-xs"
                      :class="{
                        'text-primary': v.kind === 'balloon',
                        'text-bold': v.kind === 'balloon',
                      }"
                    >
                      [{{ v.group }}]
                    </span>
                  </div>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </template>

      <!-- Empty state -->
      <q-card-section
        v-if="isEmpty"
        class="q-pa-sm text-caption text-grey-6 text-center"
      >
        No additional information.
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type {
  FlightSeries,
  Person,
  ID,
  VehicleKind,
} from 'app/src-common/entities';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import { vehicleGroupLabel } from 'src/util/group';

const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);

const { person, flightSeries } = defineProps<{
  person: Person;
  flightSeries: FlightSeries;
}>();

const NATIONALITY_LABELS: Record<string, string> = {
  de: 'German',
  fr: 'French',
};

const hasLanguages = computed(
  () => !!person.languages && person.languages.length > 0,
);

const hasWeight = computed(() => typeof person.weight === 'number');

const nationalityLabel = computed<string | undefined>(
  () =>
    NATIONALITY_LABELS[person.nationality] ?? (person.nationality || undefined),
);

const roleLabel = computed<string>(() =>
  person.role === 'counselor' ? 'Counselor' : 'Participant',
);

interface VehicleInFlightSummary {
  id: ID;
  kind: VehicleKind | 'unknown';
  name: string;
  group?: string;
  isOperator: boolean;
}

interface FlightHistorySummary {
  seriesId: ID;
  seriesIndex: number;
  isCurrentFlight: boolean;
  vehicles: VehicleInFlightSummary[];
}

function resolveVehicle(vehicleId: ID): {
  kind: VehicleKind | 'unknown';
  name: string;
} {
  const balloon = project.value?.balloons.find((b) => b.id === vehicleId);
  if (balloon) {
    return { kind: 'balloon', name: balloon.name };
  }

  const car = project.value?.cars.find((c) => c.id === vehicleId);
  if (car) {
    return { kind: 'car', name: car.name };
  }

  return { kind: 'unknown', name: vehicleId };
}

const flightHistory = computed<FlightHistorySummary[]>(() => {
  const seriesList = project.value?.flights ?? [flightSeries];
  return buildHistoryForSeriesList(seriesList, person.id);
});

function buildHistoryForSeriesList(
  seriesList: FlightSeries[],
  personId: ID,
): FlightHistorySummary[] {
  const result: FlightHistorySummary[] = [];

  seriesList.forEach((series, seriesIndex) => {
    const vehicleMapForSeries = new Map<ID, VehicleInFlightSummary>();

    series.legs.forEach((leg) => {
      for (const [vehicleId, assignment] of Object.entries(leg.assignments)) {
        const isOperator = assignment.operatorId === personId;
        const isPassenger = assignment.passengerIds.includes(personId);

        if (!isOperator && !isPassenger) {
          continue;
        }

        const { kind, name } = resolveVehicle(vehicleId);

        const groupIndex = series.vehicleGroups.findIndex(
          (group) =>
            group.balloonId === vehicleId || group.carIds.includes(vehicleId),
        );
        const groupLetter =
          groupIndex >= 0 ? vehicleGroupLabel(groupIndex) : undefined;

        const existing = vehicleMapForSeries.get(vehicleId);

        if (!existing) {
          vehicleMapForSeries.set(vehicleId, {
            id: vehicleId,
            kind,
            name,
            group: groupLetter,
            isOperator,
          });
        } else {
          existing.isOperator = existing.isOperator || isOperator;
          if (!existing.group && groupLetter) {
            existing.group = groupLetter;
          }
        }
      }
    });

    const vehicles = Array.from(vehicleMapForSeries.values());
    vehicles.sort((a, b) => {
      if (a.kind === b.kind) return 0;
      if (a.kind === 'balloon') return -1;
      if (b.kind === 'balloon') return 1;
      return 0;
    });

    if (vehicles.length > 0) {
      result.push({
        seriesId: series.id,
        seriesIndex,
        isCurrentFlight: series.id === flightSeries.id,
        vehicles,
      });
    }
  });

  return result;
}

function flightLabel(flight: FlightHistorySummary): string {
  return `Flight ${(flight.seriesIndex + 1).toString()}`;
}

const hasHistory = computed(() => flightHistory.value.length > 0);

const isEmpty = computed(
  () =>
    !hasLanguages.value &&
    !hasWeight.value &&
    !hasHistory.value &&
    !person.firstTime &&
    !nationalityLabel.value,
);
</script>

<style scoped>
.person-info-menu {
  min-width: 200px;
}

.person-history-list {
  max-height: 240px;
  overflow-y: auto;
}

.flight-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.vehicle-row {
  font-size: 11px;
  line-height: 1.4;
}

.vehicle-row--balloon {
  font-weight: 600;
}

.vehicle-row--car {
  color: rgba(0, 0, 0, 0.54);
  font-size: 10px;
}

.group-label {
  font-size: 10px;
  font-weight: 600;
  font-family: monospace;
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.operator-label {
  font-size: 10px;
  font-style: italic;
  flex-shrink: 0;
}
</style>
