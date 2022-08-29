<template>
  <draggable-item
      :item="vehicle"
      @removed="onVehicleRemoved"
  >
    <table class="vehicle-table" @dragenter.stop @dragover.stop @dragleave.stop>
      <tr>
        <th
            class="vehicle-label"
            :rowspan="vehicle.information.capacity + 1"
            v-if="labeled"
        >
          <span>
            {{ vehicle.information.name }}
          </span>
        </th>
        <th class="vehicle-index" v-if="indexed">
          {{ $t('pilot_index', 'P') }}
        </th>
        <base-flight-vehicle-person-cell
            :editable="editable"
            :person="vehicle.operator"
            operator
        />
      </tr>

      <tr
          v-for="c in editable
          ? vehicle.information.capacity
          : vehicle.passengers.length"
          :key="c"
      >
        <td class="vehicle-index" v-if="indexed">
          {{ c }}
        </td>
        <base-flight-vehicle-person-cell
            :editable="editable"
            :person="vehicle.passengers[c - 1]"
            :vehicle="vehicle"
        />
      </tr>
    </table>
  </draggable-item>
</template>

<script lang="ts" setup>
import BaseFlightVehiclePersonCell from 'components/BaseFlightVehiclePersonCell.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';

import { Vehicle } from 'src/lib/entities';
import { DragHelper } from 'src/util/DragHelper';
import { Identifyable } from 'src/lib/utils/Identifyable';

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

function onVehicleRemoved(element: Identifyable) {
  // TODO
  console.log(element);
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

/*[draggable] * {*/
/*  cursor: move;*/
/*  -webkit-touch-callout: none; !* iOS Safari *!*/
/*  -webkit-user-select: none; !* Safari *!*/
/*  -khtml-user-select: none; !* Konqueror HTML *!*/
/*  -moz-user-select: none; !* Old versions of Firefox *!*/
/*  -ms-user-select: none; !* Internet Explorer/Edge *!*/
/*  user-select: none; !* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox *!*/
/*}*/

/** {*/
/*  outline: 1px solid red;*/
/*}*/
</style>