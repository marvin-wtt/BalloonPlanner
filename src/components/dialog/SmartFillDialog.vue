<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 300px">
      <q-form
        @reset="onDialogCancel"
        @submit="onSubmit"
      >
        <q-card-section class="text-h6"> Smart Fill </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-select
            v-model="options.leg"
            label="Flight Leg"
            :options="flightLegOptions"
            emit-value
            map-options
            outlined
            rounded
          />

          <q-expansion-item label="Advanced Options">
            <div class="column q-gutter-sm">
              <q-item dense>
                <q-item-section>
                  <q-item-label>
                    Usual weights are between 0 and 50</q-item-label
                  >
                  <q-item-label caption>
                    Zero disables an optimization
                  </q-item-label>
                  <q-item-label caption>
                    Negative weights result in the reverse action
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-input
                v-model.number="options.wPassengerFairness"
                label="Passenger Fairness Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearablex
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.counselorFlightDiscount"
                label="Counselor Flight Disadvantage over Participants"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.wClusterPassengerBalance"
                label="Group Passenger Distribution Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-if="options.leg != null"
                v-model.number="options.wSecondLegFairness"
                label="Second Leg Fairness Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-if="options.leg != null"
                v-model.number="options.wSecondLegOverweight"
                label="Second Leg Overweight Penalty Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.wPilotFairness"
                label="Pilot Fairness Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.wVehicleRotation"
                label="Vehicle Rotation Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.wNoSoloParticipant"
                label="No Solo Participants Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.wNationalityDiversity"
                label="Nationality Diversity Weight"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
              <q-input
                v-model.number="options.timeLimit"
                label="Time Limit (seconds)"
                type="number"
                step="1"
                :rules="[signedIntegerRule]"
                hide-bottom-space
                clearable
                dense
                outlined
                rounded
              />
            </div>
          </q-expansion-item>
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            label="Cancel"
            type="reset"
            color="primary"
            rounded
            outline
          />
          <q-btn
            label="Smart Fill"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive, toRaw } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { SmartFillOptions } from 'app/src-common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);

const options = reactive<SmartFillOptions>({
  flightLeg: null,
});

const flightLegOptions = [
  { label: 'None', value: null },
  { label: 'First', value: 'first' },
  { label: 'Second', value: 'second' },
];

const signedIntegerRule = (val?: number): boolean | string => {
  return !val || Number.isInteger(val) || 'Must be an integer';
};

function onSubmit() {
  onDialogOK(toRaw(options));
}
</script>

<style scoped></style>
