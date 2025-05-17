<template>
  <q-page class="full-width row justify-start no-wrap bg-grey-5">
    <template v-if="flightError || projectError">
      <div class="test-center">
        {{ projectError }}
        {{ flightError }}
      </div>
    </template>

    <template v-else-if="flightLoading || projectLoading">
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
          class="bg-grey-10 text-white"
        >
          <q-tab
            name="overview"
            icon="home"
            :label="t('overview')"
          />
          <q-separator
            spaced
            inset
            color="white"
          />
          <q-tab
            name="balloons"
            icon="mdi-airballoon"
            :label="t('balloon', 2)"
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
            name="cars"
            icon="airport_shuttle"
            :label="t('car', 2)"
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
            name="supervisors"
            icon="supervisor_account"
            :label="t('supervisor', 2)"
          >
            <q-badge
              v-if="showSupervisorsMenuBadge"
              color="red"
              floating
            >
              {{ availableSupervisors.length }}
            </q-badge>
          </q-tab>
          <q-tab
            name="participants"
            icon="group"
            :label="t('participant', 2)"
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
            name="settings"
            icon="settings"
            :label="t('settings')"
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
              class="column bg-grey-2"
            >
              <q-scroll-area class="col-grow self-stretch">
                <editable-list
                  :title="t('balloon', 2)"
                  :item-name="t('balloon')"
                  :items="availableBalloons"
                  @create="showCreateBalloon"
                  @edit="(balloon) => showEditBalloon(balloon)"
                  @delete="(balloon) => showDeleteBalloon(balloon)"
                >
                  <template #main="{ item }: { item: Balloon }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }: { item: Balloon }">
                    {{ item.capacity - 1 + ' + 1' }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel
              name="cars"
              class="column bg-grey-2"
            >
              <q-scroll-area class="col-grow self-stretch">
                <editable-list
                  :title="t('car', 2)"
                  :item-name="t('car')"
                  :items="availableCars"
                  @create="showCreateCar()"
                  @edit="(car) => showEditCar(car)"
                  @delete="(car) => showDeleteCar(car)"
                >
                  <template #main="{ item }: { item: Car }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }: { item: Car }">
                    {{ item.capacity - 1 + ' + 1' }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel
              name="supervisors"
              class="column bg-grey-2"
            >
              <q-scroll-area class="col-grow self-stretch">
                <editable-list
                  :title="t('supervisor', 2)"
                  :item-name="t('supervisor')"
                  :items="availableSupervisors"
                  @create="showCreatePerson()"
                  @edit="(person) => showEditPerson(person)"
                  @delete="(person) => showDeletePerson(person)"
                >
                  <template #main="{ item }">
                    {{ (item as Person).name }}
                  </template>
                  <template #side="{ item }">
                    {{ (item as Person).numberOfFlights }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel
              name="participants"
              class="column bg-grey-2"
            >
              <q-scroll-area class="col-grow self-stretch">
                <editable-list
                  :title="t('participant', 2)"
                  :item-name="t('participant')"
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
                    {{ item.numberOfFlights }}
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
                  <div class="text-h6 q-py-md">
                    {{ t('settings') }}
                  </div>
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
                            val="label"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('settings_vehicles_labeled') }}
                          </q-item-label>
                          <q-item-label caption>
                            {{ t('settings_vehicles_labeled_caption') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item
                        tag="indexed"
                        v-ripple
                      >
                        <q-item-section
                          avatar
                          top
                        >
                          <q-checkbox
                            v-model="indexedVehicle"
                            val="indexed"
                            color="primary"
                          />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            {{ t('settings_vehicles_indexed') }}
                          </q-item-label>
                          <q-item-label caption>
                            {{ t('settings_vehicles_indexed_caption') }}
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
      <!-- TODO add loader or skeleton -->
      <div
        v-if="showFlightView"
        class="col-grow flex"
      >
        <base-flight
          :flight="flight"
          class="fit"
          @balloon-add="addVehicleGroup"
        >
          <base-vehicle-group
            v-for="group in (flight as Flight).vehicleGroups"
            :key="group.id"
            :group="group"
            @car-add="(car) => addCarToVehicleGroup(group, car)"
          >
            <template #balloon>
              <base-vehicle
                :key="group.balloon.id"
                type="balloon"
                :vehicle="group.balloon"
                :indexed="indexedVehicle"
                :labeled="labeledVehicle"
                @remove="removeVehicleGroup(group)"
                @edit="showEditBalloon(group.balloon)"
                @passenger-add="(p) => addBalloonPassenger(group.balloon, p)"
                @passenger-remove="
                  (p) => removeBalloonPassenger(group.balloon, p)
                "
                @operator-add="(p) => addBalloonOperator(group.balloon, p)"
                @operator-remove="() => removeBalloonOperator(group.balloon)"
                @person-edit="(p) => showEditPerson(p)"
              />
            </template>
            <template #cars>
              <base-vehicle
                v-for="car in group.cars"
                :key="car.id"
                type="car"
                :vehicle="car"
                @remove="removeCarFromVehicleGroup(group, car)"
                @edit="showEditCar(car)"
                @passenger-add="(p) => addCarPassenger(car, p)"
                @passenger-remove="(p) => removeCarPassenger(car, p)"
                @operator-add="(p) => addCarOperator(car, p)"
                @operator-remove="() => removeCarOperator(car)"
                @person-edit="(p) => showEditPerson(p)"
                :indexed="indexedVehicle"
                :labeled="labeledVehicle"
              />
            </template>
          </base-vehicle-group>
        </base-flight>

        <q-page-sticky
          position="bottom-right"
          :offset="[18, 18]"
          v-if="editable"
        >
          <q-fab
            icon="add"
            direction="up"
            color="primary"
            external-label
          >
            <q-fab-action
              external-label
              label-position="left"
              :label="t('actions.add_car')"
              icon="airport_shuttle"
              color="primary"
            />
            <q-fab-action
              external-label
              label-position="left"
              :label="t('actions.add_balloon')"
              icon="mdi-airballoon"
              color="primary"
            />
            <q-fab-action
              external-label
              label-position="left"
              :label="t('actions.smart_fill')"
              icon="fast_forward"
              color="accent"
              @click="onSmartFill"
            />
          </q-fab>
        </q-page-sticky>
      </div>
    </template>

    <template v-else>
      <div class="row full-width justify-center content-center text-center">
        <!-- TODO Add translation -->
        Select a flight first.
      </div>
    </template>
  </q-page>

  <teleport to="#navigation">
    <project-selection-item />

    <q-separator
      vertical
      dark
      inset
    />

    <flight-selection-item />
  </teleport>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { QItem, QList, useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';
import { Balloon, Car, type Flight, Person } from 'src/lib/entities';
import EditableList from 'components/EditableList.vue';
import { useI18n } from 'vue-i18n';
import { solve } from 'src/lib/solver/solver';
import { useServiceStore } from 'stores/service';
import { useSettingsStore } from 'stores/settings';
import { useAuthStore } from 'stores/auth';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import EditBalloonDialog from 'components/dialog/EditBalloonDialog.vue';
import EditCarDialog from 'components/dialog/EditCarDialog.vue';
import FlightSelectionItem from 'components/toolbar/FlightSelectionItem.vue';
import { useFlightStore } from 'stores/flight';
import ProjectSelectionItem from 'components/toolbar/ProjectSelectionItem.vue';
import { useFlightOperations } from 'src/composables/flight-operations';

const { t } = useI18n();
const route = useRoute();
const quasar = useQuasar();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const serviceStore = useServiceStore();
const settingsStore = useSettingsStore();

const {
  project,
  error: projectError,
  loading: projectLoading,
} = storeToRefs(projectStore);
const {
  flight,
  error: flightError,
  loading: flightLoading,
} = storeToRefs(flightStore);

const { dataService } = storeToRefs(serviceStore);
const { indexedVehicle, labeledVehicle } = storeToRefs(settingsStore);

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

onMounted(init);
watch(() => route.params, init);

async function init() {
  let { projectId, flightId } = route.params;

  if (Array.isArray(projectId)) {
    projectId = projectId[0];
  }

  await projectStore.load(projectId);

  if (Array.isArray(flightId)) {
    flightId = flightId[0];
  }

  await flightStore.load(flightId);
}

async function onSmartFill() {
  if (!flight.value) {
    return;
  }

  const notify = quasar.notify({
    type: 'ongoing',
    message: t('smart_fill_loading'),
  });
  try {
    const f = solve(flight.value);

    await dataService.value?.updateFLight(f);

    notify({
      type: 'positive',
      message: t('smart_fill_success'),
      timeout: 1000,
    });
  } catch (reason) {
    notify({
      type: 'warning',
      message: t('smart_fill_error') + ': ' + reason,
      timeout: 2000,
    });
  }
}

function showCreatePerson() {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        mode: 'create',
      },
    })
    .onOk((payload) => {
      const person = new Person(
        payload.name,
        payload.nation,
        payload.supervisor,
        payload.flights,
      );
      addPerson(person);
    });
}

function showEditPerson(person: Person) {
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person: person,
        mode: 'edit',
      },
    })
    .onOk((payload) => {
      const p = new Person(
        payload.name,
        payload.nation,
        payload.supervisor,
        payload.flights,
      );
      p.id = person.id;
      editPerson(p);
    });
}

