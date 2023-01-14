<template>
  <q-step
    :name="name"
    title="Manually add balloons"
    icon="mdi-airballoon"
    :done="modelValue.length > 0"
  >
    <q-table
      :rows="modelValue"
      :columns="columns"
      title="Balloons"
      row-key="name"
      v-model:pagination="pagination"
    >
      <template v-slot:body-cell-edit="props">
        <td class="text-center">
          <q-btn
            icon="edit"
            color="primary"
            @click="showEditBalloon(props.row)"
          />
        </td>
      </template>

      <template v-slot:body-cell-delete="props">
        <td class="text-center">
          <q-btn
            icon="delete"
            color="negative"
            @click="showDeleteBalloon(props.row)"
          />
        </td>
      </template>

      <template v-slot:top-right>
        <q-btn
          label="Add balloon"
          color="primary"
          @click="showCreateBalloon()"
        />
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
import { Balloon, Person } from 'src/lib/entities';
import { useQuasar } from 'quasar';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue.vue';

const q = useQuasar();

interface Props {
  name: string;
  modelValue: Balloon[];
  people: Person[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', balloons: Balloon[]): void;
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

function showDeleteBalloon(balloon: Balloon) {
  emit(
    'update:modelValue',
    props.modelValue.filter((value) => value.id !== balloon.id)
  );
}

function showEditBalloon(balloon: Balloon) {
  q.dialog({
    component: EditBalloonDialog,
    componentProps: {
      vehicle: balloon,
      people: props.people,
    },
  }).onOk((payload) => {
    const b = new Balloon(
      payload.name,
      payload.capacity,
      payload.allowedOperators
    );
    b.id = balloon.id;

    const balloons = props.modelValue.filter(
      (value) => value.id !== balloon.id
    );
    emit('update:modelValue', [...balloons, b]);
  });
}

function showCreateBalloon() {
  q.dialog({
    component: EditBalloonDialog,
    componentProps: {
      people: props.people,
    },
  }).onOk((payload) => {
    const balloon = new Balloon(
      payload.name,
      payload.capacity,
      payload.allowedOperators
    );
    emit('update:modelValue', [...props.modelValue, balloon]);
  });
}
</script>

<style scoped></style>
