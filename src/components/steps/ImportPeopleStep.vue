<template>
  <q-step
    :name
    title="Select loading method"
    icon="input"
    :done="loadingMethod !== undefined"
  >
    <q-list style="max-width: 300px">
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
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>CSV</q-item-label>
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

  <import-json-step
    v-if="loadingMethod === 'json'"
    v-model="modelValue"
    :name="name + '_json'"
    @to="(destination) => emit('to', destination)"
    @continue="emit('continue')"
    @back="emit('to', name)"
  />

  <import-online-steps
    v-if="loadingMethod === 'online'"
    v-model="modelValue"
    :name="name + '_online'"
    @to="(destination) => emit('to', destination)"
    @continue="emit('continue')"
    @back="emit('to', name)"
  />

  <import-csv-step
    v-if="loadingMethod === 'csv'"
    v-model="modelValue"
    :name="name + '_csv'"
    @to="(destination) => emit('to', destination)"
    @continue="emit('continue')"
    @back="emit('to', name)"
  />
</template>

<script lang="ts" setup>
import type { Person } from 'app/src-common/entities';
import { ref } from 'vue';
import ImportOnlineSteps from 'components/steps/ImportOnlineSteps.vue';
import ImportJsonStep from 'components/steps/ImportJsonStep.vue';
import ImportCsvStep from 'components/steps/ImportCsvStep.vue';

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'continue'): void;
  (e: 'to', destination: string): void;
}>();

const loadingMethod = ref<string>();
</script>

<style scoped></style>
