<template>
  <component
    :is="tag"
    :class="{ dragged: dragged }"
    @dragstart.stop="onDragStart($event)"
    @dragend.stop="onDragEnd($event)"
    draggable="true"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import type { Identifiable } from 'src/lib/utils/Identifiable';
import { ref } from 'vue';

interface Props {
  item: Identifiable;
  tag?: string | object;
  label?: string;
}

const { item, tag = 'div' } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'cancel', element: Identifiable): void;
  (e: 'move', element: Identifiable): void;
  (e: 'remove', element: Identifiable): void;
}>();

const dragged = ref(false);

function onDragStart(event: DragEvent) {
  event.stopPropagation();
  DragHelper.startDrag(event, item);
  dragged.value = true;

  const dragContent = document.createElement('div');
  dragContent.textContent = eventContentLabel(event);
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

  return index !== -1 ? str.slice(0, index).trim() : '';
}
</script>

<style scoped>
.dragged {
  opacity: 0.5;
}
</style>

<style>
.drag-content {
  position: absolute;
  z-index: 1000;
  opacity: 0.5;
  background-color: grey;
  padding: 5px 10px;
  border-radius: 5px;
}
</style>
