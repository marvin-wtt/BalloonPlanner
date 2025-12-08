<template>
  <component
    :is="tag"
    class="drop-zone"
    :class="{ highlighted: highlighted }"
    @dragenter.stop="onDragEnter($event)"
    @dragover.stop="onDragOver($event)"
    @dragleave.stop="onDragLeave($event)"
    @drop.stop="onDrop($event)"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import { ref } from 'vue';
import type { Identifiable } from 'app/src-common/entities';

const { tag = 'div', accepted = () => true } = defineProps<{
  accepted?: (element: Identifiable) => boolean;
  tag?: string | object;
}>();

const emit = defineEmits<{
  (e: 'dropped', item: Identifiable): void;
}>();

const highlighted = ref(false);

function isAccepted(): boolean {
  return DragHelper.element !== null && accepted(DragHelper.element);
}

function onDragEnter(event: DragEvent) {
  if (!isAccepted()) {
    return;
  }

  event.preventDefault();
  highlighted.value = true;
}

function onDragOver(event: DragEvent) {
  if (!isAccepted()) {
    return;
  }

  event.preventDefault();
  highlighted.value = true;
}

function onDragLeave(event: DragEvent) {
  highlighted.value = false;
  event.preventDefault();
}

function onDrop(event: DragEvent) {
  highlighted.value = false;

  const element = DragHelper.element;
  if (element == null || !isAccepted() || !DragHelper.verifyDrop(event)) {
    return;
  }

  // Typecasting is safe as type safety is previously ensured
  emit('dropped', element);
}
</script>

<style scoped>
.highlighted {
  background-color: rgba(25, 118, 210, 0.22) !important;
}
</style>
