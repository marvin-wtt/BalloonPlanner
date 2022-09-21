<template>
  <q-page class="full-width row justify-start no-wrap">
    <!-- Menu -->
    <div
      class="self-stretch row no-wrap col-xl-2 col-lg-3 col-md-4 col-sm-12 col-xs-12"
    >
      <q-tabs
        v-model="menuTabs"
        vertical
        active-bg-color="grey-6"
        class="bg-grey-10 text-white"
      >
        <q-tab name="overview" icon="home" :label="$t('overview')"/>
        <q-separator spaced inset color="white"/>
        <q-tab name="balloons" icon="mdi-airballoon" :label="$t('balloon')">
          <q-badge v-if="showBalloonsMenuBadge" color="red" floating>
            {{ availableBalloons.length }}
          </q-badge>
        </q-tab>
        <q-tab name="cars" icon="airport_shuttle" :label="$t('car')">
          <q-badge v-if="showCarsMenuBadge" color="red" floating>
            {{ availableCars.length }}
          </q-badge>
        </q-tab>
        <q-tab name="people" icon="group" :label="$t('person')">
          <q-badge
            v-if="showPeopleMenuBadge"
            color="red"
            floating
          >
            {{ availableParticipants.length + availableSupervisor.length }}
          </q-badge>
        </q-tab>
        <q-separator spaced inset color="white"/>
        <q-tab name="settings" icon="settings" :label="$t('setting')"/>
      </q-tabs>

      <div class="col-grow self-stretch column" v-if="menuTabs">
        <q-tab-panels
          v-model="menuTabs"
          animated
          transition-next="jump-up"
          transition-prev="jump-down"
          vertical
          class="no-wrap col-grow shadow-24"
        >
          <q-tab-panel name="overview"> Overview</q-tab-panel>

          <q-tab-panel name="balloons" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <h6>Balloons</h6>
              <q-list dense bordered separator>
                <!-- Empty List -->
                <q-item v-if="availableBalloons.length === 0">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('list_empty') }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ $t('drop_here_or_create') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Balloons -->
                <draggable-item
                  v-else
                  :tag="QItem"
                  v-for="element in availableBalloons"
                  :key="element.id"
                  :item="element"
                >
                  <q-item-section>
                    {{ element.name }}
                  </q-item-section>
                  <q-item-section side>
                    {{ element.capacity - 1 + ' + 1' }}
                  </q-item-section>
                </draggable-item>
              </q-list>

              <q-btn
                class="q-ma-sm"
                color="primary"
                icon="add"
                label="Add new item"
                @click="createVehicleDialog('balloon')"
              />
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="cars" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <h6>Cars</h6>
              <q-list dense bordered separator>
                <!-- Empty List -->
                <q-item v-if="availableCars.length === 0">
                  <q-item-section>
                    <q-item-label>{{ $t('list_empty') }}</q-item-label>
                    <q-item-label caption
                    >{{ $t('drop_here_or_create') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Balloons -->
                <draggable-item
                  v-else
                  :tag="QItem"
                  v-for="element in availableCars"
                  :key="element.id"
                  :item="element"
                >
                  <q-item-section>
                    {{ element.name }}
                  </q-item-section>
                  <q-item-section side>
                    {{ element.capacity - 1 + ' + 1' }}
                  </q-item-section>
                </draggable-item>
              </q-list>

              <q-btn
                class="q-ma-sm"
                color="primary"
                icon="add"
                label="Add new item"
                @click="createVehicleDialog('car')"
              />
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="people" class="column bg-grey-2">
            <q-scroll-area class="col-grow self-stretchs">
              <h6>Participants</h6>
              <q-list dense bordered separator>
                <draggable-item
                  :tag="QItem"
                  v-for="participant in availableParticipants"
                  :key="participant.id"
                  :item="participant"
                >
                  <q-item-section>{{ participant.name }}</q-item-section>
                  <q-item-section side>
                    {{ participant.numberOfFlights }}
                  </q-item-section>
                </draggable-item>
              </q-list>
              <h6>Supervisors</h6>
              <q-list dense bordered separator>
                <draggable-item
                  :tag="QItem"
                  v-for="supervisor in availableSupervisor"
                  :key="supervisor.id"
                  :item="supervisor"
                >
                  <q-item-section>{{ supervisor.name }}</q-item-section>
                  <q-item-section side>
                    {{ supervisor.numberOfFlights }}
                  </q-item-section>
                </draggable-item>
              </q-list>
              <q-btn
                class="q-ma-sm"
                color="primary"
                icon="add"
                label="Add new item"
                @click="createPersonDialog()"
              />

            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="settings"></q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Flight overview -->
    <div class="col-grow flex">
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
              @passenger-add="(p) => onVehiclePersonAdd(group.balloon, p)"
              @passenger-remove="(p) => onVehiclePersonRemove(group.balloon, p)"
              @operator-add="(p) => onVehicleOperatorAdd(group.balloon, p)"
              @operator-remove="
                (p) => onVehicleOperatorRemove(group.balloon, p)
              "
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
              @operator-remove="(p) => onVehicleOperatorRemove(vehicle, p)"
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
import { computed, Ref, ref, watch } from 'vue';
import { QItem, QList, useQuasar } from 'quasar';
import {
  onBeforeRouteUpdate,
  RouteParams,
  useRoute,
  useRouter,
} from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import EditVehicleDialog from 'components/dialog/EditVehicleDialog.vue';
import {
  Balloon,
  Car,
  Flight,
  Person,
  Vehicle,
  VehicleGroup,
} from 'src/lib/entities';

const menuTabs = ref('overview');

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const flight: Ref<Flight | undefined> = ref();
const {project} = storeToRefs(projectStore);

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
    router.push({name: 'projects'});
    return;
  }
}

