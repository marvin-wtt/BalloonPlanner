import { computed } from 'vue';
import { useProjectStore } from '@/stores/project';
import type { ProjectSettings } from '@/../src-common/entities';

const DEFAULTS: Readonly<ProjectSettings> = {
  disableAssignmentProtection: false,
  disableVehicleGroupProtection: false,
  showVehicleIndex: true,
  showVehicleLabel: true,
  showVehicleIcon: false,
  showGroupLabel: true,
  showNumberOfFlights: true,
  showHandover: false,
  showPersonWeight: false,
  showVehicleWeight: false,
  personDefaultWeight: 80,
  groupAlignment: 'horizontal',
  groupStyle: 'dashed',
  balloonColor: '#0369A1',
  carColor: '#475569',
  // warningVisibility has no default: it's a sparse record managed by
  // useWarningVisibility, absence means "show" for every warning type.
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

  // v-model friendly refs, one per DEFAULTS key. Adding a new simple setting
  // only needs a default above and one line here — no separate declaration
  // list to keep in sync.
  const fields = {
    disableAssignmentProtection: field('disableAssignmentProtection'),
    disableVehicleGroupProtection: field('disableVehicleGroupProtection'),
    showVehicleIndex: field('showVehicleIndex'),
    showVehicleLabel: field('showVehicleLabel'),
    showVehicleIcon: field('showVehicleIcon'),
    showGroupLabel: field('showGroupLabel'),
    showNumberOfFlights: field('showNumberOfFlights'),
    showHandover: field('showHandover'),
    showPersonWeight: field('showPersonWeight'),
    showVehicleWeight: field('showVehicleWeight'),
    personDefaultWeight: field('personDefaultWeight'),
    groupAlignment: field('groupAlignment'),
    groupStyle: field('groupStyle'),
    balloonColor: field('balloonColor'),
    carColor: field('carColor'),
    warningVisibility: field('warningVisibility'),
  };

  return {
    settings,
    patch,
    reset,
    ...fields,
  };
}
