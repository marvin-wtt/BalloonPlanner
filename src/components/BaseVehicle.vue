<template>
  <draggable-item
    :item="vehicle"
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
          v-if="labeled"
          class="vehicle-label"
          :rowspan="capacity + 1"
        >
          <span>
            {{ vehicle.name }}
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
                <q-item-section @click="onVehicleEdit()">
                  {{ t('edit') }}
                </q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
              >
                <q-item-section
                  class="text-negative"
                  @click="onVehicleRemoved()"
                >
                  {{ t('remove') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </th>
        <th
          v-if="indexed"
          class="vehicle-index"
        >
          {{
            type === 'balloon' ? t('pilot_index', 'P') : t('driver_index', 'D')
          }}
        </th>
        <base-vehicle-person-cell
          class="vehicle-person"
          :class="indexed ? 'vehicle-person__indexed' : ''"
          :editable="editable"
          :person="vehicle.operator"
          :vehicle="vehicle"
          operator
          @add="(p) => emit('operatorAdd', p)"
          @remove="
            vehicle.operator
              ? emit('operatorRemove', vehicle.operator)
              : undefined
          "
          @edit="
            vehicle.operator ? emit('personEdit', vehicle.operator) : undefined
          "
        />
      </tr>

      <tr
        v-for="c in capacity"
        :key="c"
      >
        <td
          class="vehicle-index"
          v-if="indexed"
        >
          {{ c }}
        </td>
        <base-vehicle-person-cell
          class="vehicle-person"
          :class="indexed ? 'vehicle-person__indexed' : ''"
          :editable="editable"
          :person="vehicle.passengers[c - 1]"
          :vehicle="vehicle"
          @add="(p) => emit('passengerAdd', p)"
          @remove="emit('passengerRemove', vehicle.passengers[c - 1])"
          @edit="emit('personEdit', vehicle.passengers[c - 1])"
        />
      </tr>
    </table>
  </draggable-item>
</template>

<script lang="ts" setup>
import BaseVehiclePersonCell from 'components/BaseVehiclePersonCell.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import type { Person, Vehicle } from 'src/lib/entities';
import { Car } from 'src/lib/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const {
  vehicle,
  type,
  indexed = false,
  labeled = false,
  editable = false,
  hideEmpty = false,
} = defineProps<{
  vehicle: Vehicle;
  type: 'balloon' | 'car';
  indexed?: boolean;
  labeled?: boolean;
  editable?: boolean;
  hideEmpty?: boolean;
}>();

const emit = defineEmits<{
  (e: 'remove'): void;
  (e: 'edit'): void;
  (e: 'operatorAdd', person: Person): void;
  (e: 'operatorRemove', person: Person): void;
  (e: 'passengerAdd', person: Person): void;
  (e: 'passengerRemove', person: Person): void;
  (e: 'personEdit', person: Person): void;
}>();

const capacity = computed<number>(() => {
  let capacity: number = vehicle.capacity - 1;

  if (vehicleIsCar(vehicle)) {
    capacity -= vehicle.reservedCapacity;
  }

  if (capacity < 0) {
    capacity = 0;
  }

  return hideEmpty ? vehicle.passengers.length : capacity;
});

function vehicleIsCar(vehicle: Vehicle): vehicle is Car {
  return vehicle instanceof Car;
}

const error = computed<boolean>(() => {
  return (
    overfilled.value || tooMuchReservedCapacity.value || invalidOperator.value
  );
});

const errorMessage = computed<string>(() => {
  return overfilled.value
    ? t('tooltip_overfilled')
    : tooMuchReservedCapacity.value
      ? t('tooltip_too_much_reserved_capacity')
      : invalidOperator.value
        ? t('tooltip_invalid_operator')
        : '';
});

const tooMuchReservedCapacity = computed<boolean>(() => {
  return vehicleIsCar(vehicle) && vehicle.capacity <= vehicle.reservedCapacity;
});

const overfilled = computed<boolean>(() => {
  return vehicle.passengers.length > capacity.value;
});

const invalidOperator = computed<boolean>(() => {
  return (
    vehicle.operator !== undefined &&
    !vehicle.allowedOperators.includes(vehicle.operator)
  );
});

function onVehicleRemoved() {
  emit('remove');
}

function onVehicleEdit() {
  emit('edit');
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
