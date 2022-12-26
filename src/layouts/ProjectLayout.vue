<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated>
      <q-bar class="q-electron-drag" v-if="$q.platform.is.electron">
        <q-icon name="mdi-airballoon"/>
        <div>
          {{ $t('app_name') }}
        </div>

        <q-space/>

        <q-btn dense flat icon="minimize" @click="minimize()"/>
        <q-btn dense flat icon="crop_square" @click="toggleMaximize()"/>
        <q-btn dense flat icon="close" @click="closeApp()"/>
      </q-bar>

      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          {{ $t('app_name') }}
        </q-toolbar-title>
        <q-space/>

        <FlightSelectionItem/>

        <q-btn stretch flat label="Projects" to="/projects" v-if="loggedIn"/>

        <q-separator dark vertical/>

        <q-btn stretch flat :label="$t('login')" to="/login" v-if="!loggedIn"/>
        <q-btn stretch flat icon="account_circle" v-if="loggedIn">
          <q-menu auto-close>
            <q-list>
              <q-item>
                <q-item-section>
                  {{ $t('signed_in_as') }}
                  <strong>{{ user.name }}</strong>
                </q-item-section>
              </q-item>
              <q-separator/>
              <q-item clickable @click="logout()">
                <q-item-section class="text-red">
                  {{ $t('logout') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {storeToRefs} from 'pinia';
import {useAuthStore} from 'stores/auth';
import {minimize, toggleMaximize, closeApp} from 'src/composables/windowAPI';

import FlightSelectionItem from 'components/toolbar/FlightSelectionItem.vue';

const authStore = useAuthStore();

const {user} = storeToRefs(authStore);

const loggedIn = computed(() => {
  return user.value != null;
});

function logout() {
  authStore.logout();
}
</script>
