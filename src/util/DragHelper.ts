import { Identifyable } from 'src/lib/utils/Identifyable';

export class DragHelper {
  private static _element: Identifyable | null;

  static startDrag(event: DragEvent, element: Identifyable) {
    console.log('Drag started for ' + element?.id);
    DragHelper._element = element;

    if (event.dataTransfer === null || element === undefined) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('id', element.id.toString());
  }

  static stopDrag() {
    this._element = null;
  }

  static verifyDrop(event: DragEvent): boolean {
    return (
      event.dataTransfer?.dropEffect === 'none' ||
      event.dataTransfer?.getData('id') === DragHelper._element?.id.toString()
    );
  }

  static get element(): Identifyable | null {
    return this._element;
  }
}
