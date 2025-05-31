import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Project, ProjectMeta } from 'app/src-common/entities';
import { ref, toRaw, watch } from 'vue';
import { debounce, useQuasar } from 'quasar';

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
      if (!oldProject || project.id !== oldProject.id) {
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

  async function createProject(project: Project): Promise<void> {
    // Clone the project to remove all vue proxies
    const copy = JSON.parse(JSON.stringify(project));

    try {
      await window.projectAPI.store(copy);

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
    isSaving.value = true;
    isDorty.value = false;
    try {
      await window.projectAPI.update(toRaw(project.value));
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
