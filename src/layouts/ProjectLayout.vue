<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-bar class="q-electron-drag" v-if="$q.platform.is.electron">
        <q-icon name="mdi-airballoon" />
        <div>{{ $t('app_name') }}</div>

        <q-space />

        <q-btn dense flat icon="minimize" @click="minimize()" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize()" />
        <q-btn dense flat icon="close" @click="closeApp()" />
      </q-bar>

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

    <q-drawer v-model="leftDrawerOpen" side="right" overlay elevated>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Balloon, Car, Person, Project } from 'src/lib/entities';
import { useRouter } from 'vue-router';
import { useProjectStore } from 'stores/project';

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

  const balloons: Balloon[] = [];
  balloons.push(new Balloon('F-OABC', 4, [people[4], people[9]]));
  balloons.push(new Balloon('D-OABC', 3, [people[14]]));

  const cars: Car[] = [];
  cars.push(new Car('M-AA-111', 10, [people[4], people[9]]));
  cars.push(new Car('F-BB-222', 10, [people[19]]));

  project.value.flights[0].cars.push(...cars);
  project.value.flights[0].balloons.push(...balloons);
  project.value.flights[0].people.push(...people);
}

function addFlight() {
  const flight = project.value.createFlight();
  router.push({
    path: '/projects/' + project.value.id + '/flights/' + flight.id,
  });
}

function minimize() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.minimize();
  }
}

function toggleMaximize() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.toggleMaximize();
  }
}

function closeApp() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.close();
  }
}
</script>
