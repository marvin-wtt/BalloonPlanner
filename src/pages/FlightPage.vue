<template>
  <q-page class="flex">
    <q-scroll-area style="width: 100%">
      <!-- content -->
      <base-flight
        :flight="flight"
        @balloon-add="onBalloonAdd"
        @balloon-remove="onBalloonRemove"
      >
        <base-vehicle-group
          v-for="group in flight.vehicleGroups"
          :key="group.id"
          :group="group"
          @car-add="(car) => onCarAdd(group, car)"
          @car-remove="(car) => onCarRemove(group, car)"
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
              @passenger-add="(p) => onVehiclePersonAdd(vehicle, p)"
              @passenger-remove="(p) => onVehiclePersonRemove(vehicle, p)"
              @operator-add="(p) => onVehicleOperatorAdd(vehicle, p)"
              @operator-remove="(p) => onVehicleOperatorRemove(vehicle, p)"
            />
          </template>
        </base-vehicle-group>
      </base-flight>
    </q-scroll-area>

    <!--    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>-->
    <q-drawer v-model="rightDrawerOpen" side="right" :overlay="false" bordered>
      <!-- drawer content -->
      <div class="column">
        <q-scroll-area class="fit">
          <div class="q-pa-sm">
            <!-- TODO -->
          </div>
        </q-scroll-area>
      </div>
    </q-drawer>

    <!--    <div class="q-px-sm q-py-lg">-->
    <!--      <div class="column items-center" style="margin-top: 100px; margin-bottom: 100px;">-->
    <!--        <q-fab color="secondary" push icon="add" direction="left">-->
    <!--          <q-fab-action color="green" text-color="black" icon="balloon"/>-->
    <!--        </q-fab>-->
    <!--        <q-fab color="secondary" push icon="add" direction="left">-->
    <!--          <q-fab-action color="blue" text-color="black" icon="balloon"/>-->
    <!--        </q-fab>-->
    <!--      </div>-->
    <!--    </div>-->
  </q-page>

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
</template>

<script lang="ts" setup>
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';

import { Ref, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  onBeforeRouteUpdate,
  RouteParams,
  useRoute,
  useRouter,
} from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { Balloon, Car, Flight, Person, Vehicle, VehicleGroup } from 'src/lib/entities';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const rightDrawerOpen = ref(true  );

const flight = ref();
const { project } = storeToRefs(projectStore);

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

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

// TODO reduce above logic

function onBalloonAdd(balloon: Balloon) {
  // TODO
  console.log(balloon);
}

function onBalloonRemove(balloon: Balloon) {
  // TODO
  console.log(balloon);
}

function onCarAdd(group: VehicleGroup, car: Car) {
  // TODO
  group.cars.push(car);
  console.log(group, car);
}

function onCarRemove(car: Car) {
  // TODO
  console.log(car);
}

function onVehicleOperatorAdd(vehicle: Vehicle, person: Person) {
  // TODO
  vehicle.operator = person;
  console.log(person);
}

function onVehicleOperatorRemove(vehicle: Vehicle, person: Person) {
  // TODO
  vehicle.operator = undefined;
  console.log(person);
}

function onVehiclePersonAdd(vehicle: Vehicle, person: Person) {
  // TODO
  vehicle.passengers.push(person);
  console.log(person);
}

function onVehiclePersonRemove(vehicle: Vehicle, person: Person) {
  // TODO
  vehicle.passengers.splice(
    vehicle.passengers.findIndex((value) => value === person),
    1
  );
  console.log(vehicle, person);
}
</script>

<style></style>