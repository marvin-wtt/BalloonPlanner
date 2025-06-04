<template>
  <q-step
    :name
    title="Select loading method"
    icon="input"
    :done="loadingMethod !== undefined"
  >
    <q-list>
      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loadingMethod"
            val="online"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Online</q-item-label>
          <q-item-label caption>
            Download data from camp registration server
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section avatar>
          <q-radio
            v-model="loadingMethod"
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
            v-model="loadingMethod"
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
            v-model="loadingMethod"
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
        :disable="loadingMethod === undefined"
        rounded
        @click="emit('to', name + '_' + loadingMethod)"
      />
    </q-stepper-navigation>
  </q-step>

  <q-step
    v-if="loadingMethod === 'online'"
    :name="name + '_online'"
    title="Online Import"
    icon="cloud_download"
    :done="modelValue.length > 0"
  >
    <q-btn
      label="Download"
      color="primary"
      rounded
      @click="download()"
    />
  </q-step>

  <q-step
    v-if="loadingMethod === 'json'"
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
          rounded
          outlined
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
        rounded
        @click="processJson()"
      />
      <q-btn
        label="Back"
        color="primary"
        rounded
        outline
        @click="emit('to', name)"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import { ref } from 'vue';
import { loadJsonFile } from 'src/lib/JsonInputLoader';
import { useQuasar } from 'quasar';
import OnlinePeopleImportDialog from 'components/dialog/OnlinePeopleImportDialog.vue';

const quasar = useQuasar();

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'continue'): void;
  (e: 'to', destination: string): void;
}>();

const loadingMethod = ref<string>();
const fileUploadOngoing = ref(false);
const inputErrorMessage = ref<string>();

const file = ref<File>();

async function processJson() {
  fileUploadOngoing.value = true;
  inputErrorMessage.value = undefined;

  try {
    modelValue.value = await loadJsonFile(file.value);

    emit('to', 'people_manual');
  } catch (reason) {
    inputErrorMessage.value = reason.message;
  } finally {
    fileUploadOngoing.value = false;
  }
}

function download() {
  quasar
    .dialog({
      component: OnlinePeopleImportDialog,
    })
    .onOk((payload) => {
      modelValue.value = payload;
      emit('to', 'people_manual');
    })
    .onCancel(() => {
      emit('to', name);
    });
}
</script>

<style scoped></style>
