<template>
  <component
    :is="tag"
    class="drop-zone"
    :class="{
      'highlighted--accepted': highlightState === 'accepted',
      'highlighted--rejected': highlightState === 'rejected',
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

const highlightState = ref<'accepted' | 'rejected' | null>(null);

function isAccepted(): boolean {
  return DragHelper.element !== null && accepted(DragHelper.element);
}

function setDropEffect(event: DragEvent, value: DataTransfer['dropEffect']) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = value;
  }
}

function applyHighlight(event: DragEvent) {
  event.preventDefault();

  DragHelper.accepted = isAccepted();
  highlightState.value = DragHelper.accepted ? 'accepted' : 'rejected';

  setDropEffect(event, DragHelper.accepted ? 'move' : 'none');
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();

  DragHelper.accepted = false;
  highlightState.value = null;
}

function onDrop(event: DragEvent) {
  event.preventDefault();

  DragHelper.accepted = isAccepted();
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
.highlighted--accepted {
  background-color: rgba(25, 118, 210, 0.22) !important;
}

.highlighted--rejected {
  background-color: rgba(211, 47, 47, 0.18) !important;
}
</style>
