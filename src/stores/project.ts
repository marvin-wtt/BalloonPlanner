import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { ref } from 'vue';
import { Flight } from 'src/lib/entities';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { RouteParams, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { FirebaseService } from 'src/services/persistence/FirebaseService';
import { LocalStorageService } from 'src/services/persistence/LocalStorageService';

export const useProjectStore = defineStore('project', () => {
  // TODO UseRoute must only be called inside setup
  // https://github.com/vuejs/pinia/discussions/1717
  const route = useRoute();

  const project = ref<Project | undefined | null>();
  const flight = ref<Flight | undefined | null>();
  const service = ref<PersistenceService | null>();

  const error = ref<boolean>(false);

  async function initializeService() {
    const auth = useAuthStore();

    service.value = (await auth.authenticated())
      ? new FirebaseService()
      : new LocalStorageService();
  }

  async function load(params?: RouteParams) {
    params = params ?? route.params;

    if (service.value == null) {
      await initializeService();
    }

    const projectId = params.project as string;
    if (projectId) {
      loadProject(projectId);
    }

    const flightId = params.flight as string;
    loadFlight(flightId);
  }

  function loadProject(projectId: string): void {
    if (projectId == null) {
      project.value = null;
      service.value?.unloadProject();
      return;
    }

    if (projectId == project.value?.id) {
      return;
    }

    service.value?.loadProject(projectId, (newProject) => {
      project.value = newProject;
    });
  }

  function loadFlight(flightId: string): void {
    if (flightId == flight.value?.id) {
      return;
    }

    if (flightId == null) {
      flight.value = null;
      service.value?.unloadFlight();
      return;
    }

    service.value?.loadFlight(flightId, (newFlight) => {
      flight.value = newFlight;
    });
  }

  async function createFlight(): Promise<Flight> {
    if (!service.value) {
      throw new Error('No serive set.');
    }

    return service.value.createFlight();
  }

  // TODO
  // async function loadProjects(): Promise<Project[]> {
  //
  // }

  return {
    service,
    flight,
    project,
    error,
    createFlight,
    load,
    loadProject,
    loadFlight,
  };
});
