<template>
  <q-tab-panel
    :name
    class="column bg-grey-2 q-pa-none"
  >
    <q-scroll-area class="col-grow self-stretch q-pa-md">
      <editable-list
        :title
        :item-name
        :items="people"
        :dense="people.length > 10"
        @add="showAddPeople()"
        @create="showCreatePerson()"
        @edit="(person: Person) => showEditPerson(person)"
        @delete="(person: Person) => showDeletePerson(person)"
      >
        <template #main="{ item }">
          {{ item.name }}
        </template>
        <template #side="{ item }">
          {{ formatPersonMeta(item) }}
        </template>
      </editable-list>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import EditableList from 'components/EditableList.vue';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import AddEntityToFlightDialog from 'components/dialog/AddEntityToFlightDialog.vue';
import { useFlightOperations } from 'src/composables/flightOperations';
import { useFlightStore } from 'stores/flight';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useProjectSettings } from 'src/composables/projectSettings';
import { computed } from 'vue';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { flightSeries, numberOfFlights, availablePeople } =
  storeToRefs(flightStore);

const { createPerson, editPerson, removePerson, addPerson } =
  useFlightOperations();
const { showNumberOfFlights, showPersonWeight, personDefaultWeight } =
  useProjectSettings();

const { name, people, role } = defineProps<{
  name: string;
  people: Person[];
  role: Person['role'];
}>();

const title = computed<string>(() => {
  return role === 'counselor' ? 'Counselors' : 'Participants';
});

const itemName = computed<string>(() => {
  return role === 'counselor' ? 'Counselor' : 'Participant';
});

function formatPersonMeta(person: Person): string {
  const parts: string[] = [];

  if (showPersonWeight.value) {
    const weight = person.weight ?? personDefaultWeight.value ?? '?';
    const suffix = !person.weight && personDefaultWeight.value ? '*' : '';

    parts.push(`${weight.toString()}${suffix} kg`);
  }

  if (showNumberOfFlights.value) {
    const flights = numberOfFlights.value[person.id] ?? 0;
    const suffix = flights === 0 && person.firstTime ? '*' : '';

    parts.push(`${flights.toString()}${suffix}`);
  }

  return parts.join(' | ');
}

function showAddPeople() {
  if (!project.value) {
    return;
  }

  quasar
    .dialog({
      component: AddEntityToFlightDialog,
      componentProps: {
        itemName: role.charAt(0).toUpperCase() + role.slice(1),
        items: project.value.people
          .filter(({ role: personRole }) => personRole === role)
          .filter(({ id }) => !flightSeries.value?.personIds.includes(id)),
      },
    })
    .onOk((ids) => ids.forEach(addPerson));
}

function showCreatePerson() {
  if (!project.value) {
    return;
  }

  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        role,
        existingNames: project.value.people.map(({ name }) => name),
      },
    })
    .onOk(createPerson);
}

function showEditPerson(person: Person): void {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        existingNames: project.value?.people.map(({ name }) => name) ?? [],
      },
    })
    .onOk((payload) => {
      editPerson(person.id, payload);
    });
}

function showDeletePerson(person: Person): void {
  quasar
    .dialog({
      title: 'Delete person',
      message: `Are you sure you want to delete ${person.name} from this flight? The person will remain in the project for other flights.`,
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
      removePerson(person.id);
    });
}
</script>

<style scoped></style>
