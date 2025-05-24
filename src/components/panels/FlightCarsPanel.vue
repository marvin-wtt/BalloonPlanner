<template>
  <q-tab-panel
    :name
    class="column bg-grey-2 q-pa-none"
  >
    <q-scroll-area class="col-grow self-stretch q-pa-md">
      <editable-list
        title="Cars"
        item-name="Car"
        :items="cars"
        @create="showCreateCar"
        @edit="(car) => showEditCar(car.id)"
        @delete="(car) => showDeleteCar(car)"
      >
        <template #main="{ item }: { item: Car }">
          {{ item.name }}
        </template>
        <template #side="{ item }: { item: Car }">
          {{ item.maxCapacity - 1 + ' + 1' }}
        </template>
      </editable-list>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';
import { useFlightOperations } from 'src/composables/flight-operations';
import type { Car } from 'app/src-common/entities';
import EditableList from 'components/EditableList.vue';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';

const quasar = useQuasar();
const flightStore = useFlightStore();
const { carMap, personMap } = storeToRefs(flightStore);
const { addCar, editCar, removeCar } = useFlightOperations();

const { name } = defineProps<{
  name: string;
  cars: Car[];
}>();

function showCreateCar() {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        people: Object.values(personMap.value),
        carNames: Object.values(carMap.value).map(({ name }) => name),
      },
    })
    .onOk(addCar);
}

function showEditCar(id: string) {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        car: carMap.value[id],
        people: Object.values(personMap.value),
        carNames: Object.values(carMap.value).map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      editCar(id, payload);
    });
}

function showDeleteCar(car: Car) {
  quasar
    .dialog({
      title: `Delete car`,
      message: `Are you sure you want to delete the car ${car.name} from this flight? It will remain in the project for other flights.`,
      ok: {
        label: 'Delete',
        color: 'negative',
        rounded: true,
      },
      cancel: {
        label: 'Cancel',
        outline: true,
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => {
      removeCar(car.id);
    });
}
</script>

<style scoped></style>
