import type { Identifiable } from '@/../src-common/entities';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DragHelper {
  private static _element: Identifiable | null;
  public static accepted = false;
  // Set by drop handlers that fully apply the reassignment themselves (e.g. a
  // seat swap), so the drag source must not perform its usual removal.
  public static dropHandled = false;

  static startDrag(event: DragEvent, element: Identifiable) {
    this._element = element;
    this.accepted = false;
    this.dropHandled = false;

    if (event.dataTransfer === null) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('id', element.id);
  }

  static endDrop() {
    this.accepted = false;
    this.dropHandled = false;
    this._element = null;
  }

  static verifyEnd(event: DragEvent): boolean {
    return event.dataTransfer?.dropEffect !== 'none';
  }

  static verifyDrop(event: DragEvent): boolean {
    return event.dataTransfer?.getData('id') === this._element?.id;
  }

  static get element(): Identifiable | null {
    return this._element;
  }
}