verifyProject();

function loadFlight() {
  if (Array.isArray(route.params.flight)) {
    router.push({name: 'projects'}); // TODO change route
    return;
  }

  updateFlightPage(route.params);

  if (flight.value === undefined) {
    // TODO Maybe update the store?
    $q.notify({
      type: 'warning',
      message: 'Flight does not exist.',
    });
    router.push({name: 'projects'});
    return;
  }
}

loadFlight();

onBeforeRouteUpdate((to, from) => {
  if (from.params.flight == to.params.flight) return false;
  updateFlightPage(to.params);
  return flight.value !== undefined;
});

// TODO reduce above logic

function createPersonDialog() {
  $q.dialog({
    component: EditPersonDialog,
    componentProps: {
      mode: 'create',
    }
  }).onOk(payload => {
    const person = new Person(payload.name, payload.nation, payload.supervisor, payload.flights);
    flight.value?.people.push(person);
  });
}

function editPersonDialog(person: Person) {
  $q.dialog({
    component: EditPersonDialog,
    componentProps: {
      person: person,
      mode: 'edit',
    }
  }).onOk(payload => {
    person.name = payload.name;
    person.nation = payload.nation;
    person.numberOfFlights = payload.flights;
    person.supervisor = payload.supervisor;
  });
}

function createVehicleDialog(type: 'balloon' | 'car') {
  $q.dialog({
    component: EditVehicleDialog,
    componentProps: {
      type: type,
      people: flight.value?.people,
    }
  }).onOk(payload => {
    if (type === 'balloon') {
      const balloon = new Balloon(payload.name, payload.capacity, payload.allowedOperators);
      flight.value?.balloons.push(balloon);
    }

    if (type === 'car') {
      const car = new Car(payload.name, payload.capacity, payload.allowedOperators);
      flight.value?.cars.push(car);
    }
  });
}

function editVewhicleDialog(vehicle: Vehicle) {
  $q.dialog({
    component: EditPersonDialog,
    componentProps: {
      type: (vehicle instanceof Balloon) ? 'balloon' : 'car',
      vehicle: vehicle,
      people: flight.value?.people,
    }
  }).onOk(payload => {
    vehicle.name = payload.name;
    vehicle.capacity = payload.capacity;
    vehicle.allowedOperators = payload.allowedOperators;
  });
}

function onBalloonAdd(balloon: Balloon) {
  flight.value?.addVehicleGroup(balloon);
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

function onVehicleOperatorRemove(vehicle: Vehicle, person: Person) {
  vehicle.operator = undefined;
}

function onVehiclePersonAdd(vehicle: Vehicle, person: Person) {
  vehicle.addPassenger(person);
}

function onVehiclePersonRemove(vehicle: Vehicle, person: Person) {
  vehicle.removePassenger(person);
}

const showBalloonsMenuBadge = computed(() => {
  return availableBalloons.value.length > 0;
});
const showCarsMenuBadge = computed(() => {
  return availableCars.value.length > 0;
});
const showPeopleMenuBadge = computed(() => {
  return availableParticipants.value.length + availableSupervisor.value.length > 0;
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
  {deep: true}
);

const availableParticipants = computed(() => {
  return availablePeople.value
    .filter((value) => !value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const availableSupervisor = computed(() => {
  return availablePeople.value
    .filter((value) => value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<style></style>