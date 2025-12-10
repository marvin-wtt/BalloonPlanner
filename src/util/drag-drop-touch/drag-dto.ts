// NOTE: This file is a modified version of the original dragdroptouch GitHub repository.
// Source: https://github.com/drag-drop-touch-js/dragdroptouch (MIT license).

type DDT = {
  setDragImage: (img: HTMLElement, offsetX: number, offsetY: number) => void;
};

/**
 * Object used to hold the data that is being dragged during drag and drop operations.
 *
 * It may hold one or more data items of different types. For more information about
 * drag and drop operations and data transfer objects, see:
 * https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
 *
 * This object is created automatically by DragDropTouch and is
 * accessible through the dataTransfer property of all drag events.
 */
export class DragDTO {
  protected _dropEffect: DataTransfer['dropEffect'];
  private _effectAllowed: DataTransfer['effectAllowed'];
  private _data: Record<string, string>;
  private _dragDropTouch: DDT;

  constructor(dragDropTouch: DDT) {
    this._dropEffect = 'move';
    this._effectAllowed = 'all';
    this._data = {};
    this._dragDropTouch = dragDropTouch;
  }

  get dropEffect(): DataTransfer['dropEffect'] {
    return this._dropEffect;
  }

  set dropEffect(value: DataTransfer['dropEffect']) {
    this._dropEffect = value;
  }

  get effectAllowed(): DataTransfer['effectAllowed'] {
    return this._effectAllowed;
  }

  set effectAllowed(value: DataTransfer['effectAllowed']) {
    this._effectAllowed = value;
  }

  get types(): string[] {
    return Object.keys(this._data);
  }

  clearData(type?: string | null): void {
    if (type == null) {
      this._data = {};
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this._data[type.toLowerCase()];
  }

  getData(type: string): string | undefined {
    const lowerType = type.toLowerCase();
    let data = this._data[lowerType];

    if (lowerType === 'text' && data == null) {
      // getData("text") also returns the data stored under "text/plain"
      data = this._data['text/plain'];
    }

    return data;
  }

  setData(type: string, value: string): void {
    this._data[type.toLowerCase()] = value;
  }

  setDragImage(img: HTMLElement, offsetX: number, offsetY: number): void {
    this._dragDropTouch.setDragImage(img, offsetX, offsetY);
  }
}
