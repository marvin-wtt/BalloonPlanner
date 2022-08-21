<template>
  <div>
    <table class="vehicle-table">
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
        <th class="vehicle-person">
          {{
            editable
                ? createPersonLable(vehicle.operator).value
                : vehicle.operator?.name
          }}
        </th>
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
        <td class="vehicle-person">
          {{
            editable
                ? createPersonLable(vehicle.passengers[c - 1]).value
                : vehicle.passengers[c - 1].name
          }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';

interface Props {
  vehicle: Vehicle;
  indexed?: boolean;
  labeled?: boolean;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  indexed: false,
  labeled: true,
  editable: true,
});

function createPersonLable(person: Person) {
  return computed(() => {
    if (person === undefined) {
      return '';
    }

    return person.name + ' (' + (person.numberOfFlights - 1) + ')';
  });
}
</script>

<style scoped>
.vehicle-table {
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

.vehicle-person {
  min-width: 120px;
  height: 30px;
  padding: 0 0.5em;
  border-left: 2px solid;
}

td.vehicle-person {
  border-bottom: 0.5px dotted;
}

th {
  border-bottom: 2px solid;
}

/** {*/
/*  outline: 1px solid red;*/
/*}*/
</style>