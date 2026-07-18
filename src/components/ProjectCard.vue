<template>
  <q-card
    v-ripple
    class="cursor-pointer q-hoverable project-card column no-wrap"
  >
    <span class="q-focus-helper" />

    <slot />
  </q-card>
</template>

<script lang="ts" setup></script>

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

.project-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
  border-color: var(--border-strong);
}
</style>
