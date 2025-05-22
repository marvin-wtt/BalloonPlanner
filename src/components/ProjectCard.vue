<template>
  <q-card
    class="cursor-pointer q-hoverable project-card"
    v-ripple
  >
    <span class="q-focus-helper" />

    <slot />
  </q-card>
</template>

<script lang="ts" setup></script>

<style scoped>
.project-card {
  width: 15em;
  aspect-ratio: 1.5;
  border-radius: 1em;
}
</style>
