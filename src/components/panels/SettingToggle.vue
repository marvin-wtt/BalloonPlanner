<template>
  <q-item
    v-ripple
    tag="label"
  >
    <q-item-section
      avatar
      top
    >
      <q-checkbox
        v-model="model"
        color="primary"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
      <q-item-label
        v-if="caption"
        caption
      >
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { QItem, QItemSection, QItemLabel, QCheckbox } from 'quasar';

const model = defineModel<boolean | undefined>({ required: true });

defineProps<{
  label: string;
  caption?: string;
}>();
</script>

<style scoped></style>
