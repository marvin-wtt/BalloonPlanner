import { Dialog } from 'quasar';
import AssignmentProtectionDialog from '@/components/dialog/AssignmentProtectionDialog.vue';

export function useAssignmentProtection() {
  /**
   * Ask the user to confirm assigning a person to a different vehicle group
   * than in the previous leg. Resolves `true` when the assignment may proceed,
   * `false` when it is canceled.
   *
   * Only the drop (assignment) is guarded — removing a person only touches the
   * current leg — so a single drop shows the dialog exactly once.
   */
  function confirmChange(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      Dialog.create({ component: AssignmentProtectionDialog })
        .onOk(() => {
          resolve(true);
        })
        .onCancel(() => {
          resolve(false);
        });
    });
  }

  return { confirmChange };
}
