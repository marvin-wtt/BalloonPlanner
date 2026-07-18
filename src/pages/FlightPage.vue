<template>
  <q-page class="full-width row justify-start no-wrap">
    <template v-if="isLoading">
      <div class="flight-status column items-center justify-center full-width">
        <q-spinner
          color="primary"
          size="2.5em"
        />
        <div class="flight-status__text q-mt-md">Loading flight…</div>
      </div>
    </template>

    <template v-else-if="flightSeries">
      <!-- Menu -->
      <div
        v-if="editable"
        v-show="!panelItemDragging || quasar.screen.gt.xs"
        class="self-stretch row no-wrap"
        :class="menuClasses"
      >
        <q-tabs
          :model-value="menuTab"
          vertical
          active-bg-color="transparent"
          indicator-color="transparent"
          class="flight-rail text-white column justify-between"
        >
          <q-tab
            label="Overview"
            name="overview"
            icon="home"
            @click.prevent="onTabClick('overview')"
          />
          <q-separator
            spaced
            inset
            color="white"
          />
          <q-tab
            label="Balloons"
            name="balloons"
            icon="flight"
            @click.prevent="onTabClick('balloons')"
          >
            <q-badge
              v-if="showBalloonsMenuBadge"
              color="primary"
              floating
            >
              {{ availableBalloons.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Cars"
            name="cars"
            icon="airport_shuttle"
            @click.prevent="onTabClick('cars')"
          >
            <q-badge
              v-if="showCarsMenuBadge"
              color="primary"
              floating
            >
              {{ availableCars.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Counselors"
            name="counselors"
            icon="supervisor_account"
            @click.prevent="onTabClick('counselors')"
          >
            <q-badge
              v-if="showCounselorsMenuBadge"
              color="primary"
              floating
            >
              {{ availableCounselors.length }}
            </q-badge>
          </q-tab>
          <q-tab
            label="Participants"
            name="participants"
            icon="group"
            @click.prevent="onTabClick('participants')"
          >
            <q-badge
              v-if="showParticipantsMenuBadge"
              color="primary"
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
            @click.prevent="onTabClick('settings')"
          />
        </q-tabs>

        <div
          v-if="menuTab !== 'overview'"
          class="col-grow self-stretch column"
        >
          <q-tab-panels
            v-model="menuTab"
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
              name="counselors"
              role="counselor"
              :people="availableCounselors"
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

            <q-fab-action
              v-if="canUndo"
              label="Undo Smart Fill"
              icon="undo"
              color="warning"
              @click="undoSolve"
            />
          </q-fab>
        </q-page-sticky>
      </div>
    </template>

    <template v-else>
      <div class="flight-status column items-center justify-center full-width">
        <q-icon
          name="flight_takeoff"
          size="48px"
          class="flight-status__icon"
        />
        <div class="flight-status__title q-mt-md">No flight selected</div>
        <div class="flight-status__text">
          Pick a flight and leg from the toolbar to start planning.
        </div>
      </div>
    </template>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/stores/project';
import BaseFlight from '@/components/BaseFlight.vue';
import type { Balloon, Car, Person } from '@/../src-common/entities';
import { useFlightStore } from '@/stores/flight';
import { useFlightOperations } from '@/composables/flightOperations';
import FlightSettingsPanel from '@/components/panels/FlightSettingsPanel.vue';
import FlightBalloonsPanel from '@/components/panels/FlightBalloonsPanel.vue';
import FlightCarsPanel from '@/components/panels/FlightCarsPanel.vue';
import SmartFillDialog from '@/components/dialog/SmartFillDialog.vue';
import { toPng } from 'html-to-image';
import { useProjectSettings } from '@/composables/projectSettings';
import { useSolver } from '@/composables/solver';
import type { SolveFlightLegOptions } from '@/../src-common/api/solver.api';
import { enableDragDropTouch } from '@/util/drag-drop-touch/drag-drop-touch';
import FlightPeoplePanel from '@/components/panels/FlightPeoplePanel.vue';
import { getErrorMessage } from '@/composables/error';

const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const { solve, canUndo, undoSolve } = useSolver();

const { project, isLoading } = storeToRefs(projectStore);
const { flightSeries, flightLeg } = storeToRefs(flightStore);

const { personDefaultWeight } = useProjectSettings();
const { clearLegPassengers } = useFlightOperations();

enableDragDropTouch();

const menuTab = ref('overview');
const editable = ref<boolean>(true);
const panelItemDragging = ref<boolean>(false);

provide('flight-panel-list-dragging', (dragging: boolean) => {
  // Small delay is required to avoid interrupting the drag
  setTimeout(() => {
    panelItemDragging.value = dragging;
  }, 10);
});

onMounted(onRouteUpdate);
watch(() => route.params, onRouteUpdate);

function onTabClick(name: string) {
  menuTab.value = name === menuTab.value ? 'overview' : name;
}

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
      timeout: 8000,
      actions: [
        {
          label: 'Undo',
          color: 'white',
          handler: undoSolve,
        },
      ],
    });
  } catch (error) {
    console.warn(error);
    notify({
      type: 'warning',
      message: 'Failed to fill the flight',
      caption: getErrorMessage(error),
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
  container.classList.add('flight-view');
  const src = document.getElementById('flight-content');
  const clone = src?.cloneNode(true) as HTMLElement;
  clone.classList.add('no-wrap');
  clone.classList.remove('fit');
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '-1',
    width: 'max-content',
    height: 'max-content',
    overflow: 'visible',
  });
  Object.assign(clone.style, {
    width: 'max-content',
    height: 'max-content',
    overflow: 'visible',
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
  return !quasar.screen.xs || menuTab.value === 'overview';
});

const menuClasses = computed<string>(() => {
  return menuTab.value !== 'overview'
    ? 'col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-12'
    : '';
});
</script>

<style lang="scss">
// Vertical navigation rail: a calm deep-slate column that anchors the board
// without competing with the manifest cards for attention.
.flight-rail {
  background: var(--surface-rail);
  box-shadow: var(--shadow-rail);
  padding: 6px 0;

  .q-tab {
    min-height: 68px;
    margin: 2px 8px;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.66);
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      background: var(--surface-rail-hover);
      color: #fff;
    }
  }

  // Active tab reads as a solid, brand-tinted key rather than a flat grey fill.
  .q-tab--active {
    background: var(--surface-rail-active);
    color: #fff;
  }

  .q-tab__content {
    width: 84px !important;
  }

  .q-tab__label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .q-tab .q-badge {
    right: 6px !important;
    top: 6px;
    font-weight: 700;
  }

  .q-separator {
    background: rgba(255, 255, 255, 0.12) !important;
  }
}

.flight-view {
  background-color: var(--surface-canvas);
}

// Full-page loading / empty states, centred and unobtrusive.
.flight-status {
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
  color: var(--ink-muted);
}

.flight-status__icon {
  color: var(--ink-faint);
}

.flight-status__title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ink-strong);
}

.flight-status__text {
  font-size: 0.9rem;
  color: var(--ink-muted);
  max-width: 22rem;
}
</style>
