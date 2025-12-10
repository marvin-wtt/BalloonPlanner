// NOTE: This file is a modified version of the original dragdroptouch GitHub repository.
// Source: https://github.com/drag-drop-touch-js/dragdroptouch (MIT license).

import {
  copyStyle,
  newForwardableEvent,
  pointFrom,
  setDataTransfer,
} from './drag-drop-touch-util';
import { DragDTO } from './drag-dto';

const { round } = Math;

type DragDropTouchConfiguration = {
  // A flag that determines whether to allow scrolling
  // when a drag reaches the edges of the screen.
  allowDragScroll: boolean;

  // The number of milliseconds we'll wait before we
  // trigger a context menu event on long press.
  contextMenuDelayMS: number;

  // How see-through should the "drag placeholder",
  // that's attached to the cursor while dragging, be?
  dragImageOpacity: number;

  // The size of the "hot region" at the edge of the
  // screen on which scrolling will be allowed, if
  // the allowDragScroll flag is true (the default).
  dragScrollPercentage: number;

  // The number of pixels to scroll if a drag event
  // occurs within a scrolling hot region.
  dragScrollSpeed: number;

  // How much do we need to touchmove before the code
  // switches to drag mode rather than click mode?
  dragThresholdPixels: number;

  // The flag that tells us whether a long-press should
  // count as a user signal to "pick up an item" for
  // drag and drop purposes.
  isPressHoldMode: boolean;

  // A flag that determines whether the code should ignore
  // the navigator.maxTouchPoints value, which normally
  // tells us whether to expect touch events or not.
  forceListen: boolean;

  // The number of milliseconds we'll wait before we
  // consider an active press to be a "long press".
  pressHoldDelayMS: number;

  // The number of pixels we allow a touch event to
  // drift over the course of a long press start.
  pressHoldMargin: number;

  // The drift in pixels that determines whether a
  // long press starts a long press, or a touch-drag.
  pressHoldThresholdPixels: number;
};

const DefaultConfiguration: DragDropTouchConfiguration = {
  allowDragScroll: true,
  contextMenuDelayMS: 900,
  dragImageOpacity: 0.5,
  dragScrollPercentage: 10,
  dragScrollSpeed: 10,
  dragThresholdPixels: 5,
  forceListen: false,
  isPressHoldMode: false,
  pressHoldDelayMS: 400,
  pressHoldMargin: 25,
  pressHoldThresholdPixels: 0,
};

interface Point {
  x: number;
  y: number;
}

class DragDropTouch {
  private readonly _dragRoot: Document | Element;
  private _dropRoot: Document | ShadowRoot;
  private _dragSource: EventTarget | null;
  private _lastTouch: TouchEvent | null;
  private _lastTarget: EventTarget | null;
  private _ptDown: Point | null;
  private _isDragEnabled: boolean;
  private _isDropZone: boolean;
  private _dataTransfer: DragDTO;
  private _img: HTMLElement | null;
  private _imgCustom: HTMLElement | null;
  private _imgOffset: Point;
  private _pressHoldIntervalId?: ReturnType<typeof setTimeout> | undefined;

  private readonly configuration: DragDropTouchConfiguration;

  constructor(
    dragRoot: Document | Element = document,
    dropRoot: Document | Element = document,
    options?: Partial<DragDropTouchConfiguration>,
  ) {
    this.configuration = { ...DefaultConfiguration, ...(options || {}) };
    this._dragRoot = dragRoot;
    this._dropRoot =
      dropRoot instanceof Document || dropRoot instanceof ShadowRoot
        ? dropRoot
        : (dropRoot.getRootNode() as Document | ShadowRoot);
    this._dragSource = null;
    this._lastTouch = null;
    this._lastTarget = null;
    this._ptDown = null;
    this._isDragEnabled = false;
    this._isDropZone = false;
    this._dataTransfer = new DragDTO(this);
    this._img = null;
    this._imgCustom = null;
    this._imgOffset = { x: 0, y: 0 };
    this.listen();
  }

  listen() {
    if (navigator.maxTouchPoints === 0 && !this.configuration.forceListen) {
      return;
    }

    const opt = { passive: false, capture: false };

    this._dragRoot.addEventListener(
      `touchstart`,
      this._touchstart.bind(this) as EventListener,
      opt,
    );
    this._dragRoot.addEventListener(
      `touchmove`,
      this._touchmove.bind(this) as EventListener,
      opt,
    );
    this._dragRoot.addEventListener(
      `touchend`,
      this._touchend.bind(this) as EventListener,
    );
    this._dragRoot.addEventListener(
      `touchcancel`,
      this._touchend.bind(this) as EventListener,
    );
  }

  setDragImage(img: HTMLElement, offsetX: number, offsetY: number) {
    this._imgCustom = img;
    this._imgOffset = { x: offsetX, y: offsetY };
  }

