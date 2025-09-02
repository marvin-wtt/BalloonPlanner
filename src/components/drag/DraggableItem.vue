<template>
  <component
    :is="tag"
    :class="{ dragged: dragged }"
    :draggable="disabled ? 'false' : 'true'"
    @dragstart.stop="onDragStart($event)"
    @dragend.stop="onDragEnd($event)"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import type { Identifiable } from 'app/src-common/entities';
import { ref } from 'vue';

const {
  item,
  label = undefined,
  tag = 'div',
  disabled = false,
} = defineProps<{
  item: Identifiable;
  label?: string;
  tag?: string | object;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel' | 'move' | 'remove', element: Identifiable): void;
}>();

const dragged = ref(false);

function onDragStart(event: DragEvent) {
  event.stopPropagation();
  DragHelper.startDrag(event, item);
  dragged.value = true;

  const dragContent = document.createElement('div');
  dragContent.textContent = label ?? eventContentLabel(event);
  dragContent.className = 'drag-content';
  document.body.appendChild(dragContent);

  event.dataTransfer.setDragImage(dragContent, 0, 0);

  emit('move', item);
}

function onDragEnd(event: DragEvent) {
  if (DragHelper.verifyEnd(event)) {
    emit('remove', item);
    event.preventDefault();
  } else {
    emit('cancel', item);
  }

  document.body.removeChild(document.querySelector('.drag-content'));

  dragged.value = false;
  DragHelper.endDrop();
}

function eventContentLabel(event: DragEvent): string {
  const str = (event.target as HTMLElement).textContent;
  const index = str.search(/[0-9(]/);
  const label = index !== -1 ? str.slice(0, index) : str;

  return label.trim();
}
</script>

<style scoped>
.dragged {
  opacity: 0.5;
}
</style>

<style>
.drag-content {
  position: fixed;
  z-index: 1000;
  opacity: 0.5;
  background-color: grey;
  padding: 5px 10px;
  border-radius: 5px;
}
</style>
