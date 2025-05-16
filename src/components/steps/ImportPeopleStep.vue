<template>
  <q-step
    :name="name"
    title="Select loading method"
    icon="input"
    :done="loader !== undefined"
  >
    <q-list>
      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loader"
            val="online"
            disable
          />
        </q-item-section>
        <q-item-section>
          <q-item-label> Online (Ballaeron)</q-item-label>
          <q-item-label caption>
            Download data from Ballaeron survey server
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loader"
            val="json"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>JSON</q-item-label>
          <q-item-label caption>
            Upload json file based on template
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loader"
            val="csv"
            disable
          />
        </q-item-section>
        <q-item-section>
          <q-item-label> CSV</q-item-label>
          <q-item-label caption>
            Upload CSV file based on template
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loader"
            val="manual"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Manual</q-item-label>
          <q-item-label caption>Enter every person manually</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-stepper-navigation>
      <q-btn
        @click="emit('to', name + '_' + loader)"
        color="primary"
        label="Continue"
        :disable="loader === undefined"
      />
      <q-btn
        flat
        @click="emit('back')"
        color="primary"
        label="Back"
        class="q-ml-sm"
      />
    </q-stepper-navigation>
  </q-step>

  <q-step
    v-if="loader === 'json'"
    :name="name + '_json'"
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
          :error="inputErrorMessage !== undefined"
          :error-message="inputErrorMessage"
          @change="inputErrorMessage.value = undefined"
          :loading="fileUploadOngoing"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </div>
    </div>

    <q-stepper-navigation>
      <q-btn
        @click="processJson()"
        color="primary"
        label="Continue"
        :disable="file === undefined"
      />
      <q-btn
        flat
        @click="emit('to', name)"
        color="primary"
        label="Back"
        class="q-ml-sm"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Person } from 'src/lib/entities';
import { ref } from 'vue';
import { loadJson } from 'src/lib/import/JsonInputLoader';

interface Props {
  name: string;
  modelValue: Person[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', people: Person[]): void;
  (e: 'continue'): void;
  (e: 'back'): void;
  (e: 'to', destination: string): void;
}>();

const loader = ref<string>();
const fileUploadOngoing = ref(false);
const inputErrorMessage = ref<string>();

const file = ref();

function processJson() {
  fileUploadOngoing.value = true;
  inputErrorMessage.value = undefined;
  // TODO Input check

  loadJson(file.value)
    .then((value) => {
      emit('update:modelValue', value);
      emit('to', 'people_manual');
    })
    .catch((reason) => {
      inputErrorMessage.value = reason;
    })
    .finally(() => {
      fileUploadOngoing.value = false;
    });
}
</script>

<style scoped></style>
