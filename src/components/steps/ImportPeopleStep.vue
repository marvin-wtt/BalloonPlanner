<template>
  <q-step
    :name
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

    <q-stepper-navigation class="row q-gutter-sm">
      <q-btn
        label="Continue"
        color="primary"
        :disable="loader === undefined"
        rounded
        @click="emit('to', name + '_' + loader)"
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
          @change="inputErrorMessage = undefined"
          :loading="fileUploadOngoing"
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
        @click="processJson()"
      />
      <q-btn
        label="Back"
        color="primary"
        flat
        @click="emit('to', name)"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import { ref } from 'vue';
import { loadJson } from 'src/lib/import/JsonInputLoader';

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'continue'): void;
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
      // TODO Validate
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
