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

          <div class="row q-gutter-x-xs no-wrap">
            <q-btn
              :label
              :to="{ name: 'projects' }"
              class="ellipsis"
              rounded
              flat
            />

            <q-btn
              v-if="project"
              :icon="syncIcon"
              :disable="!isDorty"
              :loading="isSaving"
              size="sm"
              dense
              round
              flat
              @click="onSaveProject"
            />

            <template v-if="!inIndexPage">
              <q-separator
                vertical
                dark
                inset
              />

              <flight-selection-item />
            </template>
          </div>
        </div>
        <q-space />

        <update-btn
          icon="info"
          dense
          flat
          rounded
        />

        <q-separator
          vertical
          dark
          inset
        />

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
import { useRoute } from 'vue-router';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import FlightSelectionItem from 'components/toolbar/FlightSelectionItem.vue';
import UpdateBtn from 'components/UpdateBtn.vue';

const route = useRoute();
const projectStore = useProjectStore();
const { project, isDorty, isSaving } = storeToRefs(projectStore);

const syncIcon = computed<string>(() => {
  if (isDorty.value || isSaving.value) {
    return 'autorenew';
  }

  return 'done';
});

const inIndexPage = computed<boolean>(() => {
  return project.value == null || route.name === 'projects';
});

const label = computed<string>(() => {
  if (inIndexPage.value) {
    return 'Projects';
  }

  return project.value.name;
});

async function onSaveProject() {
  await projectStore.saveProject();
}
</script>
