<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 400px; max-width: 400px">
      <q-form
        @reset="onDialogCancel"
        @submit="onSubmit"
      >
        <q-card-section class="text-h6">Smart Fill</q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-list
            v-if="isFirstLeg"
            dense
          >
            <q-item>
              <q-item-section>
                <q-item-label> Planning Horizon Depth </q-item-label>
                <q-item-label caption>
                  Amount of legs to plan ahead.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-slider
                  v-model="options.planningHorizonDepth"
                  markers
                  marker-labels
                  snap
                  :min="0"
                  :max="3"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <q-expansion-item label="Advanced Options">
            <q-list>
              <q-expansion-item
                label="Parameters"
                group="options"
                :header-inset-level="0.2"
                :content-inset-level="0.4"
              >
                <q-list>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.counselorFlightDiscount"
                        label="Counselor Flight Disadvantage over Participants"
                        hint="Value is subtracted from actual counselor flights"
                        type="number"
                        step="1"
                        :rules="[]"
                        hide-bottom-space
                        clearable
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
              <q-expansion-item
                label="Constrains"
                group="options"
                :header-inset-level="0.2"
                :content-inset-level="0.4"
              >
                <q-list>
                  <q-item
                    v-ripple
                    tag="label"
                  >
                    <q-item-section>
                      <q-item-label>
                        Common language between pilot and passengers
                      </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-toggle
                        v-model="options.constrains.commonLanguageOperators"
                        color="primary"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    tag="label"
                  >
                    <q-item-section>
                      <q-item-label>
                        Common language between operators
                      </q-item-label>
                      <q-item-label caption> For a group </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-toggle
                        v-model="options.constrains.commonLanguageOperators"
                        color="primary"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
              <q-expansion-item
                label="Weights"
                group="options"
                :header-inset-level="0.2"
                :content-inset-level="0.4"
              >
                <q-list>
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
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.passengerFairness"
                        label="Passenger Fairness"
                        hint="Higher values try to equalize participant flights"
                        type="number"
                        step="1"
                        :rules="[signedIntegerRule]"
                        hide-bottom-space
                        clearable
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.tiebreakFairness"
                        label="Tiebreak Fairness"
                        hint="Higher values try to prioritize randomness in ties"
                        type="number"
                        step="1"
                        :rules="[signedIntegerRule]"
                        hide-bottom-space
                        clearablex
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.groupRotation"
                        label="Vehicle Rotation"
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
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.groupPassengerBalance"
                        label="Group Passenger Distribution"
                        hint="Higher values try to equalize amount of group member"
                        type="number"
                        step="1"
                        :rules="[signedIntegerRule]"
                        hide-bottom-space
                        clearable
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="(options.weights.lowFlightsLookahead ?? 0) > 0">
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.lowFlightsLookahead"
                        label="Future Leg Fairness"
                        hint="Higher values try to equalize participant flights in future legs"
                        step="1"
                        :rules="[signedIntegerRule]"
                        hide-bottom-space
                        clearable
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.pilotFairness"
                        label="Pilot Fairness"
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
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.noSoloParticipant"
                        label="No Solo Participants"
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
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.meetingNewPeople"
                        label="Meeting New People"
                        hint="Higher values try to maximize new people met in vehicles"
                        type="number"
                        step="1"
                        :rules="[signedIntegerRule]"
                        hide-bottom-space
                        clearable
                        dense
                        outlined
                        rounded
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model.number="options.weights.diverseNationalities"
                        label="Nationality Diversity"
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
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
              <q-expansion-item
                label="Configuration"
                group="options"
                :header-inset-level="0.2"
                :content-inset-level="0.4"
              >
                <q-list>
                  <q-item>
                    <q-item-section>
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
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-expansion-item>
            </q-list>
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
import type { SolveFlightLegOptions } from 'app/src-common/api/solver.api';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);

const { isFirstLeg = true } = defineProps<{
  isFirstLeg?: boolean;
}>();

type Require<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

const options = reactive<
  Require<SolveFlightLegOptions, 'weights' | 'constrains'>
>({
  planningHorizonDepth: 0,
  weights: {},
  constrains: {},
});

const signedIntegerRule = (val?: number): boolean | string => {
  return !val || Number.isInteger(val) || 'Value must be an integer';
};

function onSubmit() {
  onDialogOK({
    ...toRaw(options),
  });
}
</script>

<style scoped></style>
