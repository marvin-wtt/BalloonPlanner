<template>
  <q-step
    :name="name"
    title="Manually add people"
    icon="person"
    :done="modelValue.length > 0"
  >
    <q-table
      :rows="modelValue"
      :columns="columns"
      title="People"
      row-key="name"
      v-model:pagination="pagination"
    >
      <template v-slot:body-cell-edit="props">
        <td class="text-center">
          <q-btn
            icon="edit"
            color="primary"
            @click="showEditPerson(props.row)"
          />
        </td>
      </template>

      <template v-slot:body-cell-delete="props">
        <td class="text-center">
          <q-btn
            icon="delete"
            color="negative"
            @click="showDeletePerson(props.row)"
          />
        </td>
      </template>

      <template v-slot:top-right>
        <q-btn label="Add person" color="primary" @click="showCreatePerson()" />
      </template>
    </q-table>

    <q-stepper-navigation>
      <q-btn
        @click="emit('continue')"
        color="primary"
        label="Continue"
        :disable="modelValue.length === 0"
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
import { Person } from 'src/lib/entities';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useQuasar } from 'quasar';

const q = useQuasar();

interface Props {
  name: string;
  modelValue: Person[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', people: Person[]): void;
  (e: 'continue'): void;
  (e: 'back'): void;
  (e: 'to', destination: string): void;
}>();

const pagination = {
  rowsPerPage: 10,
  sortBy: 'name',
};

const nationMap = {
  de: 'German',
  fr: 'French',
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
    name: 'nation',
    align: 'center',
    label: 'Nation',
    field: 'nation',
    sortable: true,
    format: (val: string) => nationMap[val] ?? val,
  },
  {
    name: 'flights',
    align: 'center',
    label: 'Flights',
    field: 'numberOfFlights',
  },
  {
    name: 'firstTime',
    align: 'center',
    label: 'First Time',
    field: 'firstTime',
    format: (val: boolean) => (val ? '\u2713' : 'X'),
  },
  {
    name: 'supervisor',
    align: 'center',
    label: 'Supervisor',
    field: 'supervisor',
    sortable: true,
    format: (val: boolean) => (val ? '\u2713' : ''),
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

function showDeletePerson(person: Person) {
  emit(
    'update:modelValue',
    props.modelValue.filter((value) => value.id !== person.id)
  );
}

function showEditPerson(person: Person) {
  q.dialog({
    component: EditPersonDialog,
    componentProps: {
      person: person,
      mode: 'edit',
    },
  }).onOk((payload) => {
    const p = new Person(
      payload.name,
      payload.nation,
      payload.supervisor,
      payload.flights,
      payload.firstTime
    );
    p.id = person.id;

    const people = props.modelValue.filter((value) => value.id !== person.id);
    emit('update:modelValue', [...people, p]);
  });
}

function showCreatePerson() {
  q.dialog({
    component: EditPersonDialog,
    componentProps: {
      mode: 'create',
    },
  }).onOk((payload) => {
    const person = new Person(
      payload.name,
      payload.nation,
      payload.supervisor,
      payload.flights
    );
    emit('update:modelValue', [...props.modelValue, person]);
  });
}
</script>

<style scoped></style>