  _touchstart(e: TouchEvent) {
    if (!this._shouldHandle(e)) {
      return;
    }
    this._reset();
    const src = this._closestDraggable(e.target as HTMLElement);

    if (!src) {
      return;
    }

    // give caller a chance to handle the hover/move events

    if (
      !e.target ||
      this._dispatchEvent(e, `mousemove`, e.target) ||
      this._dispatchEvent(e, `mousedown`, e.target)
    ) {
      return;
    }

    this._dragSource = src;
    this._ptDown = pointFrom(e);
    this._lastTouch = e;

    // show context menu if the user hasn't started dragging after a while
    setTimeout(() => {
      if (this._dragSource === src && this._img === null) {
        if (this._dispatchEvent(e, `contextmenu`, src)) {
          this._reset();
        }
      }
    }, this.configuration.contextMenuDelayMS);

    if (this.configuration.isPressHoldMode) {
      this._pressHoldIntervalId = setTimeout(() => {
        this._isDragEnabled = true;
        this._touchmove(e);
      }, this.configuration.pressHoldDelayMS);
    }

    // We need this in case we're dealing with simulated touch events,
    // in which case the touch start + touch end won't have automagically
    // been turned into click events by the browser.
    else if (!e.isTrusted) {
      if (e.target !== this._lastTarget) {
        this._lastTarget = e.target;
      }
    }
  }

  _touchmove(e: TouchEvent) {
    if (this._shouldCancelPressHoldMove(e)) {
      this._reset();
      return;
    }

    if (this._shouldHandleMove(e) || this._shouldHandlePressHoldMove(e)) {
      // see if target wants to handle move
      const target = this._getTarget(e);
      if (!target) {
        return;
      }

      if (this._dispatchEvent(e, `mousemove`, target)) {
        this._lastTouch = e;
        e.preventDefault();
        return;
      }

      // start dragging
      if (this._dragSource && !this._img && this._shouldStartDragging(e)) {
        if (
          this._lastTouch &&
          this._dispatchEvent(this._lastTouch, `dragstart`, this._dragSource)
        ) {
          this._dragSource = null;
          return;
        }
        this._createImage(e);
        this._dispatchEvent(e, `dragenter`, target);
      }

      // continue dragging
      if (!this._img || !this._dragSource) {
        return;
      }

      this._lastTouch = e;
      e.preventDefault();

      this._dispatchEvent(e, `drag`, this._dragSource);
      if (target !== this._lastTarget) {
        if (this._lastTarget) {
          this._dispatchEvent(this._lastTouch, `dragleave`, this._lastTarget);
        }
        this._dispatchEvent(e, `dragenter`, target);
        this._lastTarget = target;
      }
      this._moveImage(e);
      this._isDropZone = this._dispatchEvent(e, `dragover`, target);

      // Allow scrolling if the screen edges were marked as "hot regions".
      if (this.configuration.allowDragScroll) {
        const delta = this._getHotRegionDelta(e);

        if (delta.x === 0 && delta.y === 0) return;

        // Find the nearest scrollable container
        const scrollableParent = this._findScrollableParent(target);
        if (scrollableParent) {
          scrollableParent.scrollBy(delta.x, delta.y);
        } else {
          globalThis.scrollBy(delta.x, delta.y);
        }
      }
    }
  }

