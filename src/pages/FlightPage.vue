<template>
  <q-page class="full-width row justify-start no-wrap bg-grey-5">
    <template v-if="projectLoading">
      <q-spinner
        color="primary"
        size="3em"
      />
    </template>

    <template v-else-if="flight && project">
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
            <q-tab-panel
              name="balloons"
              class="column bg-grey-2 q-pa-none"
            >
              <q-scroll-area class="col-grow self-stretch q-pa-md">
                <editable-list
                  title="Balloons"
                  item-name="Balloon"
                  :items="availableBalloons"
                  @create="showCreateBalloon"
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

            <q-tab-panel
              name="cars"
              class="column bg-grey-2 q-pa-none"
            >
              <q-scroll-area class="col-grow self-stretch q-pa-md">
                <editable-list
                  title="Cars"
                  item-name="Car"
                  :items="availableCars"
                  @create="showCreateCar()"
                  @edit="(car) => showEditCar(car.id)"
                  @delete="(car) => showDeleteCar(car)"
                >
                  <template #main="{ item }: { item: Car }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }: { item: Car }">
                    {{ item.maxCapacity - 1 + ' + 1' }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel
              name="supervisors"
              class="column bg-grey-2 q-pa-none"
            >
              <q-scroll-area class="col-grow self-stretch q-pa-md">
                <editable-list
                  title="Counselors"
                  item-name="Counselor"
                  :items="availableCounselors"
                  @create="showCreatePerson()"
                  @edit="(person) => showEditPerson(person)"
                  @delete="(person) => showDeletePerson(person)"
                >
                  <template #main="{ item }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }">
                    <template v-if="showNumberOfFlights">
                      {{ numberOfFlights[item.id] }}
                    </template>
                    <template v-if="showPersonWeight">
                      {{ item.weight ?? '?' }} kg
                    </template>
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
                  @create="showCreatePerson()"
                  @edit="(person) => showEditPerson(person)"
                  @delete="(person) => showDeletePerson(person)"
                  :dense="availableParticipants.length > 10"
                >
                  <template #main="{ item }: { item: Person }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }: { item: Person }">
                    {{ numberOfFlights[item.id] }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel
              name="settings"
              class="column bg-grey-2"
            >
              <q-scroll-area class="col-grow self-stretch">
                <div class="q-py-md">
                  <div class="text-h6 q-py-md">Settings</div>
                  <div class="q-gutter-sm">
                    <q-list
                      bordered
                      separator
                    >
                      <q-item
                        tag="label"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="labeledVehicle"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label> Show vehicle names</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        tag="label"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="indexedVehicle"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label> Show passenger index</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        tag="label"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="showNumberOfFlights"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label> Show number of flights</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        tag="label"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="showPersonWeight"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label> Show weight of person</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        tag="label"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="showVehicleWeight"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            Show total weight of balloons
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </div>
              </q-scroll-area>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>

      <!-- Flight overview -->
      <div
        v-if="showFlightView"
        class="col-grow flex"
      >
        <base-flight
          :flight
          :editable
          class="fit"
          @balloon-add="(balloon) => addVehicleGroup(balloon.id)"
        >
          <base-vehicle-group
            v-for="(group, i) in flight.vehicleGroups"
            :key="`vg-${i}`"
            :flight
            :group
            :editable
            @car-add="(car) => addCarToVehicleGroup(group.balloon.id, car.id)"
          >
            <template #balloon>
              <base-vehicle
                :key="group.balloon.id"
                type="balloon"
                :assignment="group.balloon"
                :group
                :indexed="indexedVehicle"
                :labeled="labeledVehicle"
                :flightHint="showNumberOfFlights"
                :passenger-weight-hint="showPersonWeight"
                :total-weight-hint="showVehicleWeight"
                :editable
                @remove="removeVehicleGroup(group.balloon.id)"
                @edit="showEditBalloon(group.balloon.id)"
                @passenger-add="
                  (p) => addBalloonPassenger(group.balloon.id, p.id)
                "
                @passenger-remove="
                  (p) => removeBalloonPassenger(group.balloon.id, p.id)
                "
                @operator-add="
                  (p) => addBalloonOperator(group.balloon.id, p.id)
                "
                @operator-remove="() => removeBalloonOperator(group.balloon.id)"
                @person-edit="(p) => showEditPerson(p)"
              />
            </template>
            <template #cars>
              <base-vehicle
                v-for="car in group.cars"
                :key="car.id"
                type="car"
                :assignment="car"
                :group
                :indexed="indexedVehicle"
                :labeled="labeledVehicle"
                :flightHint="showNumberOfFlights"
                :editable
                @remove="
                  () => removeCarFromVehicleGroup(group.balloon.id, car.id)
                "
                @edit="() => showEditCar(car.id)"
                @passenger-add="
                  (p) => addCarPassenger(group.balloon.id, car.id, p.id)
                "
                @passenger-remove="
                  (p) => removeCarPassenger(group.balloon.id, car.id, p.id)
                "
                @operator-add="
                  (p) => addCarOperator(group.balloon.id, car.id, p.id)
                "
                @operator-remove="
                  () => removeCarOperator(group.balloon.id, car.id)
                "
                @person-edit="(p) => showEditPerson(p)"
              />
            </template>
          </base-vehicle-group>
        </base-flight>

        <q-page-sticky
          position="bottom-right"
          :offset="[18, 18]"
        >
          <q-btn
            icon="fast_forward"
            fab
            color="accent"
            :disable="!editable"
            @click="onSmartFill"
          >
            <q-tooltip> Smart fill</q-tooltip>
          </q-btn>
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
import { computed, onMounted, ref, watch } from 'vue';
import { QItem, QList, useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';
import type { Balloon, Car, Flight, Person } from 'app/src-common/entities';
import EditableList from 'components/EditableList.vue';
import { useSettingsStore } from 'stores/settings';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';
import { useFlightStore } from 'stores/flight';
import { useFlightOperations } from 'src/composables/flight-operations';

const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const settingsStore = useSettingsStore();

const { project, loading: projectLoading } = storeToRefs(projectStore);
const { balloonMap, carMap, personMap, flight, numberOfFlights } =
  storeToRefs(flightStore);

const {
  indexedVehicle,
  labeledVehicle,
  showNumberOfFlights,
  showPersonWeight,
  showVehicleWeight,
} = storeToRefs(settingsStore);

const {
  addVehicleGroup,
  removeVehicleGroup,
  addCarToVehicleGroup,
  removeCarFromVehicleGroup,
  addBalloonOperator,
  addCarOperator,
  removeBalloonOperator,
  removeCarOperator,
  addBalloonPassenger,
  addCarPassenger,
  removeBalloonPassenger,
  removeCarPassenger,
  addPerson,
  editPerson,
  removePerson,
  addBalloon,
  editBalloon,
  removeBalloon,
  addCar,
  editCar,
  removeCar,
} = useFlightOperations();

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

    await router.push({
      name: 'flight',
      params: {
        projectId,
        flightId,
      },
    });
  }
}

async function onSmartFill() {
  if (!flight.value) {
    return;
  }

  const notify = quasar.notify({
    type: 'ongoing',
    message: 'Calculating optimal flight plan...',
  });
  editable.value = false;
  try {
    await flightStore.smartFillFlight();

    notify({
      type: 'positive',
      message: 'Successfully filled flight!',
      timeout: 1000,
    });
  } catch (reason) {
    notify({
      type: 'warning',
      message: 'Failed to fill the flight' + ': ' + reason,
      timeout: 2000,
    });
  } finally {
    editable.value = true;
  }
}

function showCreatePerson() {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        existingNames: Object.values(personMap).map(({ name }) => name),
      },
    })
    .onOk(addPerson);
}

