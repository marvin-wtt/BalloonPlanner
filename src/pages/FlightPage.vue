<template>
  <q-page class="full-width row justify-start no-wrap">
    <!-- Menu -->
    <div class="self-stretch row no-wrap" :class="menuClasses">
      <q-tabs
        v-model="menuTabs"
        vertical
        active-bg-color="grey-6"
        class="bg-grey-10 text-white"
      >
        <q-tab name="overview" icon="home" :label="$t('overview')" />
        <q-separator spaced inset color="white" />
        <q-tab name="balloons" icon="mdi-airballoon" :label="$t('balloon', 2)">
          <q-badge v-if="showBalloonsMenuBadge" color="red" floating>
            {{ availableBalloons.length }}
          </q-badge>
        </q-tab>
        <q-tab name="cars" icon="airport_shuttle" :label="$t('car', 2)">
          <q-badge v-if="showCarsMenuBadge" color="red" floating>
            {{ availableCars.length }}
          </q-badge>
        </q-tab>
        <q-tab
          name="supervisors"
          icon="supervisor_account"
          :label="$t('supervisor', 2)"
        >
          <q-badge v-if="showSupervisorsMenuBadge" color="red" floating>
            {{ availableSupervisors.length }}
          </q-badge>
        </q-tab>
        <q-tab name="participants" icon="group" :label="$t('participant', 2)">
          <q-badge v-if="showParticiapntsMenuBadge" color="red" floating>
            {{ availableParticipants.length }}
          </q-badge>
        </q-tab>
        <q-separator spaced inset color="white" />
        <q-tab name="settings" icon="settings" :label="$t('settings')" />
      </q-tabs>

      <div class="col-grow self-stretch column" v-if="menuTabs !== 'overview'">
        <q-tab-panels
          v-model="menuTabs"
          animated
          transition-next="jump-up"
          transition-prev="jump-down"
          vertical
          class="no-wrap col-grow shadow-24"
        >
          <q-tab-panel name="balloons" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <editable-list
                :title="$t('balloon', 2)"
                :item-name="$t('balloon')"
                :itens="availableBalloons"
                @create="dialogs.showCreateVehicle('balloon', flight)"
                @edit="(balloon) => dialogs.showEditVehicle(balloon, flight)"
                @delete="(balloon) => dialogs.showDeleteVehicle(balloon, flight)"
              >
                <template #main="{ item }">
                  {{ item.name }}
                </template>
                <template #side="{ item }">
                  {{ item.capacity - 1 + ' + 1' }}
                </template>
              </editable-list>
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="cars" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <editable-list
                :title="$t('car', 2)"
                :item-name="$t('car')"
                :itens="availableCars"
                @create="dialogs.showCreateVehicle('car', flight)"
                @edit="(car) => dialogs.showEditVehicle(car, flight)"
                @delete="(car) => dialogs.showDeleteVehicle(car, flight)"
              >
                <template #main="{ item }">
                  {{ item.name }}
                </template>
                <template #side="{ item }">
                  {{ item.capacity - 1 + ' + 1' }}
                </template>
              </editable-list>
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="supervisors" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <editable-list
                :title="$t('supervisor', 2)"
                :item-name="$t('supervisor')"
                :itens="availableSupervisors"
                @create="dialogs.showCreatePerson(flight.people)"
                @edit="(person) => dialogs.showEditPerson(person)"
                @delete="(person) => dialogs.showDeletePerson(person, flight)"
              >
                <template #main="{ item }">
                  {{ item.name }}
                </template>
                <template #side="{ item }">
                  {{ item.numberOfFlights }}
                </template>
              </editable-list>
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="participants" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <editable-list
                :title="$t('participant', 2)"
                :item-name="$t('participant')"
                :itens="availableParticipants"
                @create="dialogs.showCreatePerson(flight.people)"
                @edit="(person) => dialogs.showEditPerson(person)"
                @delete="(person) => dialogs.showDeletePerson(person, flight)"
                :dense="availableParticipants.length > 10"
              >
                <template #main="{ item }">
                  {{ item.name }}
                </template>
                <template #side="{ item }">
                  {{ item.numberOfFlights }}
                </template>
              </editable-list>
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="settings"></q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Flight overview -->
    <div v-if="showFlightView" class="col-grow flex">
      <base-flight
        :flight="flight"
        @balloon-add="onBalloonAdd"
        class="col-grow content-stretch bg-grey-5"
      >
        <base-vehicle-group
          v-for="group in flight.vehicleGroups"
          :key="group.id"
          :group="group"
          @car-add="(car) => onCarAdd(group, car)"
        >
          <template #balloon>
            <base-vehicle
              :key="group.balloon.id"
              type="balloon"
              :vehicle="group.balloon"
              @balloon-remove="(b) => onBalloonRemove(group)"
              @passenger-add="(p) => onVehiclePersonAdd(group.balloon, p)"
              @passenger-remove="(p) => onVehiclePersonRemove(group.balloon, p)"
              @operator-add="(p) => onVehicleOperatorAdd(group.balloon, p)"
              @operator-remove="(p) => onVehicleOperatorRemove(group.balloon)"
            />
          </template>
          <template #cars>
            <base-vehicle
              v-for="vehicle in group.cars"
              :key="vehicle.id"
              type="car"
              :vehicle="vehicle"
              @car-remove="(car) => onCarRemove(group, car)"
              @passenger-add="(p) => onVehiclePersonAdd(vehicle, p)"
              @passenger-remove="(p) => onVehiclePersonRemove(vehicle, p)"
              @operator-add="(p) => onVehicleOperatorAdd(vehicle, p)"
              @operator-remove="(p) => onVehicleOperatorRemove(vehicle)"
            />
          </template>
        </base-vehicle-group>
      </base-flight>

      <q-footer bordered class="bg-grey-8 text-white">
        <q-toolbar>
          <q-toolbar-title>
            <div>Title</div>
          </q-toolbar-title>

          <q-btn class="bg-primary" @click="flight.findSolution()">
            Fill flight
          </q-btn>
        </q-toolbar>
      </q-footer>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { QItem, QList, useQuasar } from 'quasar';
