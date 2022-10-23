<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated>
      <q-bar class="q-electron-drag" v-if="$q.platform.is.electron">
        <q-icon name="mdi-airballoon" />
        <div>
          {{ $t('app_name') }}
        </div>

        <q-space />

        <q-btn dense flat icon="minimize" @click="minimize()" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize()" />
        <q-btn dense flat icon="close" @click="closeApp()" />
      </q-bar>

      <q-toolbar class="bg-primary text-white">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          @click="toggleLeftDrawer"
        />
        <q-separator dark vertical inset />

        <q-toolbar-title>
          {{ $t('app_name') }}
        </q-toolbar-title>
        <q-space />

        <q-btn stretch flat icon="add" @click="addFlight" />
        <q-separator dark vertical />
        <q-btn-dropdown stretch flat label="Flights">
          <!-- TODO Fix list style -->
          <q-item
            v-for="(flight, index) in project.flights"
            :key="flight.id"
            clickable
            v-close-popup
            :to="'/projects/' + project.id + '/flights/' + flight.id"
          >
            <q-item-section>
              {{ $t('flight') }} {{ index }}
            </q-item-section>
          </q-item>
        </q-btn-dropdown>
        <q-separator dark vertical />

        <q-btn stretch flat label="Projects" />
      </q-toolbar>
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
import { useRouter } from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const router = useRouter();
const store = useProjectStore();

const { project } = storeToRefs(store);
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

store.loadProject();

function addFlight() {
  const pid = store.project?.id;
  const fid = store.createFlight();



  router.push({
    path: '/projects/' + pid + '/flights/' + fid,
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