function showEditPerson(person: Person) {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        existingNames: Object.values(personMap).map(({ name }) => name),
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
      message: `Are you sure you want to delete ${person.name} fron this flight? The person will remain in the project for other flights?`,
      ok: {
        label: 'Delete',
        color: 'negative',
      },
      cancel: {
        label: 'Cancel',
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removePerson(person.id);
    });
}

function isFlightLoaded(flight: Flight | undefined | null): flight is Flight {
  return flight != undefined;
}

function showCreateBalloon() {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        people: Object.values(personMap.value),
        balloonNames: Object.values(balloonMap.value).map(
          (balloon) => balloon.name,
        ),
      },
    })
    .onOk(addBalloon);
}

function showEditBalloon(id: string) {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        balloon: balloonMap.value[id],
        people: Object.values(personMap.value),
        balloonNames: Object.values(balloonMap.value).map(
          (balloon) => balloon.name,
        ),
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
      message: `Are you sure the balloon ${balloon.name} from this flight? It remains in the project for other flights.`,
      ok: {
        label: 'Delete',
        color: 'negative',
      },
      cancel: {
        label: 'Cancel',
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removeBalloon(balloon.id);
    });
}

function showCreateCar() {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        people: Object.values(personMap.value),
        carNames: Object.values(carMap.value).map((car) => car.name),
      },
    })
    .onOk(addCar);
}

function showEditCar(id: string) {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        car: carMap.value[id],
        people: Object.values(personMap.value),
        carNames: Object.values(carMap.value).map((car) => car.name),
      },
    })
    .onOk((payload) => {
      editCar(id, payload);
    });
}

function showDeleteCar(car: Car) {
  quasar
    .dialog({
      title: `Delete car`,
      message: `Are you sure the car ${car.name} from this flight? It remains in the project for other flights.`,
      ok: {
        label: 'Delete',
        color: 'negative',
      },
      cancel: {
        label: 'Cancel',
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removeCar(car.id);
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
</script>

<style>
.q-tab__content {
  width: 90px !important;
}

.q-tab .q-badge {
  right: 0 !important;
}
</style>
