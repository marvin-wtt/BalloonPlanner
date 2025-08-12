<template>
  <q-step
    :name
    title="Manually add people"
    icon="person"
    :done="modelValue.length > 0"
  >
    <q-table
      title="People"
      :rows="modelValue"
      :columns
      :pagination
      row-key="id"
      flat
    >
      <template v-slot:top-right>
        <q-btn
          label="Add person"
          color="primary"
          rounded
          @click="onCreatePerson()"
        />
      </template>

      <template v-slot:body-cell-action="props">
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
                  clickable
                  v-close-popup
                  @click="onEditPerson(props.row)"
                >
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="onDeletePerson(props.row)"
                >
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </td>
      </template>
    </q-table>

    <q-stepper-navigation>
      <q-btn
        label="Continue"
        color="primary"
        rounded
        @click="emit('continue')"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { type QTableColumn, useQuasar } from 'quasar';

const quasar = useQuasar();

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'continue'): void;
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

const columns: QTableColumn[] = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'nation',
    label: 'Nationality',
    field: 'nationality',
    align: 'left',
    sortable: true,
    format: (val: string) => nationMap[val] ?? val,
  },
  {
    name: 'languages',
    label: 'Languages',
    field: 'languages',
    align: 'left',
    sortable: false,
    format: (val: string[]) => val.join(', '),
  },
  {
    name: 'role',
    label: 'Role',
    field: 'role',
    align: 'left',
    sortable: true,
    format: (val: string) => val.charAt(0).toUpperCase() + String(val).slice(1),
  },
  {
    name: 'weight',
    label: 'Weight',
    field: 'weight',
    align: 'right',
    sortable: false,
    format: (val?: string) => (val ? `${val} kg` : ''),
  },
  {
    name: 'firstTime',
    label: 'First Time',
    field: 'firstTime',
    align: 'center',
    format: (val: boolean) =>
      val === true ? '\u2713' : val === false ? 'X' : '',
  },
  {
    name: 'action',
    label: '',
    field: 'action',
    align: 'center',
    required: true,
  },
];

function onDeletePerson(person: Person) {
  const index = modelValue.value.findIndex((value) => value.id === person.id);
  if (index >= 0) {
    modelValue.value.splice(index, 1);
  }
}

function onEditPerson(person: Person) {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        personNames: modelValue.value.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      const index = modelValue.value.findIndex(
        (value) => value.id === person.id,
      );
      if (index >= 0) {
        modelValue.value.splice(index, 1, {
          ...payload,
          id: person.id,
        });
      }
    });
}

function onCreatePerson() {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
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
