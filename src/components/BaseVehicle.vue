<template>
  <draggable-item :item="props.vehicle" @remove="onVehicleRemoved" class="row">
    <table
      class="vehicle-table shadow-2"
      @dragenter.stop
      @dragover.stop
      @dragleave.stop
    >
      <tr>
        <th
          class="vehicle-label"
          :rowspan="props.vehicle.capacity + 1"
          v-if="props.labeled"
        >
          <span>
            {{ props.vehicle.name }}
          </span>
          <q-menu touch-position context-menu>
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
          :editable="props.editable"
          :person="props.vehicle.operator"
          :vehicle="props.vehicle"
          operator
          @operator-add="(p) => $emit('operatorAdd', p)"
          @operator-remove="(p) => $emit('operatorRemove', p)"
        />
      </tr>

      <tr v-for="c in capacity" :key="c">
        <td class="vehicle-index" v-if="props.indexed">
          {{ c }}
        </td>
        <base-vehicle-person-cell
          class="vehicle-person"
          :editable="props.editable"
          :person="props.vehicle.passengers[c - 1]"
          :vehicle="props.vehicle"
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

import { Car, Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';

interface Props {
  vehicle: Vehicle;
  type: 'balloon' | 'car';
  indexed?: boolean;
  labeled?: boolean;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  indexed: true,
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

const capacity = computed(() => {
  if (props.vehicle instanceof Car) {
    return props.vehicle.capacity - props.vehicle.reseavedCapacity;
  }

  return props.vehicle.capacity;
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
