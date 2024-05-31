import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { ref } from 'vue';
import { useServiceStore } from 'stores/service';

export const useProjectStore = defineStore('project', () => {
  const serviceStore = useServiceStore();
  // TODO UseRoute must only be called inside setup
  // https://github.com/vuejs/pinia/discussions/1717

  const project = ref<Project | undefined | null>();
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);

  async function load(projectId: string | undefined): Promise<void> {
    if (projectId === project.value?.id && !error.value) {
      return;
    }

    if (!projectId) {
      project.value = null;
      serviceStore.dataService?.unloadProject();
      return;
    }

    try {
      loading.value = true;
      error.value = false;
      await serviceStore.dataService?.loadProject(projectId);
    } catch (e) {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }

  return {
    project,
    error,
    loading,
    load,
  };
});
