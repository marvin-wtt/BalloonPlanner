<template>
  <div
    :class="{ dragged: dragged }"
    @dragstart="onDragStart($event)"
    @dragend="onDragEnd($event)"
    draggable="true"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import { Identifyable } from 'src/lib/utils/Identifyable';
import { ref } from 'vue';

interface Props {
  item: Identifyable;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'canceled', element: Identifyable): void;
  (e: 'removed', element: Identifyable): void;
}>();

const dragged = ref(false);

function onDragStart(event: DragEvent) {
  event.stopPropagation();
  DragHelper.startDrag(event, props.identifyable);
  dragged.value = true;
}

function onDragEnd(event: DragEvent) {
  event.stopPropagation();
  DragHelper.stopDrag();
  dragged.value = false;

  if (DragHelper.verifyDrop(event)) {
    emit('removed', DragHelper.element as Identifyable);
    event.preventDefault();
  }

  emit('canceled', DragHelper.element as Identifyable);
}
</script>

<style scoped>
div {
  margin: 0;
}
.dragged {
  opacity: 0.5;
}
</style>