import { computed } from 'vue';
import { Dialog } from 'quasar';
import { storeToRefs } from 'pinia';
import type { ID } from '@/../src-common/entities';
import { useFlightStore } from '@/stores/flight';
import { useProjectSettings } from '@/composables/projectSettings';
import VehicleProtectionDialog from '@/components/dialog/VehicleProtectionDialog.vue';

/**
 * Shared across every component instance so that a single drag gesture — the
 * drop on the target group *and* the removal from the source group — only ever
 * shows the confirmation dialog once. Both operations grab this same promise
 * before the user responds, so they honor one decision together.
 */
let pendingConfirmation: Promise<boolean> | null = null;

export function useVehicleGroupProtection() {
  const flightStore = useFlightStore();
  const { flightSeries } = storeToRefs(flightStore);
  const { disableVehicleGroupProtection } = useProjectSettings();

  /**
   * Protection only matters once the vehicle arrangement is shared across more
   * than one flight leg. With a single leg there are no other legs to affect,
   * so changes are always safe.
   */
  const protectionActive = computed<boolean>(
    () =>
      (flightSeries.value?.legs.length ?? 0) > 1 &&
      !(disableVehicleGroupProtection.value ?? false),
  );

  function carIsPlaced(carId: ID): boolean {
    return (
      flightSeries.value?.vehicleGroups.some((group) =>
        group.carIds.includes(carId),
      ) ?? false
    );
  }

  /**
   * Ask the user to confirm a change that clears assignments in the other
   * flight legs. Resolves `true` when the change may proceed, `false` when it
   * is canceled.
   *
   * When protection is inactive it resolves immediately. Calls that belong to
   * the same drag gesture share a single dialog.
   */
  function confirmChange(): Promise<boolean> {
    if (!protectionActive.value) {
      return Promise.resolve(true);
    }

    if (pendingConfirmation) {
      return pendingConfirmation;
    }

    pendingConfirmation = new Promise<boolean>((resolve) => {
      Dialog.create({ component: VehicleProtectionDialog })
        .onOk(() => {
          resolve(true);
        })
        .onCancel(() => {
          resolve(false);
        });
    });

    void pendingConfirmation.finally(() => {
      pendingConfirmation = null;
    });

    return pendingConfirmation;
  }

  return { protectionActive, carIsPlaced, confirmChange };
}
