<template>
  <div
    @dragenter="onDragEnter($event)"
    @dragover="onDragOver($event)"
    @dragleave="onDragLeave($event)"
    @drop="onDrop($event)"
    class="drop-zone"
    :class="{ highlighted: highlighted }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { DragHelper } from 'src/util/DragHelper';
import { ref } from 'vue';
import { Identifyable } from 'src/lib/utils/Identifyable';

interface Props {
  accepted?: (element: Identifyable) => boolean;
  highlight?: boolean;
  highlightColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accepted: () => true,
  highlight: true,
  highlightColor: '#31ccec',
});

const emit = defineEmits<{
  (e: 'dropped', person: Identifyable): void;
}>();

const highlighted = ref(false);

function accepted(): boolean {
  return DragHelper.element !== null && props.accepted(DragHelper.element);
}

function onDragEnter(event: DragEvent) {
  event.stopPropagation();

  if (!accepted()) {
    return;
  }

  event.preventDefault();
  highlighted.value = true;
}

function onDragOver(event: DragEvent) {
  event.stopPropagation();

  if (!accepted()) {
    return;
  }

  event.preventDefault();
}

function onDragLeave(event: DragEvent) {
  event.stopPropagation();

  highlighted.value = false;
  event.preventDefault();
}

function onDrop(event: DragEvent) {
  event.stopPropagation();

  highlighted.value = false;

  const element = DragHelper.element;
  if (!accepted() || !DragHelper.verifyDrop(event)) {
    return;
  }

  // Typecasting is safe as type safety is previously ensured
  emit('dropped', element as Identifyable);
}
</script>

<style scoped>

.highlighted {
  background-color: v-bind(highlightColor);
}

</style>