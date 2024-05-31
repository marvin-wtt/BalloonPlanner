<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated>
      <q-bar class="q-electron-drag">
        <q-icon name="mdi-airballoon" />

        <div class="row q-gutter-x-xs no-wrap">
          <q-separator
            vertical
            dark
            inset
          />

          <q-btn
            v-if="authenticated"
            :label="t('projects')"
            to="/projects"
            rounded
            flat
          />

          <q-separator
            vertical
            dark
            inset
          />

          <div
            id="navigation"
            class="row q-gutter-x-xs no-wrap"
          />
        </div>

        <q-space />

        <account-item />

        <q-separator
          vertical
          dark
          inset
        />

        <template v-if="$q.platform.is.electron">
          <q-btn
            icon="minimize"
            dense
            flat
            rounded
            @click="minimize()"
          />
          <q-btn
            icon="crop_square"
            dense
            flat
            rounded
            @click="toggleMaximize()"
          />
          <q-btn
            icon="close"
            dense
            flat
            rounded
            @click="closeApp()"
          />
        </template>
      </q-bar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'stores/auth';
import { minimize, toggleMaximize, closeApp } from 'src/composables/windowAPI';

import { useI18n } from 'vue-i18n';
import AccountItem from 'components/toolbar/AccountItem.vue';

const authStore = useAuthStore();

const { user } = storeToRefs(authStore);
const { t } = useI18n();

const authenticated = computed(() => {
  return user.value !== undefined;
});
</script>
