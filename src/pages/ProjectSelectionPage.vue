<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="q-gutter-sm row" v-if="user">
        <project-card
          v-for="project in user.projects"
          :project="project"
          :key="project.id"
          class="project-card"
        />

        <q-card class="project-card" v-if="user.local">
          <q-btn
            class="add-btn"
            icon="folder_open"
            size="md"
            stack
            @click="createProject()"
          >
            {{ $t('open_project') }}
          </q-btn>
        </q-card>

        <q-card class="project-card">
          <q-btn
            class="add-btn"
            icon="add"
            size="md"
            stack
            to="/projects/create"
          >
            {{ $t('add_project') }}
          </q-btn>
        </q-card>
      </div>
    </div>

    <!-- content -->
  </q-page>
</template>

<script lang="ts" setup>
import ProjectCard from 'components/ProjectCard.vue';
import { useAuthStore } from 'stores/auth';
import { storeToRefs } from 'pinia';
import { useServiceStore } from 'stores/service';

const authStore = useAuthStore();
const serviceStore = useServiceStore();

const { user } = storeToRefs(authStore);

function createProject() {
  if (!serviceStore.dataService) {
    return;
  }

  // serviceStore.dataService.
}
</script>

<style>
.project-card {
  min-width: 15em;
  max-width: 20em;
}

.project-card .add-btn {
  width: 100%;
  height: 100%;
}
</style>
