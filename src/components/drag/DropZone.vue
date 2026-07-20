<template>
  <component
    :is="tag"
    class="drop-zone"
    :class="{
      'highlighted--accept': highlightState === 'accept',
      'highlighted--warn': highlightState === 'warn',
      'highlighted--reject': highlightState === 'reject',
    }"
    @dragenter.stop="applyHighlight($event)"
    @dragover.stop="applyHighlight($event)"
    @dragleave.stop="onDragLeave($event)"
    @drop.stop="onDrop($event)"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { DragHelper } from '@/util/DragHelper';
import { ref } from 'vue';
import type { Identifiable } from '@/../src-common/entities';

type DropState = 'accept' | 'warn' | 'reject';

// `classify` may return null to ignore the drag entirely: no highlight and no
// accept, e.g. when a person is dragged over their own seat.
const { tag = 'div', classify = () => 'accept' } = defineProps<{
  classify?: (element: Identifiable) => DropState | null;
  tag?: string | object;
}>();

const emit = defineEmits<{
  (e: 'dropped', item: Identifiable): void;
}>();

const highlightState = ref<DropState | null>(null);

function setDropEffect(event: DragEvent, value: DataTransfer['dropEffect']) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = value;
  }
}

function applyHighlight(event: DragEvent) {
  event.preventDefault();

  const state =
    DragHelper.element !== null ? classify(DragHelper.element) : null;
  highlightState.value = state;
  DragHelper.accepted = state !== null && state !== 'reject';

  setDropEffect(event, DragHelper.accepted ? 'move' : 'none');
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();

  DragHelper.accepted = false;
  highlightState.value = null;
}

function onDrop(event: DragEvent) {
  event.preventDefault();

  const state =
    DragHelper.element !== null ? classify(DragHelper.element) : null;
  DragHelper.accepted = state !== null && state !== 'reject';

  if (
    DragHelper.element != null &&
    DragHelper.accepted &&
    DragHelper.verifyDrop(event)
  ) {
    emit('dropped', DragHelper.element);
  }

  highlightState.value = null;
}
</script>

<style scoped>
.highlighted--accept {
  background-color: rgba(25, 118, 210, 0.22) !important;
}

.highlighted--warn {
  background-color: rgba(237, 108, 2, 0.18) !important;
}

.highlighted--reject {
  background-color: rgba(211, 47, 47, 0.18) !important;
}
</style>
