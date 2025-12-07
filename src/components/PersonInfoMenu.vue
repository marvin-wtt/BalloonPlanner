<template>
  <q-menu
    v-model="model"
    anchor="top right"
    self="top start"
  >
    <q-card class="person-info-menu column no-wrap">
      <!-- Header: name, languages, weight (very compact) -->
      <q-card-section class="q-pa-sm q-pb-none">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <q-icon
              name="person"
              size="16px"
              class="q-mr-xs"
            />

            <div class="text-subtitle2 ellipsis q-mr-xs">
              {{ person.name }}
            </div>

            <div
              v-if="hasLanguages"
              class="row items-center"
            >
              <q-chip
                v-for="lang in person.languages"
                :key="lang"
                dense
                size="sm"
                class="q-pa-xs q-mr-xs q-mb-xs"
              >
                {{ lang }}
              </q-chip>
            </div>
          </div>

          <div
            v-if="hasWeight"
            class="text-caption text-grey-7 q-ml-sm"
          >
            {{ person.weight }}&nbsp;kg
          </div>
        </div>
      </q-card-section>

      <!-- Flight history over whole project -->
      <q-card-section
        v-if="hasHistory"
        class="q-pa-xs q-pt-none"
      >
        <q-list
          dense
          class="person-history-list"
        >
          <q-item
            v-for="flight in flightHistory"
            :key="flight.seriesId"
            dense
            :active="flight.isCurrentFlight"
            active-class="bg-primary text-white"
          >
            <q-item-section>
              <q-item-label
                top
                class="text-caption"
              >
                Flight {{ flight.seriesIndex + 1 }}
                <span v-if="flight.isCurrentFlight"> · current </span>
              </q-item-label>

              <!-- Vehicles vertically -->
              <q-item-label caption>
                <div class="column">
                  <div
                    v-for="v in flight.vehicles"
                    :key="v.id"
                    class="row items-center q-mb-xs"
                    :class="v.kind === 'balloon' ? 'text-bold' : ''"
                  >
                    <q-icon
                      :name="
                        v.kind === 'balloon'
                          ? 'mdi-airballoon'
                          : 'directions_car'
                      "
                      size="14px"
                      class="q-mr-xs"
                    />
                    <div class="ellipsis">
                      {{ v.name }}
                      <span v-if="v.isOperator"> (op)</span>
                      <span v-if="v.group"> · {{ v.group }}</span>
                    </div>
                  </div>
                </div>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <!-- Empty state -->
      <q-card-section
        v-if="!hasLanguages && !hasWeight && !hasHistory"
        class="q-pa-sm text-caption text-grey-6"
      >
        No additional information.
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type {
  FlightLeg,
  FlightSeries,
  Person,
  ID,
  VehicleKind,
} from 'app/src-common/entities';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import { useProjectStore } from 'stores/project';

const model = defineModel<boolean>();

const flightStore = useFlightStore();
const { balloonMap, carMap } = storeToRefs(flightStore);

const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);

// prop destructuring
const { person, flightSeries } = defineProps<{
  person: Person;
  flightSeries: FlightSeries;
}>();

const hasLanguages = computed(
  () => !!person.languages && person.languages.length > 0,
);

const hasWeight = computed(() => typeof person.weight === 'number');

interface VehicleInFlightSummary {
  id: ID;
  kind: VehicleKind | 'unknown';
  name: string;
  group?: string; // 'A', 'B', ...
  isOperator: boolean;
}

interface FlightHistorySummary {
  seriesId: ID;
  seriesIndex: number;
  date?: string;
  isCurrentFlight: boolean;
  vehicles: VehicleInFlightSummary[];
}

function resolveVehicle(vehicleId: ID): {
  kind: VehicleKind | 'unknown';
  name: string;
} {
  const balloon = balloonMap.value[vehicleId];
  if (balloon) {
    return { kind: 'balloon', name: balloon.name };
  }

  const car = carMap.value[vehicleId];
  if (car) {
    return { kind: 'car', name: car.name };
  }

  return { kind: 'unknown', name: vehicleId };
}

const flightHistory = computed<FlightHistorySummary[]>(() => {
  if (!project.value) {
    // fallback: only current series
    return buildHistoryForSeriesList([flightSeries], person.id);
  }

  return buildHistoryForSeriesList(project.value.flights, person.id);
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
          groupIndex >= 0 ? String.fromCharCode(65 + groupIndex) : undefined;

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

    if (vehicles.length > 0) {
      //      vehicles.sort((a, b) => {
      //        if (a.kind === b.kind) return 0;
      //        if (a.kind === 'balloon') return -1;
      //        if (b.kind === 'balloon') return 1;
      //        return 0;
      //      });

      result.push({
        seriesId: series.id,
        seriesIndex,
        date: series.date,
        isCurrentFlight: series.id === flightSeries.id,
        vehicles,
      });
    }
  });

  return result;
}

const hasHistory = computed(() => flightHistory.value.length > 0);
</script>

<style scoped>
.person-info-menu {
  min-width: 200px;
  max-width: 240px;
}

.person-history-list {
  max-height: 200px;
  overflow-y: auto;
}

.person-history-list :deep(.q-item) {
  padding-top: 2px;
  padding-bottom: 2px;
}

.person-history-list .q-item {
  border-radius: 25px;
}

.person-history-list .q-item--active .q-item__label--caption {
  color: lightgray;
}
</style>
