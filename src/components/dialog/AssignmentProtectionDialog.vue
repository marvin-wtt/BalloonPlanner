<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6">
        Assignment differs from previous leg
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-body2">
          You are assigning this person to a different vehicle group than the
          one they were part of in the previous flight leg.
        </div>

        <div class="text-body2 q-mt-sm">
          Keeping people in the same group across legs makes the plan easier to
          follow. Moving them here breaks that consistency.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-checkbox
          v-model="disableProtection"
          label="Don’t show this warning again"
          :value="true"
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          label="Cancel"
          rounded
          flat
          color="primary"
          @click="onDialogCancel"
        />
        <q-btn
          label="Continue"
          color="primary"
          rounded
          unelevated
          @click="onOk"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useProjectSettings } from '@/composables/projectSettings';
import { ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { disableAssignmentProtection } = useProjectSettings();
const disableProtection = ref<boolean>(false);

function onOk() {
  disableAssignmentProtection.value = disableProtection.value;
  onDialogOK();
}
</script>

<style scoped></style>
