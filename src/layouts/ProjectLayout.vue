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

        <FlightSelectionItem />

        <q-btn stretch flat label="Projects" v-if="loggedIn" />

        <q-separator dark vertical />

        <q-btn stretch flat :label="$t('login')" v-if="!loggedIn" />
        <q-btn stretch flat icon="account_circle" v-if="loggedIn" />
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
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'stores/auth';
import { minimize, toggleMaximize, closeApp } from 'src/composables/windowAPI';

import FlightSelectionItem from 'components/toolbar/FlightSelectionItem.vue';

const authStore = useAuthStore();

const { user } = storeToRefs(authStore);

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const loggedIn = computed(() => {
  return user.value != null;
});
</script>
