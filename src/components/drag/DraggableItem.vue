<template>
  <component
    :is="tag"
    :class="{ dragged }"
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
import { onBeforeUnmount, ref } from 'vue';

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
  (e: 'start' | 'complete' | 'cancel'): void;
}>();

const dragged = ref(false);

onBeforeUnmount(() => {
  if (!dragged.value) {
    return;
  }

  emit(DragHelper.accepted ? 'complete' : 'cancel');
});

function onDragStart(event: DragEvent) {
  event.stopPropagation();
  DragHelper.startDrag(event, item);
  dragged.value = true;

  const dragContent = document.createElement('div');
  dragContent.textContent = label ?? eventContentLabel(event);
  dragContent.className = 'drag-content';
  document.body.appendChild(dragContent);

  event.dataTransfer?.setDragImage(dragContent, 0, 0);

  emit('start');
}

function onDragEnd(event: DragEvent) {
  event.preventDefault();

  if (DragHelper.verifyEnd(event) && DragHelper.accepted) {
    emit('complete');
  } else {
    emit('cancel');
  }

  dragged.value = false;
  DragHelper.endDrop();

  const node = document.querySelector('.drag-content');
  if (node) {
    document.body.removeChild(node);
  }
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
