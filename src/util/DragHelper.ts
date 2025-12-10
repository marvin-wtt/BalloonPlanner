import type { Identifiable } from 'app/src-common/entities';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DragHelper {
  private static _element: Identifiable | null;
  public static accepted = false;

  static startDrag(event: DragEvent, element: Identifiable) {
    this._element = element;
    this.accepted = false;

    if (event.dataTransfer === null) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('id', element.id);
  }

  static endDrop() {
    this.accepted = false;
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
