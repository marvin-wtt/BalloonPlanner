<template>
  <q-page class="full-width row justify-start no-wrap">
    <template v-if="isLoading">
      <q-spinner
        color="primary"
        size="3em"
      />
    </template>

    <template v-else-if="flightSeries">
      <!-- Menu -->
      <div
        v-if="editable"
        v-show="!panelItemDragging"
        class="self-stretch row no-wrap"
        :class="menuClasses"
      >
        <q-tabs
          v-model="menuTabs"
          vertical
          active-bg-color="grey-6"
          class="bg-grey-10 text-white column justify-between"
        >
          <q-tab
            label="Overview"
            name="overview"
            icon="home"
          />
          <q-separator
            spaced
            inset
            color="white"
          />
          <q-tab
            label="Balloons"
            name="balloons"
            icon="mdi-airballoon"
          >
            <q-badge
              v-if="showBalloonsMenuBadge"
              color="red"
              floating
            >
              {{ availableBalloons.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Cars"
            name="cars"
            icon="airport_shuttle"
          >
            <q-badge
              v-if="showCarsMenuBadge"
              color="red"
              floating
            >
              {{ availableCars.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Counselors"
            name="supervisors"
            icon="supervisor_account"
          >
            <q-badge
              v-if="showCounselorsMenuBadge"
              color="red"
              floating
            >
              {{ availableCounselors.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Participants"
            name="participants"
            icon="group"
          >
            <q-badge
              v-if="showParticipantsMenuBadge"
              color="red"
              floating
            >
              {{ availableParticipants.length }}
            </q-badge>
          </q-tab>
          <q-separator
            spaced
            inset
            color="white"
          />
          <q-tab
            label="Settings"
            name="settings"
            icon="settings"
          />
        </q-tabs>

        <div
          v-if="menuTabs !== 'overview'"
          class="col-grow self-stretch column"
        >
          <q-tab-panels
            v-model="menuTabs"
            animated
            transition-next="jump-up"
            transition-prev="jump-down"
            vertical
            class="no-wrap col-grow shadow-24"
          >
            <flight-balloons-panel
              name="balloons"
              :balloons="availableBalloons"
            />

            <flight-cars-panel
              name="cars"
              :cars="availableCars"
            />

            <flight-people-panel
              name="supervisors"
              role="counselor"
              :people="availableParticipants"
            />

            <flight-people-panel
              name="participants"
              role="participant"
              :people="availableParticipants"
            />

            <flight-settings-panel name="settings" />
          </q-tab-panels>
        </div>
      </div>

      <!-- Flight overview -->
      <div
        v-if="project && flightSeries && flightLeg"
        class="col-grow flex flight-view"
      >
        <base-flight
          :project
          :flight-series
          :flight-leg
          :editable
          class="fit"
        />

        <q-page-sticky
          v-if="showFab"
          position="bottom-right"
          :offset="[18, 18]"
        >
          <q-fab
            icon="keyboard_arrow_up"
            color="secondary"
            vertical-actions-align="right"
            direction="up"
          >
            <q-fab-action
              label="Clear Passengers"
              icon="delete"
              color="warning"
              :disable="!editable"
              @click="clearLegPassengers"
            />

            <q-fab-action
              label="Export Image"
              icon="photo_camera"
              color="secondary"
              @click="onExportImage"
            />

            <q-fab-action
              label="Smart Fill"
              icon="auto_awesome"
              color="accent"
              :disable="!editable"
              @click="onSmartFill"
            />
          </q-fab>
        </q-page-sticky>
      </div>
    </template>

    <template v-else>
      <div class="row full-width justify-center content-center text-center">
        Select a flight first.
      </div>
    </template>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import BaseFlight from 'components/BaseFlight.vue';
import type { Balloon, Car, Person } from 'app/src-common/entities';
import { useFlightStore } from 'stores/flight';
import { useFlightOperations } from 'src/composables/flightOperations';
import FlightSettingsPanel from 'components/panels/FlightSettingsPanel.vue';
import FlightBalloonsPanel from 'components/panels/FlightBalloonsPanel.vue';
import FlightCarsPanel from 'components/panels/FlightCarsPanel.vue';
import SmartFillDialog from 'components/dialog/SmartFillDialog.vue';
import { toPng } from 'html-to-image';
import { useProjectSettings } from 'src/composables/projectSettings';
import { useSolver } from 'src/composables/solver';
import type { SolveFlightLegOptions } from 'app/src-common/api/solver.api';
import { enableDragDropTouch } from 'src/util/drag-drop-touch/drag-drop-touch';
import FlightPeoplePanel from 'components/panels/FlightPeoplePanel.vue';

const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const { solve } = useSolver();

const { project, isLoading } = storeToRefs(projectStore);
const { flightSeries, flightLeg } = storeToRefs(flightStore);

const { personDefaultWeight } = useProjectSettings();
const { clearLegPassengers } = useFlightOperations();

enableDragDropTouch();

const menuTabs = ref('overview');
const editable = ref<boolean>(true);
const panelItemDragging = ref<boolean>(false);

provide('flight-panel-list-dragging', (dragging: boolean) => {
  if (!dragging) {
    panelItemDragging.value = false;
    return;
  }

  // Small delay is required to avoid interrupting the drag
  setTimeout(() => {
    panelItemDragging.value = true;
  }, 10);
});

onMounted(onRouteUpdate);
watch(() => route.params, onRouteUpdate);

async function onRouteUpdate() {
  let { projectId, flightId } = route.params;

  if (Array.isArray(projectId)) {
    projectId = projectId[0];
  }

  if (projectId === undefined) {
    return;
  }

  if (!project.value || project.value.id !== projectId) {
    try {
      await projectStore.loadProject(projectId);
    } catch {
      await router.push({
        name: 'projects',
      });
      return;
    }
  }

  if (Array.isArray(flightId)) {
    flightId = flightId[0];
  }

  if (flightId) {
    flightStore.loadFlightLeg(flightId);
    return;
  }

  // If not flight leg specified, load the last flight
  if (!project.value) {
    return;
  }

  if (project.value.flights.length === 0) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const series = project.value.flights[project.value.flights.length - 1]!;
  if (series.legs.length === 0) {
    return;
  }

  const lastLeg = series.legs[series.legs.length - 1];
  if (!lastLeg?.id) {
    return;
  }

  await router.replace({
    name: 'flight',
    params: {
      projectId,
      flightId: lastLeg.id,
    },
  });
}

function onSmartFill() {
  if (!flightSeries.value || !flightLeg.value) {
    return;
  }

  quasar
    .dialog({
      component: SmartFillDialog,
      componentProps: {
        isFirstLeg: flightSeries.value.legs[0]?.id === flightLeg.value.id,
      },
    })
    .onOk((options: SolveFlightLegOptions) => {
      void smartFill(options);
    });
}

async function smartFill(options: SolveFlightLegOptions) {
  const notify = quasar.notify({
    type: 'ongoing',
    message: 'Optimizing flight...',
  });
  editable.value = false;

  let timeSpendSec = 0;
  const intervalId = setInterval(() => {
    timeSpendSec += 1;
    notify({
      caption: `${timeSpendSec.toString()} s`,
    });
  }, 1000);

  try {
    await solve({
      ...options,
      defaultPersonWeight: personDefaultWeight.value,
    });

    notify({
      type: 'positive',
      color: 'secondary',
      message: 'Successfully filled flight!',
      timeout: 1000,
    });
  } catch (error) {
    console.warn(error);
    notify({
      type: 'warning',
      message: 'Failed to fill the flight',
      caption: error.message,
      timeout: 2000,
    });
  } finally {
    editable.value = true;
    clearInterval(intervalId);
  }
}

async function onExportImage() {
  if (!project.value || !flightSeries.value) {
    return;
  }

  const container = document.createElement('div');
  container.classList.add('exporter-wrapper', 'flight-view');
  const src = document.getElementById('flight-content');
  const clone = src?.cloneNode(true) as HTMLElement;
  clone.classList.add('no-wrap', 'fit');
  Object.assign(container.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1,
    width: 'auto',
    height: 'auto',
  });
  container.appendChild(clone);
  document.body.appendChild(container);

  await nextTick();

  const dataUrl = await toPng(container, {});

  document.body.removeChild(container);

  const flightNr =
    project.value.flights.findIndex((s) => s.id === flightSeries.value?.id) + 1;
  const legNr =
    flightSeries.value.legs.findIndex((l) => l.id === flightLeg.value?.id) + 1;
  const fileName = `${project.value.name}-flight-${flightNr.toString()}-leg-${legNr.toString()}.png`;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

const showBalloonsMenuBadge = computed<boolean>(() => {
  return availableBalloons.value.length > 0;
});
const showCarsMenuBadge = computed<boolean>(() => {
  return availableCars.value.length > 0;
});
const showParticipantsMenuBadge = computed<boolean>(() => {
  return availableParticipants.value.length > 0;
});
const showCounselorsMenuBadge = computed<boolean>(() => {
  return availableCounselors.value.length > 0;
});

const availablePeople = computed<Person[]>(() => flightStore.availablePeople);

const availableBalloons = computed<Balloon[]>(() => {
  return flightStore.availableBalloons.toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
});

const availableCars = computed<Car[]>(() => {
  return flightStore.availableCars.toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
});

const availableParticipants = computed<Person[]>(() => {
  return availablePeople.value
    .filter(({ role }) => role === 'participant')
    .toSorted((a, b) => a.name.localeCompare(b.name));
});

const availableCounselors = computed<Person[]>(() => {
  return availablePeople.value
    .filter(({ role }) => role === 'counselor')
    .toSorted((a, b) => a.name.localeCompare(b.name));
});

const showFab = computed<boolean>(() => {
  return !quasar.screen.xs || menuTabs.value === 'overview';
});

const menuClasses = computed<string>(() => {
  return menuTabs.value !== 'overview'
    ? 'col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-12'
    : '';
});
</script>

<style lang="scss">
.q-tab__content {
  width: 90px !important;
}

.q-tab .q-badge {
  right: 0 !important;
}

.flight-view {
  background-color: $grey-3;
}
</style>
