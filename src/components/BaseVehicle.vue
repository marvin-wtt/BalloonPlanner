<template>
  <draggable-item :item="vehicle" @removed="onVehicleRemoved">
    <table class="vehicle-table" @dragenter.stop @dragover.stop @dragleave.stop>
      <tr>
        <th
          class="vehicle-label"
          :rowspan="vehicle.capacity + 1"
          v-if="labeled"
        >
          <span>
            {{ vehicle.name }}
          </span>
          <q-menu
            touch-position
            context-menu
            >
            <q-list dense style="min-width: 100px">
              <q-item clickable v-close-popup>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section>Remove</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </th>
        <th class="vehicle-index" v-if="indexed">
          {{ $t('pilot_index', 'P') }}
        </th>
        <base-vehicle-person-cell
          class="vehicle-person"
          :editable="editable"
          :person="vehicle.operator"
          :vehicle="vehicle"
          operator
          @operator-add="(p) => $emit('operatorAdd', p)"
          @operator-remove="(p) => $emit('operatorRemove', p)"
        />
      </tr>

      <tr v-for="c in passengerSeats" :key="c">
        <td class="vehicle-index" v-if="indexed">
          {{ c }}
        </td>
        <base-vehicle-person-cell
          class="vehicle-person"
          :editable="editable"
          :person="vehicle.passengers[c - 1]"
          :vehicle="vehicle"
          @passenger-add="(p) => $emit('passengerAdd', p)"
          @passenger-remove="(p) => $emit('passengerRemove', p)"
        />
      </tr>
    </table>
  </draggable-item>
</template>

<script lang="ts" setup>
import BaseVehiclePersonCell from 'components/BaseVehiclePersonCell.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';

import { Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';

interface Props {
  vehicle: Vehicle;
  type: 'balloon' | 'car';
  indexed?: boolean;
  labeled?: boolean;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  indexed: false,
  labeled: true,
  editable: true,
});

const emit = defineEmits<{
  (e: 'carRemove', vehicle: Vehicle): void;
  (e: 'balloonRemove', vehicle: Vehicle): void;
  (e: 'operatorAdd', person: Person): void;
  (e: 'operatorRemove', person: Person): void;
  (e: 'passengerAdd', person: Person): void;
  (e: 'passengerRemove', person: Person): void;
}>();

const passengerLabels = computed(() => {
  if (!props.editable) {
    return props.vehicle.passengers.map((value) => value.name);
  }

  return props.vehicle.passengers.map(
    (value) => value.name + ' (' + (value.numberOfFlights - 1) + ')'
  );
});

const freePlaces = computed(() => {
  return props.vehicle.capacity - props.vehicle.passengers.length;
});

const passengerSeats = computed(() => {
  return props.editable
    ? props.vehicle.passengers.length + props.vehicle.availableCapacity()
    : props.vehicle.passengers.length;
});

function onVehicleRemoved() {
  if (props.type === 'balloon') {
    emit('balloonRemove', props.vehicle);
  } else {
    emit('carRemove', props.vehicle);
  }
}
</script>

<style scoped>
.vehicle-table {
  /* TODO use default bg color */
  background-color: white;
  margin: 20px;
  border-collapse: collapse;
  border: 1px solid;
  border-radius: 10px;
}

.vehicle-label {
  vertical-align: center;
  text-align: center;
  padding: 0.5em;
  border: 0;
  background-color: darkgray;
  color: white;
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
  border-left: 2px solid;
}

td.vehicle-person {
  border-bottom: 0.5px dotted;
}
</style>