import {
  onBeforeRouteUpdate,
  RouteParams,
  useRoute,
  useRouter,
} from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import { useDialogs } from 'src/composables/dialogs';
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import {
  Balloon,
  Car,
  Flight,
  Person,
  Vehicle,
  VehicleGroup,
} from 'src/lib/entities';
import EditableList from 'components/EditableList.vue';
import { useI18n } from 'vue-i18n';

const menuTabs = ref('overview');

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const dialogs = useDialogs($q, t);

const flight = ref<Flight>();
const { project } = storeToRefs(projectStore);

function updateFlightPage(params: RouteParams) {
  flight.value = undefined;
  if (Array.isArray(params.fligh)) return;

  const flightId = Number(params.flight);
  flight.value = project.value?.flights.find((value) => value.id == flightId);
}

function verifyProject() {
  // TODO Check if id matches
  if (project.value === null) {
    $q.notify({
      type: 'warning',
      message: 'Invalid project.',
    });
    router.push({ name: 'projects' });
    return;
  }
}

verifyProject();

function loadFlight() {
  if (Array.isArray(route.params.flight)) {
    router.push({ name: 'projects' }); // TODO change route
    return;
  }

  updateFlightPage(route.params);

  if (flight.value === undefined) {
    // TODO Maybe update the store?
    $q.notify({
      type: 'warning',
      message: 'Flight does not exist.',
    });
    router.push({ name: 'projects' });
    return;
  }
}

loadFlight();

onBeforeRouteUpdate((to, from) => {
  if (from.params.flight == to.params.flight) return false;
  updateFlightPage(to.params);
  return flight.value !== undefined;
});

function handleSwipe(details: any) {
  // native Javascript event
  console.log(details);
}

// TODO reduce above logic
function onBalloonAdd(balloon: Balloon) {
  flight.value?.addVehicleGroup(balloon);
}

function onBalloonRemove(group: VehicleGroup) {
  flight.value?.removeVehicleGroup(group);
}

function onCarAdd(group: VehicleGroup, car: Car) {
  group.addCar(car);
}

function onCarRemove(group: VehicleGroup, car: Car) {
  group.removeCar(car);
}

function onVehicleOperatorAdd(vehicle: Vehicle, person: Person) {
  vehicle.operator = person;
}

function onVehicleOperatorRemove(vehicle: Vehicle) {
  vehicle.operator = undefined;
}

function onVehiclePersonAdd(vehicle: Vehicle, person: Person) {
  vehicle.addPassenger(person);
}

function onVehiclePersonRemove(vehicle: Vehicle, person: Person) {
  vehicle.removePassenger(person);
}

const showBalloonsMenuBadge = computed<boolean>(() => {
  return availableBalloons.value.length > 0;
});
const showCarsMenuBadge = computed<boolean>(() => {
  return availableCars.value.length > 0;
});
const showParticiapntsMenuBadge = computed<boolean>(() => {
  return availableParticipants.value.length > 0;
});
const showSupervisorsMenuBadge = computed<boolean>(() => {
  return availableSupervisors.value.length > 0;
});

const availablePeople = ref(flight.value?.availablePeople() ?? []);
const availableBalloons = ref(flight.value?.availableBalloons() ?? []);
const availableCars = ref(flight.value?.availableCars() ?? []);
watch(
  flight,
  (value) => {
    // TODO maybe just redo the logic with computed
    if (value === undefined) return [];
    availablePeople.value = value.availablePeople();
    availableBalloons.value = value.availableBalloons();
    availableCars.value = value.availableCars();
  },
  { deep: true }
);

const availableParticipants = computed(() => {
  return availablePeople.value
    .filter((value) => !value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const availableSupervisors = computed(() => {
  return availablePeople.value
    .filter((value) => value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const showFlightView = computed<boolean>(() => {
  return !$q.screen.xs || menuTabs.value === 'overview';
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
