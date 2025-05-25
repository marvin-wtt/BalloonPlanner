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
        @add="showAddCars()"
        @create="showCreateCar()"
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
import AddEntityToFlightDialog from 'components/dialog/AddEntityToFlightDialog.vue';
import { useProjectStore } from 'stores/project';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { carMap, flight } = storeToRefs(flightStore);
const { createCar, editCar, removeCar, addCar } = useFlightOperations();

const { name } = defineProps<{
  name: string;
  cars: Car[];
}>();

function showAddCars() {
  quasar
    .dialog({
      component: AddEntityToFlightDialog,
      componentProps: {
        itemName: 'Balloon',
        items: project.value.cars.filter(
          ({ id }) => !flight.value?.carIds.includes(id),
        ),
      },
    })
    .onOk((ids) => ids.forEach(addCar));
}

function showCreateCar() {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        people: project.value.people,
        existingNames: project.value.cars.map(({ name }) => name),
      },
    })
    .onOk(createCar);
}

function showEditCar(id: string) {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        car: carMap.value[id],
        people: project.value.people,
        existingNames: project.value.people.map(({ name }) => name),
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
