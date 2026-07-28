<template>
  <q-item>
    <q-item-section>
      <q-select
        v-model="model"
        :label
        :hint="caption"
        hide-bottom-space
        :options
        emit-value
        map-options
        dense
        rounded
        outlined
      />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup generic="T extends string">
import { QItem, QItemSection, QSelect } from 'quasar';

const model = defineModel<T | undefined>({ required: true });

defineProps<{
  label: string;
  caption?: string;
  options: { label: string; value: T }[];
}>();
</script>

<style scoped></style>
