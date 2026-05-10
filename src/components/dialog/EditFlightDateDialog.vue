<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-card-section class="text-h6">Flight Date</q-card-section>

      <q-date
        v-model="date"
        first-day-of-week="1"
        minimal
      />

      <q-card-section class="q-pt-none">
        <q-btn-toggle
          v-model="period"
          spread
          no-caps
          rounded
          :options="[
            { label: 'Morning', value: 'morning' },
            { label: 'Evening', value: 'evening' },
          ]"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          label="Cancel"
          flat
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          label="Save"
          color="primary"
          rounded
          :disable="!date"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';

const { initialDate = '' } = defineProps<{
  initialDate?: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

function toPickerDate(iso?: string): string {
  if (!iso || iso.length === 0) return '';
  return iso.slice(0, 10).replace(/-/g, '/');
}

function toPeriod(iso?: string): 'morning' | 'evening' {
  if (!iso) return 'morning';
  return new Date(iso).getUTCHours() < 12 ? 'morning' : 'evening';
}

const date = ref<string>(toPickerDate(initialDate));
const period = ref<'morning' | 'evening'>(toPeriod(initialDate));

function onSubmit() {
  const utcHour = period.value === 'morning' ? 6 : 18;
  const iso = new Date(
    `${date.value.replace(/\//g, '-')}T${utcHour.toString().padStart(2, '0')}:00:00.000Z`,
  ).toISOString();
  onDialogOK(iso);
}
</script>