function showDeletePerson(person: Person) {
  quasar
    .dialog({
      title: t('dialog.person.delete.confirm.title'),
      message: t('dialog.person.delete.confirm.message', { name: person.name }),
      ok: {
        label: t('delete'),
        color: 'negative',
      },
      cancel: {
        label: t('cancel'),
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removePerson(person);
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
        people: flight.value.people,
      },
    })
    .onOk((payload) => {
      const balloon = new Balloon(
        payload.name,
        payload.capacity,
        payload.allowedOperators,
      );
      addBalloon(balloon);
    });
}

function showEditBalloon(balloon: Balloon) {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditBalloonDialog,
      componentProps: {
        balloon: balloon,
        people: flight.value.people,
      },
    })
    .onOk((payload) => {
      const b = new Balloon(
        payload.name,
        payload.capacity,
        payload.allowedOperators,
      );
      b.id = balloon.id;
      b.operator = balloon.operator;
      b.passengers = balloon.passengers;
      editBalloon(b);
    });
}

function showDeleteBalloon(balloon: Balloon) {
  quasar
    .dialog({
      title: t('dialog.vehicle.delete.confirm.title'),
      message: t('dialog.vehicle.delete.confirm.message', {
        name: balloon.name,
      }),
      ok: {
        label: t('delete'),
        color: 'negative',
      },
      cancel: {
        label: t('cancel'),
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removeBalloon(balloon);
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
        people: flight.value.people,
      },
    })
    .onOk((payload) => {
      const car = new Car(
        payload.name,
        payload.capacity,
        payload.allowedOperators,
        payload.trailerHitch,
      );
      addCar(car);
    });
}

