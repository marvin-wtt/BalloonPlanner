import { shallowRef, readonly } from 'vue';
import type { Identifiable } from '@/../src-common/entities';

/**
 * Reactive view of the element currently being dragged. `DragHelper` tracks the
 * same element but is a plain static class, so components cannot react to it.
 * This exposes it as a ref so drop targets can highlight themselves while a
 * drag is in progress.
 */
const draggedItem = shallowRef<Identifiable | null>(null);

export function useDragState() {
  function setDraggedItem(item: Identifiable) {
    draggedItem.value = item;
  }

  function clearDraggedItem() {
    draggedItem.value = null;
  }

  return {
    draggedItem: readonly(draggedItem),
    setDraggedItem,
    clearDraggedItem,
  };
}
