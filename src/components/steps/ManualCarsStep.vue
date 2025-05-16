<template>
  <q-step
    :name="name"
    title="Manually add Car"
    icon="airport_shuttle"
    :done="modelValue.length > 0"
  >
    <q-table
      :rows="modelValue"
      :columns="columns"
      title="Cars"
      row-key="name"
      v-model:pagination="pagination"
    >
      <template v-slot:body-cell-edit="props">
        <td class="text-center">
          <q-btn
            icon="edit"
            color="primary"
            @click="showEditCar(props.row)"
          />
        </td>
      </template>

      <template v-slot:body-cell-delete="props">
        <td class="text-center">
          <q-btn
            icon="delete"
            color="negative"
            @click="showDeleteCar(props.row)"
          />
        </td>
      </template>

      <template v-slot:top-right>
        <q-btn
          label="Add Car"
          color="primary"
          @click="showCreateCar()"
        />
      </template>
    </q-table>

    <q-stepper-navigation>
      <q-btn
        @click="emit('continue')"
        color="primary"
        label="Continue"
        :disable="modelValue.length == 0"
      />
      <q-btn
        flat
        @click="emit('back')"
        color="primary"
        label="Back"
        class="q-ml-sm"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Car, Person } from 'src/lib/entities';
import { useQuasar } from 'quasar';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';

const q = useQuasar();

interface Props {
  name: string;
  modelValue: Car[];
  people: Person[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', cars: Car[]): void;
  (e: 'continue'): void;
  (e: 'back'): void;
  (e: 'to', destination: string): void;
}>();

const pagination = {
  rowsPerPage: 10,
  sortBy: 'name',
};

const columns = [
  {
    name: 'name',
    align: 'left',
    label: 'Name',
    field: 'name',
    sortable: true,
  },
  {
    name: 'capacity',
    align: 'center',
    label: 'Capacity',
    field: 'capacity',
    sortable: true,
  },
  {
    name: 'allowedOperators',
    align: 'left',
    label: 'Allowed Operators',
    field: 'allowedOperators',
    format: (val: Person[]) => val.map((value) => value.name).join(', '),
  },
  {
    name: 'trailerHitch',
    align: 'center',
    label: 'Trailer Hitch',
    field: 'trailerHitch',
    format: (val: boolean) => (val ? '\u2713' : 'X'),
  },
  {
    name: 'edit',
    align: 'center',
    label: 'Edit',
    required: true,
  },
  {
    name: 'delete',
    align: 'delete',
    label: 'Delete',
    required: true,
  },
];

function showDeleteCar(car: Car) {
  emit(
    'update:modelValue',
    props.modelValue.filter((value) => value.id !== car.id),
  );
}

function showEditCar(car: Car) {
  q.dialog({
    component: EditCarDialog,
    componentProps: {
      vehicle: car,
      people: props.people,
    },
  }).onOk((payload) => {
    const c = new Car(
      payload.name,
      payload.capacity,
      payload.allowedOperators,
      payload.trailerHitch,
    );
    c.id = car.id;

    const cars = props.modelValue.filter((value) => value.id !== car.id);
    emit('update:modelValue', [...cars, c]);
  });
}

function showCreateCar() {
  q.dialog({
    component: EditCarDialog,
    componentProps: {
      people: props.people,
    },
  }).onOk((payload) => {
    const car = new Car(
      payload.name,
      payload.capacity,
      payload.allowedOperators,
      payload.trailerHitch,
    );
    emit('update:modelValue', [...props.modelValue, car]);
  });
}
</script>

<style scoped></style>
