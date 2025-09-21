<template>
  <draggable-item
    :item="vehicle"
    :label="vehicle.name"
    :disabled="!editable || !allowVehicleGroupChange"
    class="row"
    @remove="onVehicleRemoved"
  >
    <table
      class="vehicle-table shadow-2 relative-position"
      @dragenter.stop
      @dragover.stop
      @dragleave.stop
    >
      <!-- thead and tfoot are not used on purpose to preserve the style -->
      <tbody>
        <tr>
          <th
            v-if="showVehicleLabel"
            class="vehicle-label"
            :class="{ 'vehicle-label--rounded': !showFooter }"
            :style="{ backgroundColor: color }"
            :rowspan="rowCount"
          >
            <div class="col no-wrap">
              <q-icon
                v-if="showVehicleIcon"
                :name="
                  vehicle.type === 'balloon'
                    ? 'mdi-airballoon'
                    : 'airport_shuttle'
                "
                size="xs"
                class="rotate-270 q-mb-sm"
              />

              <div>
                <span>
                  {{ vehicle.name ?? '&#160;' }}
                </span>
              </div>
            </div>

            <q-menu
              touch-position
              context-menu
            >
              <q-list
                dense
                style="min-width: 100px"
              >
                <q-item
                  v-close-popup
                  clickable
                  @click="onVehicleEdit()"
                >
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="onVehicleClear()"
                >
                  <q-item-section>Clear</q-item-section>
                </q-item>
                <q-item
                  v-if="!isCanceled"
                  v-close-popup
                  clickable
                  :disable="isFirstLeg"
                  @click="onFlightCancel()"
                >
                  <q-item-section class="text-warning">Cancel</q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-close-popup
                  clickable
                  :disable="isFirstLeg"
                  @click="omFlightReactivate()"
                >
                  <q-item-section class="text-info">Reactivate</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :disable="!allowVehicleGroupChange"
                  @click="onVehicleRemoved()"
                >
                  <q-item-section class="text-negative">
                    Remove
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </th>
          <th
            v-if="showVehicleIndex"
            class="vehicle-index"
          >
            {{ vehicle.type === 'balloon' ? 'P' : 'D' }}
          </th>
          <base-vehicle-person-cell
            class="vehicle-person"
            :class="showVehicleIndex ? 'vehicle-person__indexed' : ''"
            :person="
              assignment.operatorId
                ? personMap[assignment.operatorId]
                : undefined
            "
            :flight-leg
            :flight-series
            :group
            :vehicle
            :assignment
            operator
            :editable
          />
        </tr>

        <tr
          v-for="c in rowCount - 1"
          :key="c"
        >
          <td
            v-if="showVehicleIndex"
            class="vehicle-index q-px-sm"
          >
            <template v-if="c <= capacity - 1">
              {{ c }}
            </template>
            <span
              v-else
              class="text-negative"
            >
              -
            </span>
          </td>
          <base-vehicle-person-cell
            class="vehicle-person"
            :class="showVehicleIndex ? 'vehicle-person__indexed' : ''"
            :person="
              assignment.passengerIds[c - 1]
                ? personMap[assignment.passengerIds[c - 1]!]
                : undefined
            "
            :flight-leg
            :flight-series
            :group
            :vehicle
            :assignment
            :editable
            :overfilled="c > capacity - 1"
          />
        </tr>

        <tr v-if="showFooter">
          <td
            colspan="3"
            class="vehicle-footer"
          >
            <div class="row no-wrap items-center">
              <div class="col-grow">
                <template
                  v-if="vehicle.type === 'balloon' && vehicle.maxWeight"
                >
                  <span :class="isOverweight ? 'text-negative text-bold' : ''">
                    {{ totalWeight }} kg
                  </span>
                  <span>/ {{ vehicle.maxWeight }} kg</span>
                </template>
                <template v-else>{{ totalWeight }} kg</template>
              </div>
              <div v-if="isOverweight">
                <q-icon
                  name="sym_o_error"
                  color="warning"
                  size="sm"
                  dense
                >
                  <q-tooltip>Total weight exceeds maximum weight. </q-tooltip>
                </q-icon>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </draggable-item>
</template>

<script lang="ts" setup>
import BaseVehiclePersonCell from 'components/BaseVehiclePersonCell.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import type {
  FlightLeg,
  FlightSeries,
  Vehicle,
  VehicleAssignment,
  VehicleGroup,
} from 'app/src-common/entities';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import { useFlightUtils } from 'src/composables/reservedCapacity';
import { useFlightOperations } from 'src/composables/flightOperations';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import { useQuasar } from 'quasar';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';
import { useProjectStore } from 'stores/project';
import { useProjectSettings } from 'src/composables/projectSettings';

const {
  removeCarFromVehicleGroup,
  removeVehicleGroup,
  clearVehicle,
  editBalloon,
  editCar,
  cancelFlight,
  reactivateFlight,
} = useFlightOperations();
const quasar = useQuasar();
const { remainingCapacity } = useFlightUtils();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { balloonMap, carMap, personMap } = storeToRefs(flightStore);
const {
  disableVehicleGroupProtection,
  showVehicleWeight,
  showVehicleIndex,
  showVehicleLabel,
  showVehicleIcon,
  personDefaultWeight,
  balloonColor,
  carColor,
} = useProjectSettings();

