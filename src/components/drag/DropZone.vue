<template>
  <component
    :is="tag"
    @dragenter.stop="onDragEnter($event)"
    @dragover.stop="onDragOver($event)"
    @dragleave.stop="onDragLeave($event)"
    @drop.stop="onDrop($event)"
    class="drop-zone"
    :class="{ highlighted: highlighted }"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import { ref } from 'vue';
import { Identifiable } from 'src/lib/utils/Identifiable';

interface Props {
  accepted?: (element: Identifiable) => boolean;
  highlight?: boolean;
  highlightColor?: string;
  tag?: string | object;
}

const props = withDefaults(defineProps<Props>(), {
  accepted: () => true,
  highlight: true,
  highlightColor: '#31ccec',
  tag: 'div',
});

const emit = defineEmits<{
  (e: 'dropped', item: Identifiable): void;
}>();

const highlighted = ref(false);

function accepted(): boolean {
  return DragHelper.element !== null && props.accepted(DragHelper.element);
}

function onDragEnter(event: DragEvent) {
  if (!accepted()) {
    return;
  }

  event.preventDefault();
  highlighted.value = true;
}

function onDragOver(event: DragEvent) {
  if (!accepted()) {
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
  if (!accepted() || !DragHelper.verifyDrop(event)) {
    return;
  }

  // Typecasting is safe as type safety is previously ensured
  emit('dropped', element as Identifiable);
}
</script>

<style scoped>
.highlighted {
  background-color: v-bind(highlightColor) !important;
}
</style>