  _findScrollableParent(element: Element | null): Element | null {
    if (!element) {
      return null;
    }

    let current = element.parentElement;

    while (current) {
      const style = getComputedStyle(current);
      const isScrollable =
        style.overflow === 'auto' ||
        style.overflow === 'scroll' ||
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflowX === 'auto' ||
        style.overflowX === 'scroll';

      // Check if element actually has scrollable content
      if (
        isScrollable &&
        (current.scrollHeight > current.clientHeight ||
          current.scrollWidth > current.clientWidth)
      ) {
        return current;
      }

      // Special handling for Quasar q-scroll-area
      if (current.classList.contains('q-scrollarea__container')) {
        console.log('Special handling required for Quasar q-scroll-area');
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  _touchend(e: TouchEvent) {
    if (!(this._lastTouch && e.target && this._lastTarget)) {
      this._reset();
      return;
    }

    if (!this._shouldHandle(e)) {
      return;
    }

    if (this._dispatchEvent(this._lastTouch, `mouseup`, e.target)) {
      e.preventDefault();
      return;
    }

    // user clicked the element but didn't drag, so clear the source and simulate a click
    if (!this._img) {
      this._dragSource = null;
      this._dispatchEvent(this._lastTouch, `click`, e.target);
    }

    // finish dragging
    this._destroyImage();
    if (this._dragSource) {
      if (e.type.indexOf(`cancel`) < 0 && this._isDropZone) {
        this._dispatchEvent(this._lastTouch, `drop`, this._lastTarget);
      }
      this._dispatchEvent(this._lastTouch, `dragend`, this._dragSource);
      this._reset();
    }
  }

  _shouldHandle(e: TouchEvent) {
    return !e.defaultPrevented && e.touches.length < 2;
  }

  _shouldHandleMove(e: TouchEvent) {
    return !this.configuration.isPressHoldMode && this._shouldHandle(e);
  }

  _shouldHandlePressHoldMove(e: TouchEvent) {
    return (
      this.configuration.isPressHoldMode &&
      this._isDragEnabled &&
      e.touches.length
    );
  }

  _shouldCancelPressHoldMove(e: TouchEvent) {
    return (
      this.configuration.isPressHoldMode &&
      !this._isDragEnabled &&
      this._getDelta(e) > this.configuration.pressHoldMargin
    );
  }

  _shouldStartDragging(e: TouchEvent) {
    const delta = this._getDelta(e);
    if (this.configuration.isPressHoldMode) {
      return delta >= this.configuration.pressHoldThresholdPixels;
    }
    return delta > this.configuration.dragThresholdPixels;
  }

  _reset() {
    this._destroyImage();
    this._dragSource = null;
    this._lastTouch = null;
    this._lastTarget = null;
    this._ptDown = null;
    this._isDragEnabled = false;
    this._isDropZone = false;
    this._dataTransfer = new DragDTO(this);
    clearTimeout(this._pressHoldIntervalId);
  }

  _getDelta(e: TouchEvent) {
    // if there is no active touch we don't need to calculate anything.
    if (!this._ptDown) return 0;

    // Determine how `far` from the event coordinate our
    // original touch coordinate was.
    const { x, y } = this._ptDown;
    const p = pointFrom(e);
    return ((p.x - x) ** 2 + (p.y - y) ** 2) ** 0.5;
  }

  _getHotRegionDelta(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) {
      console.warn(`No touch found in touchmove event.`);
      return { x: 0, y: 0 };
    }

    const { clientX: x, clientY: y } = touch;
    const { innerWidth: w, innerHeight: h } = globalThis;
    const { dragScrollPercentage, dragScrollSpeed } = this.configuration;
    const v1 = dragScrollPercentage / 100;
    const v2 = 1 - v1;
    const dx = x < w * v1 ? -dragScrollSpeed : x > w * v2 ? dragScrollSpeed : 0;
    const dy = y < h * v1 ? -dragScrollSpeed : y > h * v2 ? dragScrollSpeed : 0;
    return { x: dx, y: dy };
  }

  _getTarget(e: TouchEvent) {
    const pt = pointFrom(e);
    let el = this._dropRoot.elementFromPoint(pt.x, pt.y);
    while (el && getComputedStyle(el).pointerEvents == `none`) {
      el = el.parentElement;
    }
    return el;
  }

  _createImage(e: TouchEvent) {
    // just in case...
    if (this._img) {
      this._destroyImage();
    }
    // create drag image from custom element or drag source
    const src = this._imgCustom || (this._dragSource as HTMLElement);
    this._img = src.cloneNode(true) as HTMLElement;
    copyStyle(src, this._img);
    this._img.style.top = this._img.style.left = `-9999px`;
    // if creating from drag source, apply offset and opacity
    if (!this._imgCustom) {
      const rc = src.getBoundingClientRect();
      const pt = pointFrom(e);
      this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
      this._img.style.opacity = this.configuration.dragImageOpacity.toString();
    }
    // add image to document
    this._moveImage(e);
    document.body.appendChild(this._img);
  }

  _destroyImage() {
    if (this._img && this._img.parentElement) {
      this._img.parentElement.removeChild(this._img);
    }
    this._img = null;
    this._imgCustom = null;
  }

  _moveImage(e: TouchEvent) {
    requestAnimationFrame(() => {
      if (!this._img) {
        return;
      }

      const pt = pointFrom(e, false);
      const s = this._img.style;
      s.position = `^fixed`;
      s.pointerEvents = `none`;
      s.zIndex = `999999`;
      s.left = `${round(pt.x - this._imgOffset.x).toString()}px`;
      s.top = `${round(pt.y - this._imgOffset.y).toString()}px`;
    });
  }

  _dispatchEvent(
    srcEvent: TouchEvent,
    type: keyof GlobalEventHandlersEventMap,
    target: EventTarget,
  ) {
    const evt = newForwardableEvent(type, srcEvent, target as HTMLElement);

    // DragEvents need a data transfer object
    setDataTransfer(evt, this._dataTransfer);
    target.dispatchEvent(evt as unknown as Event);
    return evt.defaultPrevented;
  }

  _closestDraggable(element: HTMLElement | null) {
    for (let e = element; e !== null; e = e.parentElement) {
      if (e.draggable) {
        return e;
      }
    }
    return null;
  }
}

export function enableDragDropTouch(
  dragRoot: Document | Element = document,
  dropRoot: Document | Element = document,
  options?: Partial<typeof DefaultConfiguration>,
) {
  new DragDropTouch(dragRoot, dropRoot, options);
}
