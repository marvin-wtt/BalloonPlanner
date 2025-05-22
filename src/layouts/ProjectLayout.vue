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

          <div
            id="navigation"
            class="row q-gutter-x-xs no-wrap"
          >
            <q-btn
              :label
              :to="{ name: 'projects' }"
              class="ellipsis"
              rounded
              flat
            />
          </div>
        </div>
        <q-space />

        <q-separator
          vertical
          dark
          inset
        />

        <template v-if="quasar.platform.is.electron">
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

    <q-scroll-area style="width: 100vw; height: 100vh">
      <div style="max-width: 100vw">
        <q-page-container>
          <router-view />
        </q-page-container>
      </div>
    </q-scroll-area>
  </q-layout>
</template>

<script lang="ts" setup>
import { minimize, toggleMaximize, closeApp } from 'src/composables/windowAPI';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const quasar = useQuasar();

const route = useRoute();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);

const label = computed<string>(() => {
  if (project.value == null || route.name === 'projects') {
    return 'Projects';
  }

  return project.value.name;
});
</script>
