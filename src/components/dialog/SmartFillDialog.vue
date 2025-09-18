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
        <q-card-section class="text-h6">Smart Fill</q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-toggle
            v-if="firstLeg && !hasSuccessorLeg"
            v-model="moreLegsPlanned"
            label="More legs planned"
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
                v-model.number="options.passengerFairness"
                label="Passenger Fairness Weight"
                hint="Higher values try to equalize participant flights"
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
                v-model.number="options.groupRotation"
                label="Vehicle Rotation Weight"
                hint="Higher values try to rotate people through different balloons"
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
                v-model.number="options.counselorFlightDiscount"
                label="Counselor Flight Disadvantage over Participants"
                hint="Value is subtracted from actual counselor flights"
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
                v-model.number="options.groupPassengerBalance"
                label="Group Passenger Distribution Weight"
                hint="Higher values try to equalize group member flights"
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
                v-model.number="options.lowFlightsLookahead"
                label="Future Leg Fairness Weight"
                hint="Higher values try to equalize participant flights in future legs"
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
                v-model.number="options.overweightLookahead"
                label="Second Leg Overweight Penalty Weight"
                hint="Higher values try to avoid overweight balloons in future legs"
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
                v-model.number="options.pilotFairness"
                label="Pilot Fairness Weight"
                hint="Higher values try to equalize pilot flights"
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
                v-model.number="options.noSoloParticipant"
                label="No Solo Participants Weight"
                hint="Higher values try to avoid solo participants in vehicles"
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
                v-model.number="options.diverseNationalities"
                label="Nationality Diversity Weight"
                hint="Higher values try to equalize nationalities in vehicles"
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
                hint="Maximum time to spend on optimization"
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
import { reactive, ref, toRaw } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { SolveFlightLegOptions } from 'app/src-common/api/solver.api';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);

const { firstLeg, hasSuccessorLeg } = defineProps<{
  firstLeg: boolean;
  hasSuccessorLeg: boolean;
}>();

const options = reactive<SolveFlightLegOptions>({});
const moreLegsPlanned = ref<boolean>(hasSuccessorLeg);

const signedIntegerRule = (val?: number): boolean | string => {
  return !val || Number.isInteger(val) || 'Must be an integer';
};

function onSubmit() {
  onDialogOK({
    ...toRaw(options),
    leg: !firstLeg ? 'second' : moreLegsPlanned.value ? 'first' : null,
  });
}
</script>

<style scoped></style>
