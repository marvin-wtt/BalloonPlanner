<template>
  <q-page class="full-width row justify-start no-wrap">
    <!-- Menu -->
    <div
      class="self-stretch row no-wrap col-xl-2 col-lg-3 col-md-3 col-sm-6 col col-xs-12"
    >
      <q-tabs
        v-model="menuTabs"
        vertical
        active-bg-color="grey-6"
        class="bg-grey-10 text-white"
      >
        <q-tab name="overview" icon="home" :label="$t('overview')" />
        <q-separator spaced inset color="white" />
        <q-tab name="balloons" icon="mdi-airballoon" :label="$t('balloon')" />
        <q-tab name="cars" icon="airport_shuttle" :label="$t('car')" />
        <q-tab name="people" icon="group" :label="$t('person')" />
        <q-separator spaced inset color="white" />
        <q-tab name="settings" icon="settings" :label="$t('setting')" />
      </q-tabs>

      <div class="col-grow self-stretch column" v-if="menuTabs">
        <q-tab-panels
          v-model="menuTabs"
          animated
          transition-next="jump-up"
          transition-prev="jump-down"
          vertical
          class="no-wrap bg-grey-6 col-grow"
        >
          <q-tab-panel name="overview"> Overview</q-tab-panel>

          <q-tab-panel name="balloons">
            Balloons
            <q-table></q-table>
          </q-tab-panel>

          <q-tab-panel name="cars">Test</q-tab-panel>

          <q-tab-panel name="people" class="bg-grey-6 column">
            <q-scroll-area class="col-grow self-stretch">
              People
              <q-list dense dark bordered separator>
                <q-item
                  v-for="participant in availableParticipants"
                  :key="participant.id"
                >
                  <q-item-section>{{ participant.name }}</q-item-section>
                  <q-item-section side>{{ participant.numberOfFlights }}</q-item-section>
                </q-item>
              </q-list>

            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="settings"></q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Flight overview -->
    <div class="col-grow column no-wrap">
      <q-scroll-area class="col-grow">
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
                @passenger-remove="
                  (p) => onVehiclePersonRemove(group.balloon, p)
                "
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
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';

import { computed, Ref, ref, toRef, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  onBeforeRouteUpdate,
  RouteParams,
  useRoute,
  useRouter,
} from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
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

const availableBalloons: Ref<Balloon[]> = computed(() => {
  if (flight.value === undefined) return [];
  // TODO Make sure flight is not undefined in first place
  return flight.value.balloons.filter((value) => {
    return (
      flight.value?.vehicleGroups.find((group) => {
        group.balloon === value;
      }) === undefined
    );
  });
});

const availableCars: Ref<Car[]> = computed(() => {
  if (flight.value === undefined) return [];
  // TODO Make sure flight is not undefined in first place
  return flight.value.cars.filter((value) => {
    return (
      flight.value?.vehicleGroups.find((group) => {
        return group.cars.includes(value);
      }) === undefined
    );
  });
});

const availablePeople = ref(flight.value?.availablePeople() ?? []);
watch(flight, (value) => {
  console.log('Called');
  if (value === undefined) return [];
  availablePeople.value = value.availablePeople();
});

const availableParticipants = computed(() => {
  return availablePeople.value.filter((value) => !value.supervisor);
});

const availableSupervisor = computed(() => {
  return availablePeople.value.filter((value) => value.supervisor);
});

// const availablePeople: Ref<Person[]> = computed(() => {
//   if (flight.value === undefined) return [];
//   // TODO Make sure flight is not undefined in first plac
//   return flight.value.people.filter((value) => {
//     return (
//       flight.value?.vehicleGroups.find((group) => {
//         if (
//           group.balloon.operator === value ||
//           group.balloon.passengers.includes(value)
//         ) {
//           return true;
//         }
//
//         return (
//           group.cars.find((car) => {
//             return car.operator === value || car.passengers.includes(value);
//           }) === undefined
//         );
//       }) === undefined
//     );
//   });
// });
//
</script>

<style></style>