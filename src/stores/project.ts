import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { ref } from 'vue';
import { Flight } from 'src/lib/entities';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { RouteParams, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { FirestoreDataService } from 'src/services/persistence/FirestoreDataService';
import { LocalStorageService } from 'src/services/persistence/LocalStorageService';
import { useServiceStore } from 'stores/service';

export const useProjectStore = defineStore('project', () => {
  const serviceStore = useServiceStore();
  // TODO UseRoute must only be called inside setup
  // https://github.com/vuejs/pinia/discussions/1717
  const route = useRoute();

  const project = ref<Project | undefined | null>();
  const flight = ref<Flight | undefined | null>();

  const error = ref<boolean>(false);

  async function load(params?: RouteParams): Promise<void> {
    params = params ?? route.params;

    const projectId = params.project as string;
    if (projectId) {
      await loadProject(projectId);
    }

    const flightId = params.flight as string;
    await loadFlight(flightId);
  }

  async function loadProject(projectId: string): Promise<void> {
    if (projectId == null) {
      project.value = null;
      serviceStore.dataService?.unloadProject();
      return;
    }

    if (projectId == project.value?.id) {
      return;
    }

    await serviceStore.dataService?.loadProject(projectId);
  }

  async function loadFlight(flightId: string): Promise<void> {
    if (flightId == flight.value?.id) {
      return;
    }

    if (flightId == null) {
      flight.value = null;
      serviceStore.dataService?.unloadFlight();
      return;
    }

    await serviceStore.dataService?.loadFlight(flightId);
  }

  async function createFlight(): Promise<Flight> {
    if (!serviceStore.dataService) {
      throw 'service_invalid';
    }
    return serviceStore.dataService.createFlight()!;
  }

  return {
    flight,
    project,
    error,
    createFlight,
    load,
    loadProject,
    loadFlight,
  };
});
