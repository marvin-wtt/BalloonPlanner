<template>
  <q-step
    :name
    title="Manually add balloons"
    icon="mdi-airballoon"
    :done="modelValue.length > 0"
  >
    <q-table
      title="Balloons"
      :rows="modelValue"
      :columns
      :pagination
      row-key="id"
      flat
    >
      <template #top-right>
        <q-btn
          label="Add balloon"
          color="primary"
          rounded
          @click="onCreateBalloon()"
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
                  @click="onEditBalloon(props.row)"
                >
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="onDeleteBalloon(props.row)"
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
import type { Balloon, Person } from 'app/src-common/entities';
import { type QTableColumn, useQuasar } from 'quasar';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import { computed } from 'vue';

const quasar = useQuasar();

const modelValue = defineModel<Balloon[]>();

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
    name: 'maxWeight',
    label: 'Maximum Weight',
    field: 'maxWeight',
    align: 'right',
    sortable: false,
    format: (val?: string) => (val ? `${val} kg` : ''),
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
    name: 'action',
    label: '',
    field: 'action',
    align: 'center',
    required: true,
  },
];

function onDeleteBalloon(balloon: Balloon) {
  const index = modelValue.value.findIndex((value) => value.id === balloon.id);
  if (index >= 0) {
    modelValue.value.splice(index, 1);
  }
}

function onEditBalloon(balloon: Balloon) {
  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        balloon,
        people,
        existingNames: modelValue.value.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      const index = modelValue.value.findIndex(
        (value) => value.id === balloon.id,
      );
      if (index >= 0) {
        modelValue.value.splice(index, 1, {
          ...payload,
          id: balloon.id,
        });
      }
    });
}

function onCreateBalloon() {
  quasar
    .dialog({
      component: EditBalloonDialog,
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
