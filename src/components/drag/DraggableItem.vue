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
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
});

const emit = defineEmits<{
  (e: 'cancel', element: Identifiable): void;
  (e: 'move', element: Identifiable): void;
  (e: 'remove', element: Identifiable): void;
}>();

const dragged = ref(false);

function onDragStart(event: DragEvent) {
  event.stopPropagation();
  DragHelper.startDrag(event, props.item);
  dragged.value = true;
  emit('move', props.item);
}

function onDragEnd(event: DragEvent) {
  if (DragHelper.verifyEnd(event)) {
    emit('remove', props.item);
    event.preventDefault();
  } else {
    emit('cancel', props.item);
  }

  dragged.value = false;
  DragHelper.endDrop();
}
</script>

<style scoped>
.dragged {
  opacity: 0.5;
}
</style>
