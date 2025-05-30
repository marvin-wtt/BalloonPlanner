import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { reactive, toRefs, watch } from 'vue';
import { useProjectStore } from 'stores/project';
import type { ProjectSettings } from 'app/src-common/entities';

export const useSettingsStore = defineStore('settings', () => {
  const projectStore = useProjectStore();
  const { project } = storeToRefs(projectStore);

  const defaultSettings: ProjectSettings = {
    showVehicleIndex: true,
    showVehicleLabel: true,
    showNumberOfFlights: true,
    showPersonWeight: false,
    showVehicleWeight: false,
    personDefaultWeight: 80,
    groupAlignment: 'horizontal',
    groupStyle: 'dashed',
  };

  const settings = reactive<ProjectSettings>({ ...defaultSettings });

  watch(
    project,
    (project) => {
      if (project?.settings) {
        Object.assign(settings, { ...defaultSettings, ...project.settings });
      } else if (project) {
        // initialize in-project settings if missing
        project.settings = { ...settings };
      }
    },
    { immediate: true },
  );

  watch(
    settings,
    (newSettings) => {
      if (project.value) {
        project.value.settings = { ...newSettings };
      }
    },
    { deep: true },
  );

  return toRefs(settings);
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
