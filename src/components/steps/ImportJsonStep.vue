<template>
  <q-step
    :name
    title="Upload JSON File"
    icon="upload"
    :done="file !== undefined"
  >
    <div
      class="q-pa-md"
      style="max-width: 300px"
    >
      <div class="q-gutter-md">
        <q-file
          v-model="file"
          label="Select JSON file"
          accept="application/JSON"
          :error
          :error-message
          :loading
          rounded
          outlined
          @change="errorMessage = undefined"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </div>
    </div>

    <q-stepper-navigation class="row q-gutter-sm">
      <q-btn
        label="Continue"
        color="primary"
        :disable="file === undefined"
        :loading
        rounded
        @click="processJson()"
      />
      <q-btn
        label="Back"
        color="primary"
        :disable="loading"
        rounded
        outline
        @click="emit('back')"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import { computed, ref } from 'vue';
import { loadJsonFile } from 'src/lib/JsonInputLoader';

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'to', name: string): void;
  (e: 'continue'): void;
  (e: 'back'): void;
}>();

const loading = ref(false);
const errorMessage = ref<string>();

const file = ref<File>();

const error = computed<boolean>(() => errorMessage.value != null);

async function processJson() {
  loading.value = true;
  errorMessage.value = undefined;

  try {
    modelValue.value = await loadJsonFile(file.value);

    emit('continue');
  } catch (reason) {
    errorMessage.value = reason.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
