<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6">
        Change affects other flight legs
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-body2">
          You are modifying the vehicle arrangement in this vehicle group while
          multiple flight legs are already planned.
        </div>

        <div class="text-body2 q-mt-sm">
          To keep the plan consistent, this action will clear passenger and
          operator assignments for the affected vehicles in all other flight
          legs.
        </div>

        <div class="text-body2 q-mt-sm">
          If you want to avoid these side effects, consider creating a new
          flight series or detaching this leg from the current series before
          proceeding.
        </div>

        <div class="text-body2 q-mt-sm text-negative">
          These changes cannot be undone automatically.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-checkbox
          v-model="disableProtection"
          label="Don’t show this warning again"
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
import { useProjectSettings } from 'src/composables/projectSettings';
import { ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { disableVehicleGroupProtection } = useProjectSettings();

const disableProtection = ref<boolean>(false);

function onOk() {
  disableVehicleGroupProtection.value = disableProtection.value;
  onDialogOK();
}
</script>

<style scoped></style>
