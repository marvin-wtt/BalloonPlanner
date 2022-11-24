<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="q-gutter-sm row">
        <project-card :project="project" class="project-card"></project-card>


        <q-card class="project-card" v-if="local">
          <q-btn class="add-btn" icon="folder_open" size="md" stack>{{ $t('open_project') }}</q-btn>
        </q-card>

        <q-card class="project-card">
          <q-btn class="add-btn" icon="add" size="md" stack>{{ $t('add_project') }}</q-btn>
        </q-card>
      </div>
    </div>

    <!-- content -->
  </q-page>
</template>

<script lang="ts" setup>
import ProjectCard from 'components/ProjectCard.vue';
import { Project } from 'src/lib/entities';

const local = true;

const project = new Project('Test', 'Description', [], []);
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