<template>
  <q-page class="full-width row justify-start no-wrap">
    <template v-if="isLoading">
      <q-spinner
        color="primary"
        size="3em"
      />
    </template>

    <template v-else-if="flight">
      <!-- Menu -->
      <div
        v-if="editable"
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
          class="col-grow self-stretch column"
          v-if="menuTabs !== 'overview'"
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

            <q-tab-panel
              name="supervisors"
              class="column bg-grey-2 q-pa-none"
            >
              <q-scroll-area class="col-grow self-stretch q-pa-md">
                <editable-list
                  title="Counselors"
                  item-name="Counselor"
                  :items="availableCounselors"
                  @add="showAddPeople('counselor')"
                  @create="showCreatePerson"
                  @edit="(person) => showEditPerson(person)"
                  @delete="(person) => showDeletePerson(person)"
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

            <q-tab-panel
              name="participants"
              class="column bg-grey-2 q-pa-none"
            >
              <q-scroll-area class="col-grow self-stretch q-pa-md">
                <editable-list
                  title="Participants"
                  item-name="Participant"
                  :items="availableParticipants"
                  :dense="availableParticipants.length > 10"
                  @add="showAddPeople('participant')"
                  @create="showCreatePerson"
                  @edit="(person) => showEditPerson(person)"
                  @delete="(person) => showDeletePerson(person)"
                >
                  <template #main="{ item }: { item: Person }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }: { item: Person }">
                    {{ formatPersonMeta(item) }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <flight-settings-panel name="settings" />
          </q-tab-panels>
        </div>
      </div>

      <!-- Flight overview -->
      <div
        v-if="showFlightView"
        class="col-grow flex flight-view"
      >
        <base-flight
          :flight
          :editable
          class="fit"
        />

        <q-page-sticky
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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import BaseFlight from 'components/BaseFlight.vue';
import type {
  Balloon,
  Car,
  Person,
  SmartFillOptions,
} from 'app/src-common/entities';
import EditableList from 'components/EditableList.vue';
import { useSettingsStore } from 'stores/settings';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useFlightStore } from 'stores/flight';
import { useFlightOperations } from 'src/composables/flight-operations';
import FlightSettingsPanel from 'components/panels/FlightSettingsPanel.vue';
import FlightBalloonsPanel from 'components/panels/FlightBalloonsPanel.vue';
import FlightCarsPanel from 'components/panels/FlightCarsPanel.vue';
import SmartFillDialog from 'components/dialog/SmartFillDialog.vue';
import AddEntityToFlightDialog from 'components/dialog/AddEntityToFlightDialog.vue';
import { toPng } from 'html-to-image';

const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const settingsStore = useSettingsStore();

const { project, isLoading } = storeToRefs(projectStore);
const { flight, numberOfFlights } = storeToRefs(flightStore);

const { showNumberOfFlights, showPersonWeight, personDefaultWeight } =
  storeToRefs(settingsStore);

const { createPerson, editPerson, removePerson, addPerson } =
  useFlightOperations();

const menuTabs = ref('overview');
const editable = ref<boolean>(true);

onMounted(init);
watch(() => route.params, init);

async function init() {
  let { projectId, flightId } = route.params;

  if (Array.isArray(projectId)) {
    projectId = projectId[0];
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
    throw new Error('Received multiple flight ids');
  }

  if (flightId) {
    flightStore.loadFlight(flightId);
    return;
  }

  // If not flight specified, load the last flight
  if (project.value && project.value.flights.length > 0) {
    flightId = project.value.flights[project.value.flights.length - 1]?.id;

    await router.replace({
      name: 'flight',
      params: {
        projectId,
        flightId,
      },
    });
  }
}

function onSmartFill() {
  quasar
    .dialog({
      component: SmartFillDialog,
    })
    .onOk((options: SmartFillOptions) => {
      void smartFill(options);
    });
}

async function smartFill(options: SmartFillOptions) {
  const notify = quasar.notify({
    type: 'ongoing',
    message: 'Calculating optimal flight plan...',
  });
  editable.value = false;
  try {
    await flightStore.smartFillFlight({
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
    notify({
      type: 'warning',
      message: 'Failed to fill the flight',
      caption: error.message,
      timeout: 2000,
    });
  } finally {
    editable.value = true;
  }
}

async function onExportImage() {
  const container = document.createElement('div');
  container.classList.add('exporter-wrapper', 'flight-view');
  const src = document.getElementById('flight-content');
  const clone = src.cloneNode(true) as HTMLElement;
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

  const fileName = `${project.value.name}-flight-${project.value.flights.indexOf(flight.value) + 1}.png`;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

function showAddPeople(role: Person['role']) {
  quasar
    .dialog({
      component: AddEntityToFlightDialog,
      componentProps: {
        itemName: role.charAt(0).toUpperCase() + role.slice(1),
        items: project.value.people
          .filter(({ role: personRole }) => personRole === role)
          .filter(({ id }) => !flight.value?.personIds.includes(id)),
      },
    })
    .onOk((ids) => ids.forEach(addPerson));
}

function showCreatePerson() {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        existingNames: project.value.people.map(({ name }) => name),
      },
    })
    .onOk(createPerson);
}

function showEditPerson(person: Person) {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        existingNames: project.value.people.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      editPerson(person.id, payload);
    });
}

function showDeletePerson(person: Person) {
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

const showFlightView = computed<boolean>(() => {
  return !quasar.screen.xs || menuTabs.value === 'overview';
});

const menuClasses = computed<string>(() => {
  return menuTabs.value !== 'overview'
    ? 'col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-12'
    : '';
});

function formatPersonMeta(person: Person): string {
  const parts: string[] = [];

  if (showPersonWeight.value) {
    const weight = person.weight ?? personDefaultWeight.value ?? '?';
    const suffix = !person.weight && personDefaultWeight.value ? '*' : '';

    parts.push(`${weight}${suffix} kg`);
  }

  if (showNumberOfFlights.value) {
    const flights = numberOfFlights.value[person.id] ?? 0;
    const suffix = flights === 0 && person.firstTime ? '*' : '';

    parts.push(`${flights}${suffix}`);
  }

  return parts.join(' | ');
}
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