const {
  vehicleId,
  group,
  flightSeries,
  flightLeg,
  assignment,
  editable = false,
} = defineProps<{
  vehicleId: string;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  group: VehicleGroup;
  assignment: VehicleAssignment;
  editable?: boolean;
}>();

const hideEmptyCapacity = ref<boolean>(false);

const vehicle = computed<Vehicle>(() => {
  if (vehicleId in carMap.value) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return carMap.value[vehicleId]!;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return balloonMap.value[vehicleId]!;
});

const totalWeight = computed<number>(() => {
  const fallback = personDefaultWeight.value ?? 0;

  const operatorWeight = assignment.operatorId
    ? (personMap.value[assignment.operatorId]?.weight ?? fallback)
    : fallback;

  return assignment.passengerIds
    .map((id) => personMap.value[id])
    .reduce<number>(
      (acc, person) => acc + (person?.weight ?? fallback),
      operatorWeight,
    );
});

const isOverweight = computed<boolean>(() => {
  return (
    vehicle.value.type === 'balloon' &&
    vehicle.value.maxWeight !== undefined &&
    totalWeight.value > vehicle.value.maxWeight
  );
});

const capacity = computed<number>(() => {
  let capacity: number = vehicle.value.maxCapacity;

  if (vehicle.value.type === 'car') {
    capacity = remainingCapacity(group)[vehicleId] ?? 0;
  }

  if (capacity < 0) {
    console.warn(
      `Invalid capacity for ${vehicle.value.type} ${vehicle.value.name}`,
    );
    capacity = 0;
  }

  return hideEmptyCapacity.value ? assignment.passengerIds.length : capacity;
});

const rowCount = computed<number>(() => {
  return Math.max(capacity.value, assignment.passengerIds.length + 1);
});

const color = computed<string>(() => {
  return vehicle.value.type === 'balloon'
    ? (balloonColor.value ?? '')
    : (carColor.value ?? '');
});

const isFirstLeg = computed<boolean>(() => {
  return flightSeries.legs.findIndex((l) => l.id === flightLeg.id) === 0;
});

const allowVehicleGroupChange = computed<boolean>(() => {
  return isFirstLeg.value || (disableVehicleGroupProtection.value ?? false);
});

const isCanceled = computed<boolean>(() => {
  return flightLeg.canceledBalloonIds.includes(vehicleId);
});

const showFooter = computed<boolean>(() => {
  if (isOverweight.value) {
    return true;
  }

  return vehicle.value.type === 'balloon' && (showVehicleWeight.value ?? false);
});

function onFlightCancel() {
  cancelFlight(vehicleId);
}

function omFlightReactivate() {
  reactivateFlight(vehicleId);
}

function onVehicleRemoved() {
  if (vehicle.value.type === 'balloon') {
    removeVehicleGroup(vehicleId);
  } else {
    removeCarFromVehicleGroup(group.balloonId, vehicleId);
  }
}

function onVehicleClear() {
  clearVehicle(vehicleId);
}

function onVehicleEdit() {
  if (!project.value) {
    return;
  }

  if (vehicle.value.type === 'balloon') {
    quasar
      .dialog({
        component: EditBalloonDialog,
        componentProps: {
          balloon: vehicle.value,
          people: project.value.people,
          existingNames: project.value.balloons.map(({ name }) => name),
        },
      })
      .onOk((payload) => {
        editBalloon(vehicleId, payload);
      });
  } else {
    quasar
      .dialog({
        component: EditCarDialog,
        componentProps: {
          car: vehicle.value,
          people: project.value.people,
          existingNames: project.value.cars.map(({ name }) => name),
        },
      })
      .onOk((payload) => {
        editCar(vehicleId, payload);
      });
  }
}
</script>

<style scoped>
.vehicle-table {
  background-color: white;
  border-collapse: collapse;
  border-radius: 10px;
}

.vehicle-footer {
  text-align: center;
  font-size: 0.8rem;
  border-top: 1px solid;
}

.vehicle-table tr:last-child * {
  border-bottom: none;
}

.vehicle-label {
  vertical-align: center;
  text-align: center;
  padding: 0.5em;
  border: 0;
  background-color: darkgray;
  color: white;
  border-radius: 10px 0 0 0;
}

.vehicle-label--rounded {
  border-radius: 10px 0 0 10px;
}

.vehicle-label span {
  -ms-writing-mode: tb-rl;
  -webkit-writing-mode: vertical-rl;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}

.vehicle-index {
  min-width: 0;
  text-align: center;
  font-weight: bold;
  width: 2em;
}

th {
  border-bottom: 2px solid;
}

.vehicle-person {
  min-width: 120px;
  height: 30px;
  padding: 0 0.5em;
}

.vehicle-person__indexed {
  border-left: 2px solid;
}

td.vehicle-person {
  border-bottom: 0.5px dotted;
}
</style>
