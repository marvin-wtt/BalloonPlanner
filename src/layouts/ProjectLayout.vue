<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <!-- TODO replace avator -->
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          Title
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab
          v-for="(flight, index) in project.flights"
          :key="flight.id"
          :to="'/projects/' + project.id + '/flights/' + flight.id"
          :label="$t('flight') + ' ' + (index + 1)"
        />
        <q-tab @click="addFlight" label="+" />
      </q-tabs>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" overlay elevated>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  Balloon,
  Car,
  Person,
  Project,
  VehicleGroup,
  VehicleInformation,
} from 'src/lib/entities';
import { useRouter } from 'vue-router';
import { useProjectStore } from 'stores/project-store';

const router = useRouter();
const store = useProjectStore();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// TODO load project from store
const project = ref(new Project());
store.project = project.value;

// Create default flight
if (project.value.flights.length === 0) {
  project.value.createFlight();
}

{
  const people: Person[] = [];
  people.push(new Person('Thomas', 'fr', false));
  people.push(new Person('Oliver', 'fr'));
  people.push(new Person('Daniel', 'fr'));
  people.push(new Person('Ethan', 'fr'));
  people.push(new Person('Samuel', 'fr', true));

  people.push(new Person('Sophie', 'fr'));
  people.push(new Person('Jessica', 'fr'));
  people.push(new Person('Chloe', 'fr'));
  people.push(new Person('Ruby', 'fr'));
  people.push(new Person('Charlotte', 'fr', true));

  people.push(new Person('Harry', 'de'));
  people.push(new Person('William', 'de'));
  people.push(new Person('Joseph', 'de'));
  people.push(new Person('Leo', 'de'));
  people.push(new Person('Adam', 'de', true));

  people.push(new Person('Amelia', 'de'));
  people.push(new Person('Sophie', 'de'));
  people.push(new Person('Jessica', 'de'));
  people.push(new Person('Olivia', 'de'));
  people.push(new Person('Ella', 'de', true));

  const balloonInformation: VehicleInformation[] = [];
  balloonInformation.push(
      new VehicleInformation('F-OABC', 4, [people[4], people[9]])
  );
  balloonInformation.push(
      new VehicleInformation('D-OABC', 3, [people[14]])
  );

  const balloons: Balloon[] = [];
  balloons.push(new Balloon(balloonInformation[0]));
  balloons.push(new Balloon(balloonInformation[1]));

  balloons[0].operator = people[4];
  balloons[0].addPassenger(people[0]);
  balloons[0].addPassenger(people[1]);
  balloons[0].addPassenger(people[2]);
  balloons[0].addPassenger(people[3]);

  balloons[1].operator = people[14];
  balloons[1].addPassenger(people[5]);
  balloons[1].addPassenger(people[6]);
  balloons[1].addPassenger(people[7]);

  const carInformation: VehicleInformation[] = [];
  carInformation.push(
      new VehicleInformation('M-AA-111', 8, [people[4], people[9]])
  );
  carInformation.push(new VehicleInformation('F-BB-222', 8, [people[19]]));

  const cars: Car[] = [];
  cars.push(new Car(carInformation[0]));
  cars.push(new Car(carInformation[1]));

  cars[0].operator = people[9];
  cars[0].addPassenger(people[8]);
  cars[0].addPassenger(people[10]);
  cars[0].addPassenger(people[11]);
  cars[0].addPassenger(people[12]);
  cars[0].addPassenger(people[13]);
  cars[0].addPassenger(people[15]);
  cars[0].addPassenger(people[16]);

  cars[1].operator = people[19];
  cars[1].addPassenger(people[17]);
  cars[1].addPassenger(people[18]);

  const groups: VehicleGroup[] = [];
  groups.push(new VehicleGroup(balloons[0]));
  groups.push(new VehicleGroup(balloons[1]));

  groups[0].addCar(cars[0]);
  groups[1].addCar(cars[1]);

  // project.value.flights[0].vehicleGroups.push(...groups);
  project.value.flights[0].cars.push(...carInformation);
  project.value.flights[0].balloons.push(...balloonInformation);
  project.value.flights[0].people.push(...people);
  project.value.people.push(...people);
}

function addFlight() {
  const flight = project.value.createFlight();
  router.push({
    path: '/projects/' + project.value.id + '/flights/' + flight.id,
  });
}
</script>
