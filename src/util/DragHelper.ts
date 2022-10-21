import { Identifyable } from 'src/lib/utils/Identifyable';

export class DragHelper {
  private static _element: Identifyable | null;

  static startDrag(event: DragEvent, element: Identifyable) {
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

  static get element(): Identifyable | null {
    return this._element;
  }
}
