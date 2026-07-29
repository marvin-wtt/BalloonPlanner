<template>
  <q-item>
    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
      <q-item-label
        v-if="caption"
        caption
      >
        {{ caption }}
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <slot />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { QItem, QItemSection, QItemLabel } from 'quasar';

defineProps<{
  label: string;
  caption?: string;
}>();
</script>

<style scoped></style>
