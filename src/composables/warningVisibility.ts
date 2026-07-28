import { useProjectSettings } from '@/composables/projectSettings';
import type {
  WarningCategory,
  WarningVisibility,
} from '@/../src-common/entities';

/**
 * Per-project visibility of the three notice categories: 'warning' (language
 * mismatch, overweight balloon), 'error' (capacity exceeded, operator not
 * allowed, blocked place, group trailer/capacity issues), and 'swap' (person
 * assigned to a different group than the previous leg). Visibility is set
 * per category, not per individual notice. 'show' is the implicit default
 * and is never stored in the project file.
 *
 * To tag a new notice: give it the right category, then in whichever
 * component renders it, check `isHiddenAlways(category)` to drop it from the
 * live view too, and bind `:data-export-hide="visibilityOf(category) ===
 * 'hide-export'"` (removed from the export entirely) and/or
 * `:data-export-declass="..."` (only its CSS classes are stripped in the
 * export, for notices that highlight a value that must stay visible, e.g. an
 * overweight number) on its element. Each component makes that call itself —
 * the export sweep below has no notion of categories, it only ever looks for
 * those two generic tags.
 */
export function useWarningVisibility() {
  const { warningVisibility } = useProjectSettings();

  function visibilityOf(category: WarningCategory): WarningVisibility {
    return warningVisibility.value?.[category] ?? 'show';
  }

  function isHiddenAlways(category: WarningCategory): boolean {
    return visibilityOf(category) === 'hide';
  }

  function setVisibility(category: WarningCategory, value: WarningVisibility) {
    const merged: Partial<Record<WarningCategory, WarningVisibility>> = {
      ...warningVisibility.value,
      [category]: value,
    };

    const next = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== 'show'),
    ) as Partial<Record<WarningCategory, WarningVisibility>>;

    warningVisibility.value =
      Object.keys(next).length > 0 ? next : undefined;
  }

  /**
   * Removes `data-export-hide` elements and strips the class attribute off
   * `data-export-declass` elements from an export clone. Call once on the
   * detached clone in FlightPage.onExportImage, never on the live DOM —
   * elements only carry these tags once a component itself has decided (via
   * visibilityOf) that they should disappear from the export, so this sweep
   * never needs to know which category it's removing.
   */
  function stripExportHiddenWarnings(root: ParentNode): void {
    root.querySelectorAll('[data-export-hide]').forEach((el) => {
      el.remove();
    });

    root.querySelectorAll('[data-export-declass]').forEach((el) => {
      el.removeAttribute('class');
    });
  }

  return {
    visibilityOf,
    isHiddenAlways,
    setVisibility,
    stripExportHiddenWarnings,
  };
}
