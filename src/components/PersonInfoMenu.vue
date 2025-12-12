<template>
  <q-menu
    anchor="top right"
    self="top start"
  >
    <q-card class="person-info-menu column no-wrap">
      <!-- Header: name, languages, weight (very compact) -->
      <q-card-section class="q-pa-sm q-pb-xs">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <q-avatar
              size="24px"
              :color="person.role === 'counselor' ? 'secondary' : 'primary'"
              text-color="white"
              class="q-mr-sm"
            >
              <q-icon
                name="person"
                size="16px"
              />
            </q-avatar>

            <div class="column">
              <div class="row items-center no-wrap">
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
                    class="q-pa-xs q-mr-xs"
                  >
                    {{ lang }}
                  </q-chip>
                </div>
              </div>

              <div
                v-if="hasWeight"
                class="text-caption text-grey-7"
              >
                {{ person.weight }}&nbsp;kg
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Divider + section title for flights -->
      <q-separator
        v-if="hasHistory"
        spaced
        inset
      />

      <q-card-section
        v-if="hasHistory"
        class="q-pa-xs q-pt-none"
      >
        <div class="row items-center q-px-xs q-mb-xs text-caption text-grey-6">
          <q-icon
            name="flight_takeoff"
            size="16px"
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
              <!-- Flight header -->
              <q-item-label class="flight-title text-caption">
                <q-chip
                  dense
                  size="sm"
                  class="q-mr-xs flight-index-chip"
                >
                  {{ flight.seriesIndex + 1 }}
                </q-chip>

                <span>Flight {{ flight.seriesIndex + 1 }}</span>
                <span v-if="flight.isCurrentFlight"> · current</span>
              </q-item-label>

              <!-- Vehicles vertically -->
              <q-item-label class="flight-vehicles text-caption">
                <div class="column">
                  <div
                    v-for="v in flight.vehicles"
                    :key="v.id"
                    class="row items-center q-mb-xs flight-vehicle-row"
                    :class="{ 'flight-vehicle-balloon': v.kind === 'balloon' }"
                  >
                    <q-icon
                      :name="
                        v.kind === 'balloon'
                          ? 'mdi-airballoon'
                          : 'directions_car'
                      "
                      size="16px"
                      class="q-mr-xs"
                    />

                    <div class="ellipsis">
                      {{ v.name }}
                      <span
                        v-if="v.isOperator"
                        class="text-italic"
                      >
                        (op)</span
                      >
                    </div>

                    <q-chip
                      v-if="v.group"
                      dense
                      size="xs"
                      class="q-ml-xs flight-group-chip"
                    >
                      {{ v.group }}
                    </q-chip>
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

const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);

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
  group?: string;
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
      // vehicles.sort((a, b) => {
      //   if (a.kind === b.kind) return 0;
      //   if (a.kind === 'balloon') return -1;
      //   if (b.kind === 'balloon') return 1;
      //   return 0;
      // });

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
  min-width: 180px;
  max-width: 260px;
}

.person-history-list {
  max-height: 220px;
  overflow-y: auto;
}

.person-history-list :deep(.q-item) {
  padding-top: 4px;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-radius: 18px;
}

.person-history-active {
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
}

.person-history-active :deep(.q-item__label) {
  color: inherit;
}

.flight-title {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.flight-index-chip {
  padding: 0 4px;
}

.flight-vehicles {
  margin-top: 2px;
}

.flight-vehicle-row {
  font-size: 11px;
}

.flight-vehicle-balloon {
  font-weight: 600;
}

.flight-group-chip {
  font-size: 10px;
  padding: 0 4px;
}
</style>
