<template>
  <q-card
    v-ripple="!missing"
    class="project-card column no-wrap"
    :class="missing ? 'project-card--missing' : 'cursor-pointer q-hoverable'"
  >
    <span
      v-if="!missing"
      class="q-focus-helper"
    />

    <slot />
  </q-card>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    missing?: boolean;
  }>(),
  {
    missing: false,
  },
);
</script>

<style scoped>
.project-card {
  width: 100%;
  border-radius: var(--radius-card);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.project-card:not(.project-card--missing):hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

/* Stale index entry: the file behind it is gone, so the card cannot be opened. */
.project-card--missing {
  cursor: not-allowed;
  opacity: 0.65;
  border-style: dashed;
  box-shadow: none;
}
</style>