function showEditCar(car: Car) {
  if (!isFlightLoaded(flight.value)) {
    return;
  }

  quasar
    .dialog({
      component: EditCarDialog,
      componentProps: {
        car: car,
        people: flight.value.people,
      },
    })
    .onOk((payload) => {
      const c = new Car(
        payload.name,
        payload.capacity,
        payload.allowedOperators,
        payload.trailerHitch,
      );
      c.id = car.id;
      c.operator = car.operator;
      c.passengers = car.passengers;
      editCar(c);
    });
}

function showDeleteCar(car: Car) {
  quasar
    .dialog({
      title: t('dialog.vehicle.delete.confirm.title'),
      message: t('dialog.vehicle.delete.confirm.message', {
        name: car.name,
      }),
      ok: {
        label: t('delete'),
        color: 'negative',
      },
      cancel: {
        label: t('cancel'),
        outline: true,
        color: 'grey',
      },
      persistent: true,
    })
    .onOk(() => {
      removeCar(car);
    });
}

const editable = computed<boolean>(() => {
  if (!authStore.user || !project.value) {
    return false;
  }

  const userId = authStore.user.email ?? authStore.user.id;
  return project.value.collaborators.includes(userId);
});

const showBalloonsMenuBadge = computed<boolean>(() => {
  return availableBalloons.value.length > 0;
});
const showCarsMenuBadge = computed<boolean>(() => {
  return availableCars.value.length > 0;
});
const showParticipantsMenuBadge = computed<boolean>(() => {
  return availableParticipants.value.length > 0;
});
const showSupervisorsMenuBadge = computed<boolean>(() => {
  return availableSupervisors.value.length > 0;
});

const availablePeople = computed(() => flightStore.availablePeople);

const availableBalloons = computed(() => flightStore.availableBalloons);

const availableCars = computed(() => flightStore.availableCars);

const availableParticipants = computed<Person[]>(() => {
  return availablePeople.value
    .filter((value) => !value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const availableSupervisors = computed<Person[]>(() => {
  return availablePeople.value
    .filter((value) => value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
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
