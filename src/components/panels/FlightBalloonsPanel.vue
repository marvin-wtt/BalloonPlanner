<template>
  <q-tab-panel
    :name
    class="column bg-grey-2 q-pa-none"
  >
    <q-scroll-area class="col-grow self-stretch q-pa-md">
      <editable-list
        title="Balloons"
        item-name="Balloon"
        :items="balloons"
        @add="showAddBalloons()"
        @create="showCreateBalloon()"
        @edit="(balloon) => showEditBalloon(balloon.id)"
        @delete="(balloon) => showDeleteBalloon(balloon)"
      >
        <template #main="{ item }: { item: Balloon }">
          {{ item.name }}
        </template>
        <template #side="{ item }: { item: Balloon }">
          {{ item.maxCapacity - 1 + ' + 1' }}
        </template>
      </editable-list>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import type { Balloon } from 'app/src-common/entities';
import EditableList from 'components/EditableList.vue';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import { useQuasar } from 'quasar';
import { useFlightOperations } from 'src/composables/flightOperations';
import { storeToRefs } from 'pinia';
import { useFlightStore } from 'stores/flight';
import AddEntityToFlightDialog from 'components/dialog/AddEntityToFlightDialog.vue';
import { useProjectStore } from 'stores/project';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { flightSeries, balloonMap } = storeToRefs(flightStore);
const { createBalloon, editBalloon, removeBalloon, addBalloon } =
  useFlightOperations();

const { name } = defineProps<{
  name: string;
  balloons: Balloon[];
}>();

function showAddBalloons() {
  if (!project.value) {
    return;
  }

  quasar
    .dialog({
      component: AddEntityToFlightDialog,
      componentProps: {
        itemName: 'Balloon',
        items: project.value.balloons.filter(
          ({ id }) => !flightSeries.value?.balloonIds.includes(id),
        ),
      },
    })
    .onOk((ids) => ids.forEach(addBalloon));
}

function showCreateBalloon() {
  if (!project.value) {
    return;
  }

  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        people: project.value.people,
        existingNames: project.value.balloons.map(({ name }) => name),
      },
    })
    .onOk(createBalloon);
}

function showEditBalloon(id: string) {
  if (!project.value) {
    return;
  }

  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        balloon: balloonMap.value[id],
        people: project.value.people,
        existingNames: project.value.balloons.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      editBalloon(id, payload);
    });
}

function showDeleteBalloon(balloon: Balloon) {
  quasar
    .dialog({
      title: 'Delete balloon',
      message: `Are you sure you want to delete the balloon ${balloon.name} from this flight? It will remain in the project for other flights.`,
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
      removeBalloon(balloon.id);
    });
}
</script>

<style scoped></style>
