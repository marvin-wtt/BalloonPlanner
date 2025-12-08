import { computed } from 'vue';
import { useProjectStore } from 'stores/project';
import type { ProjectSettings } from 'app/src-common/entities';

const DEFAULTS: Readonly<ProjectSettings> = {
  disableAssignmentProtection: false,
  disableVehicleGroupProtection: false,
  showVehicleIndex: true,
  showVehicleLabel: true,
  showVehicleIcon: false,
  showGroupLabel: true,
  showNumberOfFlights: true,
  showPersonWeight: false,
  showVehicleWeight: false,
  personDefaultWeight: 80,
  groupAlignment: 'horizontal',
  groupStyle: 'dashed',
  balloonColor: '#1976d2',
  carColor: '#999999',
};

/**
 * Remove entries whose value is strictly `undefined`.
 * We keep false/0/''/null.
 */
function removeUndefined<T extends Record<string, unknown>>(
  obj: T | null | undefined,
): Partial<T> {
  if (!obj || typeof obj !== 'object') return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Merge defaults with sparse overrides.
 * Any `undefined` in src is ignored → default applies.
 */
function merged(src?: Partial<ProjectSettings> | null): ProjectSettings {
  const cleaned = removeUndefined(src);
  return { ...DEFAULTS, ...cleaned };
}

export function useProjectSettings() {
  const projectStore = useProjectStore();

  const settings = computed<ProjectSettings>(() =>
    merged(projectStore.project?.settings),
  );

  function ensureSettingsObject() {
    const p = projectStore.project;
    if (!p) {
      return;
    }
    if (!p.settings || typeof p.settings !== 'object') {
      p.settings = {};
    }
  }

  /**
   * Patch multiple keys at once.
   * - Keys with `undefined` are removed (reset to default) using object rest.
   * - Other keys are set as explicit overrides.
   */
  function patch(patchObj: Partial<ProjectSettings>) {
    const p = projectStore.project;
    if (!p) {
      return;
    }
    ensureSettingsObject();

    const base = { ...(p.settings ?? {}) };

    p.settings = Object.fromEntries(
      Object.entries({ ...base, ...patchObj }).filter(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        ([, v]) => v != undefined,
      ),
    );
  }

  function reset() {
    const p = projectStore.project;
    if (!p) return;
    // Clear all overrides so everything falls back to defaults.
    p.settings = {};
  }

  function field<K extends keyof ProjectSettings>(key: K) {
    return computed<ProjectSettings[K]>({
      get: () => settings.value[key],
      set: (val) => {
        patch({ [key]: val });
      },
    });
  }

  // expose v-model friendly refs
  const disableAssignmentProtection = field('disableAssignmentProtection');
  const disableVehicleGroupProtection = field('disableVehicleGroupProtection');
  const showVehicleIndex = field('showVehicleIndex');
  const showVehicleLabel = field('showVehicleLabel');
  const showVehicleIcon = field('showVehicleIcon');
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
    disableAssignmentProtection,
    disableVehicleGroupProtection,
    showVehicleIndex,
    showVehicleLabel,
    showVehicleIcon,
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
