<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="q-gutter-sm row">
        <project-card
          v-for="meta in projectIndex"
          :key="meta.id"
          class="project-card position-relative"
          @click="openProject(meta)"
        >
          <q-btn
            v-if="meta.isInternal"
            icon="close"
            class="absolute q‐ma‐xs z-top"
            style="top: 3px; right: 3px"
            size="sm"
            dense
            flat
            round
            @click.stop="removeProject(meta)"
          />

          <q-card-section class="col-grow">
            <div class="text-h6">
              {{ meta.name }}
            </div>
            <div class="text-subtitle2">
              {{ meta.description ?? '&#160;' }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions
            class="no-wrap"
            align="right"
          >
            <q-btn
              icon="download"
              size="sm"
              flat
              rounded
              @click.stop="downloadProject(meta)"
            >
              Export
            </q-btn>
            <q-btn
              icon="edit"
              size="sm"
              flat
              rounded
              @click.stop="onEditProject(meta)"
            >
              Edit
            </q-btn>
            <q-btn
              icon="delete"
              size="sm"
              color="negative"
              flat
              rounded
              dense
              @click.stop="deleteProject(meta)"
            >
              Delete
            </q-btn>
          </q-card-actions>
        </project-card>

        <project-card>
          <q-btn
            class="add-btn"
            icon="add"
            size="md"
            stack
            flat
            @click="createProject()"
          >
            Create Project
          </q-btn>
        </project-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import ProjectCard from 'components/ProjectCard.vue';
import type { ProjectMeta } from 'app/src-common/entities';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { onBeforeMount } from 'vue';
import ProjectEditDialog from 'components/dialog/ProjectEditDialog.vue';

const router = useRouter();
const quasar = useQuasar();

const projectStore = useProjectStore();
const { projectIndex } = storeToRefs(projectStore);

onBeforeMount(async () => {
  await projectStore.loadIndex();
});

async function downloadProject(project: ProjectMeta) {
  await projectStore.loadProject(project.id);
  const content = JSON.stringify(projectStore.project);
  const file = new Blob([content], {
    type: 'text/plain',
  });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(file);
  element.download = `${project.name}.json`;
  element.click();
}

async function openProject(project: ProjectMeta) {
  await router.push(`/projects/${project.id}/flights`);
}

function deleteProject(project: ProjectMeta) {
  quasar
    .dialog({
      title: `Delete project ${project.name}?`,
      message:
        'Are you sure you want to delete this project? This action cannot be undone.',
      ok: {
        label: 'Delete',
        color: 'negative',
        rounded: true,
      },
      cancel: {
        label: 'Cancel',
        rounded: true,
        outline: true,
      },
    })
    .onOk(() => {
      void projectStore.deleteProject(project.id);
    });
}

function removeProject(project: ProjectMeta) {
  quasar
    .dialog({
      title: `Remove project ${project.name}?`,
      message:
        'Are you sure you want to remove this project from the list? ' +
        'This action does not delete the project, it only removes it from ' +
        'the index.',
      ok: {
        label: 'Remove',
        rounded: true,
      },
      cancel: {
        label: 'Cancel',
        rounded: true,
        outline: true,
      },
    })
    .onOk(() => {
      void projectStore.removeProject(project.id);
    });
}

function onEditProject(project: ProjectMeta) {
  quasar
    .dialog({
      component: ProjectEditDialog,
      componentProps: {
        project,
      },
    })
    .onOk((payload: Pick<ProjectMeta, 'name' | 'description'>) => {
      void editProject(project.id, payload);
    });
}

async function editProject(
  projectId: string,
  data: Pick<ProjectMeta, 'name' | 'description'>,
) {
  await projectStore.loadProject(projectId);
  // Apply update
  projectStore.project.name = data.name;
  projectStore.project.description = data.description;
  // Refresh index
  await projectStore.saveProject();
  await projectStore.loadIndex();
}

async function createProject() {
  await router.push('/projects/create');
}
</script>

<style>
.project-card {
  width: 15em;
  aspect-ratio: 1.5;
}

.project-card .add-btn {
  width: 100%;
  height: 100%;
}
</style>
