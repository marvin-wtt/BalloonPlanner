import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Project, ProjectMeta } from 'app/src-common/entities';
import { ref, watch } from 'vue';
import { debounce, useQuasar } from 'quasar';
import { deepToRaw } from 'src/util/deep-to-raw';

export const useProjectStore = defineStore('project', () => {
  const quasar = useQuasar();

  const projectIndex = ref<ProjectMeta[]>();
  const project = ref<Project | undefined | null>();
  const isLoading = ref<boolean>(false);
  const isSaving = ref<boolean>(false);
  const isDorty = ref<boolean>(false);

  const debouncedSave = debounce(async () => {
    await saveProject();
  }, 1000);

  watch(
    project,
    (project, oldProject) => {
      // Skip initial load and updates
      if (!oldProject || project?.id !== oldProject.id) {
        return;
      }

      isDorty.value = true;

      debouncedSave();
    },
    { deep: true },
  );

  async function loadIndex() {
    projectIndex.value = await window.projectAPI.index();
  }

  async function createProject(
    data: Omit<Project, 'id' | 'version' | 'createdAt' | 'flights'>,
  ) {
    // Clone the project to remove all vue proxies
    const project: Omit<Project, 'version'> = {
      ...deepToRaw(data),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      flights: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          vehicleGroups: [],
          carIds: data.cars.map(({ id }) => id),
          balloonIds: data.balloons.map(({ id }) => id),
          personIds: data.people.map(({ id }) => id),
          legs: [
            {
              id: crypto.randomUUID(),
              assignments: {},
              canceledBalloonIds: [],
            },
          ],
        },
      ],
    };

    try {
      await window.projectAPI.store(project);

      await loadIndex();
    } catch (error) {
      quasar.notify({
        message: 'Failed to create project',
        caption: error.message,
        color: 'negative',
        group: 'project-error',
      });
      throw error;
    }

    return project;
  }

  async function deleteProject(projectId: string): Promise<void> {
    try {
      await window.projectAPI.destroy(projectId);
    } catch (e) {
      quasar.notify({
        message: 'Failed to delete project',
        caption: e.message,
        color: 'negative',
        group: 'project-error',
      });
    }

    await loadIndex();
  }

  async function loadProject(projectId: string): Promise<void> {
    isLoading.value = true;
    try {
      project.value = await window.projectAPI.show(projectId);
    } catch (e) {
      quasar.notify({
        message: 'Failed to delete project',
        caption: e.message,
        color: 'negative',
        group: 'project-error',
      });
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProject() {
    if (!project.value) {
      throw new Error('Project is not loaded');
    }

    isSaving.value = true;
    isDorty.value = false;

    try {
      await window.projectAPI.update(deepToRaw(project.value));
    } catch (e) {
      isDorty.value = true;
      console.error(e);
      quasar.notify({
        message: 'Failed to save project',
        caption: e.message,
        color: 'negative',
        group: 'project-error',
      });
    } finally {
      isSaving.value = false;
    }
  }

  async function removeProject(projectId: string) {
    try {
      await window.projectAPI.remove(projectId);
    } catch (e) {
      quasar.notify({
        message: 'Failed to remove project',
        caption: e.message,
        color: 'negative',
        group: 'project-error',
      });
    }

    await loadIndex();
  }

  return {
    projectIndex,
    project,
    isLoading,
    isSaving,
    isDorty,
    createProject,
    deleteProject,
    loadIndex,
    loadProject,
    saveProject,
    removeProject,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProjectStore, import.meta.hot));
}
