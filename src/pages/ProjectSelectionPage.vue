<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="q-gutter-sm row">
        <project-card
          v-for="project in projectIndex"
          :project="project"
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
        >
          <q-card-section class="col-grow">
            <div class="text-h6">
              {{ project.name }}
            </div>
            <div class="text-subtitle2">
              {{ project.description ?? '&#160;' }}
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
              @click.stop="downloadProject(project)"
            >
              Export
            </q-btn>
            <q-btn
              icon="edit"
              size="sm"
              flat
              rounded
              @click.stop="editProject(project)"
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
              @click.stop="deleteProject(project)"
            >
              Delete
            </q-btn>
          </q-card-actions>
        </project-card>

        <project-card>
          <q-file
            v-model="file"
            ref="uploaderRef"
            accept="application/json"
            style="display: none"
            @update:model-value="onFilesAdded"
          />

          <q-btn
            class="add-btn"
            icon="folder_open"
            size="md"
            stack
            flat
            @click="loadProject()"
          >
            Import Project
          </q-btn>
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
import type { Project, ProjectMeta } from 'app/src-common/entities';
import { useRouter } from 'vue-router';
import { QFile, useQuasar } from 'quasar';
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { onBeforeMount, ref } from 'vue';
import { readJsonFile } from 'src/util/json-file-reader';
import { isProject } from 'src/util/validate-project';

const router = useRouter();
const quasar = useQuasar();

const projectStore = useProjectStore();
const { projectIndex } = storeToRefs(projectStore);

const file = ref<File>();
const uploaderRef = ref<QFile>(null);

onBeforeMount(async () => {
  await projectStore.loadIndex();
});

function loadProject() {
  uploaderRef.value.pickFiles();
}

async function onFilesAdded() {
  const data = await readJsonFile(file.value);

  if (!isProject(data)) {
    quasar.notify({
      message: 'Invalid project file',
      caption: 'The file does not contain a valid project.',
      type: 'negative',
    });
    return;
  }

  // TODO Validate
  await projectStore.createProject(data);
}

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function editProject(project: ProjectMeta) {
  // TODO Add dialog
  quasar.dialog({
    title: 'Edit project',
    message: 'This feature is not yet implemented.',
    ok: {
      label: 'OK',
      color: 'primary',
      rounded: true,
    },
    cancel: {
      label: 'Cancel',
      rounded: true,
      outline: true,
    },
  });
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
