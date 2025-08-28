<template>
  <template v-if="project != null">
    <q-btn-dropdown
      :label
      rounded
      flat
    >
      <q-item
        v-for="{ legId, label } in items"
        :key="legId"
        clickable
        v-close-popup
        @click="changeFlight(legId)"
      >
        <q-item-section>
          <q-item-label>
            {{ label }}
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
              <q-list>
                <q-item
                  clickable
                  v-close-popup
                  @click="deleteFlight(legId)"
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
      rounded
      flat
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
import type { FlightSeries, ID } from 'app/src-common/entities';
import { useQuasar } from 'quasar';
import CreateFlightDialog from 'components/dialog/CreateFlightDialog.vue';

const quasar = useQuasar();
const router = useRouter();
const projectStore = useProjectStore();
const flightStore = useFlightStore();

const { project } = storeToRefs(projectStore);
const { flightSeries } = storeToRefs(flightStore);
const addFlightLoading = ref(false);

const label = computed<string>(() => {
  const flightId = flightSeries.value?.id;
  if (!project.value || !flightId) {
    return 'Flights';
  }

  return flightName(
    project.value.flights.findIndex((value) => value.id === flightId),
  );
});

interface Item {
  legId: ID;
  seriesId: ID;
  label: string;
}

const items = computed<Item[]>(() => {
  return project.value?.flights.flatMap((series, flightIndex) => {
    return series.legs.map((leg, legIndex) => {
      return {
        seriesId: series.id,
        legId: leg.id,
        label: `Flight ${flightIndex + 1}.${legIndex + 1}`,
      };
    });
  });
});

function flightName(index: number): string {
  return `Flight ${index + 1}`;
}

function addFlight() {
  addFlightLoading.value = true;

  if (!project.value) {
    return false;
  }

  // TODO Either add series or leg

  quasar
    .dialog({
      component: CreateFlightDialog,
      componentProps: {
        flights: project.value.flights,
      },
    })
    .onOk((data: Partial<Omit<FlightSeries, 'id'>>) => {
      const flight = flightStore.createFlight(data);

      void changeFlight(flight.id, flight.legs[0].id);
    })
    .onDismiss(() => {
      addFlightLoading.value = false;
    });
}

async function changeFlight(flightId: string) {
  const projectId = project.value.id;

  await router.replace({
    name: 'flight',
    params: {
      projectId,
      flightId,
    },
  });
}

function deleteFlight(flightId: ID) {
  flightStore.deleteFlightLeg(flightId);
}
</script>

<style scoped></style>
