<template>
  <q-page class="projects-page">
    <div class="projects-shell column">
      <header class="projects-header row items-end justify-between q-mb-lg">
        <div>
          <div class="projects-header__eyebrow">Projects</div>
          <h1 class="projects-header__title">Your projects</h1>
          <p class="projects-header__subtitle">
            Open a saved plan or start a new one.
          </p>
        </div>

        <div
          v-if="projects.length > 0"
          class="row q-gutter-sm no-wrap"
        >
          <q-btn
            icon="folder_open"
            label="Open"
            color="primary"
            outline
            rounded
            no-caps
            @click="loadProject()"
          />
          <q-btn
            icon="add"
            label="Create project"
            color="primary"
            unelevated
            rounded
            no-caps
            @click="createProject()"
          />
        </div>
      </header>

      <!-- Empty state -->
      <div
        v-if="projects.length === 0"
        class="projects-empty column items-center justify-center"
      >
        <q-icon
          name="flight_takeoff"
          size="46px"
          class="projects-empty__icon"
        />
        <div class="projects-empty__title">No projects yet</div>
        <div class="projects-empty__text">
          Create a project to plan your first flight, or open an existing file.
        </div>
        <div class="row q-gutter-sm q-mt-md">
          <q-btn
            icon="folder_open"
            label="Open project"
            color="primary"
            outline
            rounded
            no-caps
            @click="loadProject()"
          />
          <q-btn
            icon="add"
            label="Create project"
            color="primary"
            unelevated
            rounded
            no-caps
            @click="createProject()"
          />
        </div>
      </div>

      <!-- Project grid -->
      <div
        v-else
        class="projects-grid"
      >
        <project-card
          v-for="meta in projects"
          :key="meta.id"
          class="position-relative"
          @click="openProject(meta)"
        >
          <q-btn
            v-if="!meta.isInternal"
            icon="close"
            class="projects-card__remove"
            size="sm"
            dense
            flat
            round
            @click.stop="removeProject(meta)"
          >
            <q-tooltip>Remove from list</q-tooltip>
          </q-btn>

          <q-card-section class="projects-card__body">
            <div class="projects-card__name">
              {{ meta.name }}
            </div>
            <div class="projects-card__desc">
              {{ meta.description || 'No description' }}
            </div>
          </q-card-section>

          <q-separator color="transparent" />

          <q-card-actions
            class="projects-card__actions row items-center justify-end no-wrap"
          >
            <q-btn
              v-if="meta.isInternal"
              icon="download"
              size="sm"
              flat
              round
              @click.stop="downloadProject(meta)"
            >
              <q-tooltip>Export</q-tooltip>
            </q-btn>
            <q-btn
              v-else
              icon="folder"
              size="sm"
              flat
              round
              disable
            >
              <q-tooltip>{{ meta.filePath }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="edit"
              size="sm"
              flat
              round
              @click.stop="onEditProject(meta)"
            >
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn
              icon="delete"
              size="sm"
              color="negative"
              flat
              round
              @click.stop="deleteProject(meta)"
            >
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-card-actions>
        </project-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import ProjectCard from '@/components/ProjectCard.vue';
import type { ProjectMeta } from '@/../src-common/entities';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useProjectStore } from '@/stores/project';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';
import ProjectEditDialog from '@/components/dialog/ProjectEditDialog.vue';

const router = useRouter();
const quasar = useQuasar();

const projectStore = useProjectStore();
const { project, projectIndex } = storeToRefs(projectStore);

const projects = computed<ProjectMeta[]>(() => projectIndex.value ?? []);

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
  element.download = `${project.name}.bpp`;
  element.click();
}

async function openProject(project: ProjectMeta) {
  await router.push({
    name: 'flights',
    params: { projectId: project.id },
  });
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

  if (!project.value) {
    throw new Error('Project not found');
  }

  // Apply update
  project.value.name = data.name;
  project.value.description = data.description;
  // Refresh index
  await projectStore.saveProject();
  await projectStore.loadIndex();
}

async function createProject() {
  await router.push({
    name: 'create-project',
  });
}

function loadProject() {
  window.projectAPI.openFile();
}
</script>

<style scoped>
.projects-page {
  background: var(--surface-canvas);
  padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem);
}

.projects-shell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.projects-header {
  gap: 1rem;
}

.projects-header__eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.projects-header__title {
  margin: 0.25rem 0 0;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--ink-strong);
}

.projects-header__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: var(--ink-muted);
}

/* Responsive card grid: fills the row and wraps cleanly. align-*: start keeps
   cards at their content height and packs rows to the top, so they never
   stretch to fill the (taller) page. */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  align-items: start;
  align-content: start;
}

.projects-card__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  color: var(--ink-faint);
}

.projects-card__body {
  text-align: left;
  padding: 12px 14px 8px;
}

.projects-card__name {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ink-strong);
  overflow-wrap: anywhere;
}

.projects-card__desc {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.projects-card__actions {
  padding: 2px 6px 6px;
  gap: 2px;
  min-height: 0;
}

/* Empty state: a friendly dashed prompt rather than a bare pair of buttons. */
.projects-empty {
  min-height: 46vh;
  padding: 2.5rem 2rem;
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius-group);
  background: var(--surface-group-dashed);
  text-align: center;
}

.projects-empty__icon {
  color: var(--ink-faint);
}

.projects-empty__title {
  margin-top: 0.75rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink-strong);
}

.projects-empty__text {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: var(--ink-muted);
  max-width: 24rem;
}
</style>
