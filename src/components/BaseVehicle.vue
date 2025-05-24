<template>
  <draggable-item
    :item="vehicle"
    :disabled="!editable"
    class="row"
    @remove="onVehicleRemoved"
  >
    <table
      class="vehicle-table shadow-2 relative-position"
      @dragenter.stop
      @dragover.stop
      @dragleave.stop
    >
      <q-badge
        v-if="error"
        color="negative"
        floating
        rounded
      >
        <q-icon
          name="warning"
          color="white"
          size="1rem"
        />
        <q-tooltip>
          {{ errorMessage }}
        </q-tooltip>
      </q-badge>

      <tr>
        <th
          v-if="showVehicleLabel"
          class="vehicle-label"
          :rowspan="capacity + 1"
        >
          <span>
            {{ vehicleName }}
          </span>
          <q-menu
            touch-position
            context-menu
          >
            <q-list
              dense
              style="min-width: 100px"
            >
              <q-item
                clickable
                v-close-popup
              >
                <q-item-section @click="onVehicleEdit()"> Edit</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
              >
                <q-item-section
                  class="text-negative"
                  @click="onVehicleRemoved()"
                >
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
          :person="personMap[assignment.operatorId]"
          :vehicle
          :group
          :assignment
          operator
          :editable
        />
      </tr>

      <tr
        v-for="c in capacity - 1"
        :key="c"
      >
        <td
          class="vehicle-index"
          v-if="showVehicleIndex"
        >
          {{ c }}
        </td>
        <base-vehicle-person-cell
          class="vehicle-person"
          :class="showVehicleIndex ? 'vehicle-person__indexed' : ''"
          :person="personMap[assignment.passengerIds[c - 1]]"
          :vehicle
          :group
          :assignment
          :editable
        />
      </tr>
    </table>
  </draggable-item>
</template>

<script lang="ts" setup>
import BaseVehiclePersonCell from 'components/BaseVehiclePersonCell.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import type {
  Vehicle,
  VehicleAssignment,
  VehicleGroup,
} from 'app/src-common/entities';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import { useFlightUtils } from 'src/composables/reservedCapacity';
import { useFlightOperations } from 'src/composables/flight-operations';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import { useQuasar } from 'quasar';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';
import { useSettingsStore } from 'stores/settings';

const { removeCarFromVehicleGroup, removeVehicleGroup, editBalloon, editCar } =
  useFlightOperations();
const quasar = useQuasar();
const { remainingCapacity } = useFlightUtils();
const flightStore = useFlightStore();
const { balloonMap, carMap, personMap } = storeToRefs(flightStore);
const settingsStore = useSettingsStore();
const { showVehicleWeight, showVehicleIndex, showVehicleLabel } =
  storeToRefs(settingsStore);

const {
  group,
  assignment,
  editable = false,
} = defineProps<{
  group: VehicleGroup;
  assignment: VehicleAssignment;
  editable?: boolean;
}>();

// TODO This is currently not used
const hideEmptyCapacity = ref<boolean>(false);

const vehicle = computed<Vehicle>(() => {
  if (carMap.value[assignment.id]) {
    return carMap.value[assignment.id];
  }

  return balloonMap.value[assignment.id];
});

const vehicleName = computed<string>(() => {
  let name = vehicle.value.name;

  if (showVehicleWeight.value) {
    const totalWeight =
      assignment.passengerIds
        .map((id) => personMap.value[id])
        .reduce<number>((acc, person) => acc + (person?.weight ?? 0), 0) +
      (personMap[assignment.operatorId]?.weight ?? 0);

    name += ` (${totalWeight} kg)`;
  }

  return name;
});

const capacity = computed<number>(() => {
  let capacity: number = vehicle.value.maxCapacity;

  if (vehicle.value.type === 'car') {
    // Compute reserved capacity
    capacity = remainingCapacity(group)[assignment.id] ?? 0;
  }

  if (capacity < 0) {
    console.warn(
      `Invalid capacity for ${vehicle.value.type} ${vehicle.value.name}`,
    );
    capacity = 0;
  }

  return hideEmptyCapacity.value ? assignment.passengerIds.length : capacity;
});

const error = computed<boolean>(() => {
  return overfilled.value || invalidOperator.value;
});

const errorMessage = computed<string>(() => {
  return overfilled.value
    ? 'Too many passengers for this vehicle.'
    : invalidOperator.value
      ? 'This operator is not allowed for this vehicle.'
      : 'An unknown error occurred.';
});

const overfilled = computed<boolean>(() => {
  return assignment.passengerIds.length > capacity.value;
});

const invalidOperator = computed<boolean>(() => {
  return (
    assignment.operatorId !== null &&
    !vehicle.value.allowedOperatorIds.includes(assignment.operatorId)
  );
});

function onVehicleRemoved() {
  if (vehicle.value.type === 'balloon') {
    removeVehicleGroup(assignment.id);
  } else {
    removeCarFromVehicleGroup(group.balloon.id, assignment.id);
  }
}

function onVehicleEdit() {
  if (vehicle.value.type === 'balloon') {
    quasar
      .dialog({
        component: EditBalloonDialog,
        componentProps: {
          balloon: vehicle.value,
          people: Object.values(personMap.value),
          existingNames: Object.values(balloonMap.value).map(
            ({ name }) => name,
          ),
        },
      })
      .onOk((payload) => {
        editBalloon(assignment.id, payload);
      });
  } else {
    quasar
      .dialog({
        component: EditCarDialog,
        componentProps: {
          car: vehicle.value,
          people: Object.values(personMap.value),
          existingNames: Object.values(carMap.value).map(({ name }) => name),
        },
      })
      .onOk((payload) => {
        editCar(assignment.id, payload);
      });
  }
}
</script>

<style scoped>
.vehicle-table {
  /* TODO use default bg color -- support dark mode later */
  background-color: white;
  margin: 20px;
  border-collapse: collapse;
  /*border: 1px solid;*/
  border-radius: 10px;
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
