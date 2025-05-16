import { defineStore } from 'pinia';
import type { Project } from 'src/lib/entities/Project';
import { ref } from 'vue';
import { useServiceStore } from 'stores/service';

export const useProjectStore = defineStore('project', () => {
  const serviceStore = useServiceStore();
  // TODO UseRoute must only be called inside setup
  // https://github.com/vuejs/pinia/discussions/1717

  const project = ref<Project | undefined | null>();
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

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
      error.value = null;
      await serviceStore.dataService?.loadProject(projectId);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'Error';
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
