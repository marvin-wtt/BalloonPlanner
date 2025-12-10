// NOTE: This file is a modified version of the original dragdroptouch GitHub repository.
// Source: https://github.com/drag-drop-touch-js/dragdroptouch (MIT license).

export type Mutable<T extends Event, K extends keyof T> = {
  -readonly [P in keyof T | K]: T[P];
};

export function setDataTransfer(event: DragEvent, data: object): void {
  (event as Mutable<DragEvent, 'dataTransfer'>).dataTransfer =
    data as DataTransfer;
}

export function pointFrom(
  e: TouchEvent,
  page = false,
): { x: number; y: number } {
  const touch = e.touches[0];
  if (!touch) {
    return { x: 0, y: 0 };
  }

  return {
    x: page ? touch.pageX : touch.clientX,
    y: page ? touch.pageY : touch.clientY,
  };
}

export function copyProps(
  dst: Record<string, unknown>,
  src: Event | Touch,
  props: Array<string>,
): void {
  for (let i = 0; i < props.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const p = props[i]!;
    dst[p] = src[p];
  }
}

export function newForwardableEvent(
  type: keyof GlobalEventHandlersEventMap,
  srcEvent: TouchEvent,
  target: HTMLElement,
): DragEvent {
  const _kbdProps = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
  const _ptProps = [
    'pageX',
    'pageY',
    'clientX',
    'clientY',
    'screenX',
    'screenY',
    'offsetX',
    'offsetY',
  ];

  const evt = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as unknown as Mutable<DragEvent, 'button' | 'which' | 'buttons'> & {
    readonly defaultPrevented: boolean;
  };

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const touch = srcEvent.touches[0]!;

  evt.button = 0;
  evt.which = evt.buttons = 1;

  copyProps(evt, srcEvent, _kbdProps);
  copyProps(evt, touch, _ptProps);
  setOffsetAndLayerProps(evt, target);

  return evt;
}

function setOffsetAndLayerProps(
  e: Mutable<
    MouseEvent,
    `${'client' | 'layer' | 'offset' | 'page'}${'X' | 'Y'}`
  >,
  target: HTMLElement,
): void {
  const rect = target.getBoundingClientRect();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (e.offsetX === undefined) {
    e.offsetX = e.clientX - rect.x;
    e.offsetY = e.clientY - rect.y;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (e.layerX === undefined) {
    e.layerX = e.pageX - rect.left;
    e.layerY = e.pageY - rect.top;
  }
}

export function copyStyle(src: HTMLElement, dst: HTMLElement): void {
  // remove potentially troublesome attributes
  removeTroublesomeAttributes(dst);

  // copy canvas content
  if (src instanceof HTMLCanvasElement) {
    const cDst = dst as HTMLCanvasElement;
    cDst.width = src.width;
    cDst.height = src.height;
    cDst.getContext('2d')?.drawImage(src, 0, 0);
  }

  // copy style (without transitions)
  copyComputedStyles(src, dst);
  dst.style.pointerEvents = 'none';

  // and repeat for all children
  for (let i = 0; i < src.children.length; i++) {
    copyStyle(src.children[i] as HTMLElement, dst.children[i] as HTMLElement);
  }
}

function copyComputedStyles(src: HTMLElement, dst: HTMLElement): void {
  const cs = getComputedStyle(src);

  for (const key of cs) {
    if (key.includes('transition')) continue;
    dst.style[key] = cs[key];
  }

  Object.keys(dst.dataset).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete dst.dataset[key as keyof DOMStringMap];
  });
}

function removeTroublesomeAttributes(dst: HTMLElement): void {
  ['id', 'class', 'style', 'draggable'].forEach((att) => {
    dst.removeAttribute(att);
  });
}
