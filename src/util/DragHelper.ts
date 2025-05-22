import type { Identifiable } from 'app/src-common/entities';

export class DragHelper {
  private static _element: Identifiable | null;

  static startDrag(event: DragEvent, element: Identifiable) {
    DragHelper._element = element;

    if (event.dataTransfer === null || element === undefined) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('id', element.id);
  }

  static endDrop() {
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
