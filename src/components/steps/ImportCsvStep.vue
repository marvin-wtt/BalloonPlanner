<template>
  <q-step
    :name
    title="Upload CSV File"
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
          label="Select CSV file"
          accept="text/csv"
          :error
          :error-message
          :loading
          rounded
          outlined
          @change="errorMessage = undefined"
        >
          <template #prepend>
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
        @click="processCsv()"
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
import Papa from 'papaparse';

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

async function processCsv() {
  loading.value = true;
  errorMessage.value = undefined;

  try {
    const result = await new Promise<Papa.ParseResult<unknown>>(
      (complete, error) => {
        Papa.parse(file.value, {
          header: true,
          skipEmptyLines: true,
          complete,
          error,
        });
      },
    );

    validateHeaders(result.meta.fields);
    modelValue.value = processData(result.data);

    emit('continue');
  } catch (reason) {
    errorMessage.value = reason.message;
  } finally {
    loading.value = false;
  }
}

function validateHeaders(fields: string[] | undefined) {
  if (!fields || fields.length === 0) {
    throw new Error('CSV file is empty or has no headers.');
  }

  const requiredHeaders = ['Name'];
  if (!requiredHeaders.every((header) => fields.includes(header))) {
    throw new Error(
      `CSV file is missing required headers: ${requiredHeaders.join(', ')}`,
    );
  }
}

function parseRequiredStringField(
  record: Record<string, unknown>,
  key: string,
  rowNum: number,
): string {
  const raw = record[key];
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      `Row ${rowNum}: missing or invalid "${key}". ` +
        `Expected a non‐empty string.`,
    );
  }
  return raw.trim();
}

function parseOptionalEnumField<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowedValues: readonly T[],
  defaultValue: T,
  rowNum: number,
): T {
  const raw = record[key];
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) {
    return defaultValue;
  }
  if (typeof raw !== 'string') {
    throw new Error(`Row ${rowNum}: "${key}" must be a string if provided.`);
  }
  const candidate = raw.trim().toLowerCase();
  if (!allowedValues.includes(candidate as T)) {
    throw new Error(
      `Row ${rowNum}: invalid "${key}" value "${candidate}". ` +
        `Valid options are: ${allowedValues.join(', ')}.`,
    );
  }
  return candidate as T;
}

function parseRequiredEnumField<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowedValues: readonly T[],
  rowNum: number,
): T {
  const raw = record[key];
  if (typeof raw !== 'string') {
    throw new Error(
      `Row ${rowNum}: missing or invalid "${key}". Expected one of ${allowedValues.join(', ')}.`,
    );
  }
  const candidate = raw.trim().toLowerCase();
  if (!allowedValues.includes(candidate as T)) {
    throw new Error(
      `Row ${rowNum}: invalid "${key}" value "${candidate}". ` +
        `Valid options are: ${allowedValues.join(', ')}.`,
    );
  }
  return candidate as T;
}

function parseOptionalPositiveNumberField(
  record: Record<string, unknown>,
  key: string,
  rowNum: number,
): number | undefined {
  const raw = record[key];
  if (raw == null) {
    return undefined;
  }
  let num: number;
  if (typeof raw === 'number') {
    num = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return undefined; // treat blank as “not provided”
    }
    num = Number(trimmed);
  } else {
    throw new Error(
      `Row ${rowNum}: "${key}" must be a string or number if provided.`,
    );
  }

  if (Number.isNaN(num) || num <= 0) {
    throw new Error(
      `Row ${rowNum}: "${key}" must be a positive number if provided; got "${raw}".`,
    );
  }
  return num;
}

function parseOptionalBooleanField(
  record: Record<string, unknown>,
  key: string,
  rowNum: number,
): boolean | undefined {
  const raw = record[key];
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'string') {
    const lowered = raw.trim().toLowerCase();
    if (lowered === 'true') return true;
    if (lowered === 'false') return false;
    throw new Error(
      `Row ${rowNum}: "${key}" string must be "true" or "false" (case-insensitive); got "${raw}".`,
    );
  }

  return undefined;
}

function processData(data: unknown[]): Person[] {
  const ALLOWED_ROLES = ['participant', 'counselor'] as const;
  const ALLOWED_NATIONALITIES = ['de', 'fr'] as const;

  return data.map((item, index) => {
    const rowNum = index + 1;

    // 1) Ensure it’s an object
    if (typeof item !== 'object' || item == null || Array.isArray(item)) {
      throw new Error(
        `Row ${rowNum}: expected an object, but got ${typeof item}.`,
      );
    }
    const record = item as Record<string, unknown>;

    const id =
      parseRequiredStringField(record, 'Id', rowNum) ?? crypto.randomUUID();
    const name = parseRequiredStringField(record, 'Name', rowNum);
    const role = parseOptionalEnumField(
      record,
      'Role',
      ALLOWED_ROLES,
      'participant',
      rowNum,
    );

    const nationality = parseRequiredEnumField(
      record,
      'Nationality',
      ALLOWED_NATIONALITIES,
      rowNum,
    );
    const weight = parseOptionalPositiveNumberField(record, 'Weight', rowNum);
    const firstTime = parseOptionalBooleanField(record, 'FirstFlight', rowNum);

    return {
      id,
      name,
      role,
      nationality,
      weight,
      firstTime,
    };
  });
}
</script>

<style scoped></style>
