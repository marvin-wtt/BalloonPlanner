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

        <template v-if="project != null">
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
        </template>

        <q-btn stretch flat label="Projects" v-if="loggedIn" />

        <q-separator dark vertical />

        <q-btn stretch flat :label="$t('login')" v-if="!loggedIn" />
        <q-btn stretch flat :label="user?.name" icon="account_circle" v-if="loggedIn" />
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
import { useAuthStore } from 'stores/auth';
import { useI18n } from 'vue-i18n';
import { minimize, toggleMaximize, closeApp } from 'src/composables/windowAPI';

const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const { t } = useI18n();

const { project } = storeToRefs(projectStore);
const { user } = storeToRefs(authStore);

const leftDrawerOpen = ref(false);
const addFlightLoading = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

onMounted(() => {
  projectStore.load();
});

const loggedIn = computed(() => {
  return user.value != null;
});

function isEditor(): boolean {
  // TODO
  return true;
}

function addFlight() {
  addFlightLoading.value = true;

  const pid = projectStore.project?.id;
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
</script>
