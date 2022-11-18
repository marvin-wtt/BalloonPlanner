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

        <q-btn stretch flat icon="add" :loading="addFlightLoading" @click="addFlight" v-if="isEditor()" />
        <q-separator dark vertical />
        <q-btn-dropdown stretch flat :label="t('flights')">
          <!-- TODO Fix list style -->
          <q-item
            v-for="(flight, index) in project.flights"
            :key="flight.id"
            clickable
            v-close-popup
            :to="'/projects/' + project.id + '/flights/' + flight.id"
          >
            <q-item-section>{{ $t('flight') }} {{ index + 1 }}</q-item-section>
          </q-item>
        </q-btn-dropdown>
        <q-separator dark vertical />

        <q-btn stretch flat label="Projects" v-if="isLoggedIn()" />
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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const { t } = useI18n();

const { project } = storeToRefs(projectStore);

const leftDrawerOpen = ref(false);
const addFlightLoading = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

onMounted(() => {
  projectStore.load();
});


function isEditor(): boolean {
  // TODO
  return true;
}

function isLoggedIn(): boolean {
  return authStore.authenticated();
}

function addFlight() {
  addFlightLoading.value = true;

  const pid = projectStore.project?.id;
  console.log('Test');
  projectStore.createFlight().then((flight) => {
    router.push({
      path: `/projects/${pid}/flights/${flight.id}`,
    });
  }).catch(() => {
    // TODO error
  }).finally(() => {
    addFlightLoading.value = false;
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
