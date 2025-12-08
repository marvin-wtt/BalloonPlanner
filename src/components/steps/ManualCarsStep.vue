<template>
  <q-step
    :name
    title="Manually add Car"
    icon="airport_shuttle"
    :done="modelValue.length > 0"
  >
    <q-table
      title="Cars"
      :rows="modelValue"
      :columns
      :pagination
      row-key="id"
      flat
    >
      <template #top-right>
        <q-btn
          label="Add Car"
          color="primary"
          rounded
          @click="onCreateCar()"
        />
      </template>

      <template #body-cell-action="props">
        <td>
          <q-btn
            icon="more_vert"
            color="primary"
            size="xs"
            round
            outline
          >
            <q-menu style="min-width: 100px">
              <q-list>
                <q-item
                  v-close-popup
                  clickable
                  @click="onEditCar(props.row)"
                >
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="onDeleteCar(props.row)"
                >
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </td>
      </template>
    </q-table>

    <q-stepper-navigation class="row q-gutter-sm">
      <q-btn
        label="Continue"
        color="primary"
        rounded
        @click="emit('continue')"
      />
      <q-btn
        color="primary"
        label="Back"
        rounded
        outline
        @click="emit('back')"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Car, Person } from 'app/src-common/entities';
import { type QTableColumn, useQuasar } from 'quasar';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';
import { computed } from 'vue';

const quasar = useQuasar();

const modelValue = defineModel<Car[]>();

const { name, people } = defineProps<{
  name: string;
  people: Person[];
}>();

const emit = defineEmits<{
  (e: 'continue' | 'back'): void;
  (e: 'to', destination: string): void;
}>();

const pagination = {
  rowsPerPage: 10,
  sortBy: 'name',
};

const personMap = computed<Record<string, Person>>(() => {
  return people.reduce(
    (persons, person) => ({
      ...persons,
      [person.id]: person,
    }),
    {},
  );
});

const columns: QTableColumn[] = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'capacity',
    label: 'Capacity',
    field: 'maxCapacity',
    align: 'center',
    sortable: true,
  },
  {
    name: 'allowedOperators',
    label: 'Allowed Operators',
    field: 'allowedOperatorIds',
    align: 'left',
    format: (val: string[]) =>
      val.map((id) => personMap.value[id].name).join(', '),
  },
  {
    name: 'trailerHitch',
    label: 'Trailer Hitch',
    field: 'hasTrailerHitch',
    align: 'center',
    format: (val: boolean) => (val ? '\u2713' : 'X'),
  },
  {
    name: 'action',
    label: '',
    field: 'action',
    align: 'center',
    required: true,
  },
];

function onDeleteCar(car: Car) {
  const index = modelValue.value.findIndex((value) => value.id === car.id);
  if (index >= 0) {
    modelValue.value.splice(index, 1);
  }
}

function onEditCar(car: Car) {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        car,
        people,
        existingNames: modelValue.value.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      const index = modelValue.value.findIndex((value) => value.id === car.id);
      if (index >= 0) {
        modelValue.value.splice(index, 1, {
          ...payload,
          id: car.id,
        });
      }
    });
}

function onCreateCar() {
  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        people,
        existingNames: modelValue.value.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      modelValue.value.push({
        ...payload,
        id: crypto.randomUUID(),
      });
    });
}
</script>

<style scoped></style>
