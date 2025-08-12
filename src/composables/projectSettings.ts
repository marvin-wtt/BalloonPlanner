import { computed } from 'vue';
import { useProjectStore } from 'stores/project';
import type { ProjectSettings } from 'app/src-common/entities';

const DEFAULTS: Readonly<ProjectSettings> = {
  showVehicleIndex: true,
  showVehicleLabel: true,
  showGroupLabel: true,
  showNumberOfFlights: true,
  showPersonWeight: false,
  showVehicleWeight: false,
  personDefaultWeight: 80,
  groupAlignment: 'horizontal',
  groupStyle: 'dashed',
};

function merged(src?: Partial<ProjectSettings> | null): ProjectSettings {
  return { ...DEFAULTS, ...(src ?? {}) };
}

export function useProjectSettings() {
  const projectStore = useProjectStore();

  const settings = computed<ProjectSettings>(() =>
    merged(projectStore.project?.settings),
  );

  function ensureSettingsObject() {
    const p = projectStore.project;
    if (!p) return;
    if (!p.settings) p.settings = { ...settings.value };
  }

  function field<K extends keyof ProjectSettings>(key: K) {
    return computed<ProjectSettings[K]>({
      get: () => settings.value[key],
      set: (val) => {
        const p = projectStore.project;
        if (!p) return;
        ensureSettingsObject();
        // write a fresh object to keep reactivity clean
        p.settings = { ...settings.value, [key]: val };
      },
    });
  }

  function patch(patch: Partial<ProjectSettings>) {
    const p = projectStore.project;
    if (!p) return;
    ensureSettingsObject();
    p.settings = { ...settings.value, ...patch };
  }

  function reset() {
    const p = projectStore.project;
    if (!p) return;
    p.settings = { ...DEFAULTS };
  }

  // expose v-model friendly refs
  const showVehicleIndex = field('showVehicleIndex');
  const showVehicleLabel = field('showVehicleLabel');
  const showGroupLabel = field('showGroupLabel');
  const showNumberOfFlights = field('showNumberOfFlights');
  const showPersonWeight = field('showPersonWeight');
  const showVehicleWeight = field('showVehicleWeight');
  const personDefaultWeight = field('personDefaultWeight');
  const groupAlignment = field('groupAlignment');
  const groupStyle = field('groupStyle');
  const balloonColor = field('balloonColor');
  const carColor = field('carColor');

  return {
    settings,
    patch,
    reset,
    showVehicleIndex,
    showVehicleLabel,
    showGroupLabel,
    showNumberOfFlights,
    showPersonWeight,
    showVehicleWeight,
    personDefaultWeight,
    groupAlignment,
    groupStyle,
    balloonColor,
    carColor,
  };
}
