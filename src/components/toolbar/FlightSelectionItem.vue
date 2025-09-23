<template>
  <template v-if="project != null">
    <q-btn-dropdown
      :label="seriesLabel"
      rounded
      flat
    >
      <q-item
        v-for="(series, index) in project.flights"
        :key="series.id"
        v-close-popup
        :active="series.id === flightSeries?.id"
        clickable
        @click="changeSeries(series.id)"
      >
        <q-item-section>
          <q-item-label>
            {{ seriesName(index) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            dense
            round
            flat
            size="sm"
            icon="more_vert"
            @click.prevent.stop
          >
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item
                  v-close-popup
                  clickable
                  :disable="project.flights[0]?.id === series.id"
                  @click="mergeSeries(series.id)"
                >
                  <q-item-section class="text-warning"> Merge </q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  :disable="project.flights.length === 1"
                  @click="deleteSeries(series.id)"
                >
                  <q-item-section class="text-negative">
                    Delete
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-btn-dropdown>
    <q-separator
      dark
      vertical
      inset
    />
    <q-btn-dropdown
      :label="legLabel"
      rounded
      flat
    >
      <q-item
        v-for="(leg, index) in flightSeries?.legs ?? []"
        :key="leg.id"
        v-close-popup
        :active="leg.id === flightLeg?.id"
        clickable
        @click="changeLeg(leg.id)"
      >
        <q-item-section>
          <q-item-label>
            {{ legName(index) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            dense
            round
            flat
            size="sm"
            icon="more_vert"
            @click.prevent.stop
          >
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item
                  v-close-popup
                  :disable="flightSeries?.legs[0]?.id === leg.id"
                  clickable
                  @click="detachLeg(leg.id)"
                >
                  <q-item-section class="text-warning">Detach</q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  :disable="flightSeries?.legs.length === 1"
                  clickable
                  @click="deleteLeg(leg.id)"
                >
                  <q-item-section class="text-negative">
                    Delete
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-btn-dropdown>
    <q-separator
      dark
      vertical
      inset
    />
    <q-btn
      icon="add"
      flat
      round
      dense
      :loading="addFlightLoading"
      @click="addFlight"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import { useRouter } from 'vue-router';
import { useFlightStore } from 'stores/flight';
import type { ID } from 'app/src-common/entities';
import { useQuasar } from 'quasar';
import CreateFlightDialog, {
  type CreateFlightDialogData,
} from 'components/dialog/CreateFlightDialog.vue';

const quasar = useQuasar();
const router = useRouter();
const projectStore = useProjectStore();
const flightStore = useFlightStore();

const { project } = storeToRefs(projectStore);
const { flightSeries, flightLeg } = storeToRefs(flightStore);
const addFlightLoading = ref(false);

const seriesLabel = computed<string>(() => {
  const seriesId = flightSeries.value?.id;
  if (!project.value || !seriesId) {
    return 'Flights';
  }

  return seriesName(
    project.value.flights.findIndex((value) => value.id === seriesId),
  );
});

const legLabel = computed<string>(() => {
  const legId = flightLeg.value?.id;
  if (!flightSeries.value || !legId) {
    return 'Legs';
  }

  return legName(
    flightSeries.value.legs.findIndex((value) => value.id === legId),
  );
});

function seriesName(index: number): string {
  return `Flight ${(index + 1).toString()}`;
}

function legName(index: number): string {
  return `Leg ${(index + 1).toString()}`;
}

function addFlight() {
  if (!project.value) {
    return false;
  }

  addFlightLoading.value = true;

  quasar
    .dialog({
      component: CreateFlightDialog,
      componentProps: {
        flights: project.value.flights,
      },
    })
    .onOk((data: CreateFlightDialogData) => {
      if (data.mode === 'series') {
        const flight = flightStore.createFlightSeries(
          {
            vehicleGroups: data.vehicleGroups,
          },
          data.assignments,
        );

        const legId = flight.legs[0]?.id;
        if (!legId) {
          throw new Error('Flight series has no legs');
        }

        void changeLeg(legId);
      }

      if (data.mode === 'leg' && flightSeries.value != null) {
        const leg = flightStore.createFlightLeg(flightSeries.value.id, data);

        void changeLeg(leg.id);
      }
    })
    .onDismiss(() => {
      addFlightLoading.value = false;
    });
}

async function changeSeries(seriesId: string) {
  const series = project.value?.flights.find((value) => value.id === seriesId);
  if (!series || series.legs.length === 0) {
    await changeLeg(undefined);
    return;
  }

  await changeLeg(series.legs[series.legs.length - 1]?.id);
}

async function changeLeg(legId: string | undefined) {
  const projectId = project.value?.id;

  await router.replace({
    name: 'flight',
    params: {
      projectId,
      flightId: legId,
    },
  });
}

function detachLeg(legId: ID) {
  flightStore.detachLeg(legId);
}

function mergeSeries(seriesId: ID) {
  const index = project.value?.flights.findIndex(
    (value) => value.id === seriesId,
  );
  if (index === undefined || index <= 0) {
    throw new Error('Invalid flight series index');
  }

  const prev = project.value?.flights[index - 1];
  if (!prev) {
    throw new Error('No previous flight series');
  }

  flightStore.mergeSeries(prev.id, seriesId);
}

function deleteSeries(flightId: ID) {
  flightStore.deleteFlightSeries(flightId);
}

function deleteLeg(flightId: ID) {
  flightStore.deleteFlightLeg(flightId);
}
</script>

<style scoped></style>
