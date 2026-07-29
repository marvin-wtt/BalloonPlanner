<template>
  <q-input
    v-model="model"
    :label
    :rules="['anyColor']"
    hide-bottom-space
    clearable
    clear-icon="sym_o_undo"
    rounded
    outlined
    dense
  >
    <template
      v-if="model"
      #prepend
    >
      <div
        class="color-swatch"
        :style="{ backgroundColor: model }"
      />
    </template>
    <template #append>
      <q-icon
        name="colorize"
        class="cursor-pointer"
      >
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-color
            v-model="model"
            no-header
            default-view="palette"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { QInput, QIcon, QPopupProxy, QColor } from 'quasar';

const model = defineModel<string | undefined>();

defineProps<{
  label: string;
}>();
</script>

<style scoped>
.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
}
</style>
