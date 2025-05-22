<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-form
        @reset="onReset"
        @submit="onSubmit"
        class="q-gutter-md"
      >
        <q-card-section>
          <div class="text-h6">
            {{ t('dialog.import_person.title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-stepper
            v-model="step"
            ref="stepper"
            color="primary"
            animated
          >
            <q-step
              :name="1"
              title="Select input method"
              icon="radio_button_unchecked"
              :done="step > 1"
            >
              <q-list>
                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="method"
                      val="online"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Online from Ballaeron</q-item-label>
                    <q-item-label caption
                      >Requires login credentials
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="method"
                      val="csv"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>CSV</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-radio
                      v-model="method"
                      val="json"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>JSON</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-step>

            <q-step
              :name="2"
              title="Load data"
              icon="cloud_upload"
              :done="step > 2"
            >
              TODO Select upload method
            </q-step>

            <q-step
              :name="3"
              title=""
              icon="cloud_upload"
              :done="step > 3"
            >
              TODO Select upload method
            </q-step>

            <q-step
              :name="4"
              title="Load data"
              icon="cloud_upload"
              :done="step > 4"
            >
              TODO Select upload method
            </q-step>
          </q-stepper>

          <!-- TODO unique rule -->
          <q-input
            v-model="name"
            :label="t('dialog.person.name.label')"
            lazy-rules
            :rules="[
              (val: string | undefined) =>
                (val && val.length > 0) ||
                t('dialog.person.name_validation.required'),
            ]"
            filled
          />

          <q-select
            v-model="nation"
            :options="nations"
            :label="t('nationality')"
            :rules="[
              (val: string | undefined) =>
                (val && nations.map((val) => val.value).includes(val)) ||
                t('dialog.person.nationality.validation.type'),
            ]"
            emit-vaue
            map-options
            filled
          />

          <q-checkbox
            v-model="supervisor"
            :label="t('dialog.person.supervisor.label')"
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            type="reset"
            color="primary"
            :label="t('cancel')"
            v-close-popup
            flat
          />
          <q-btn
            type="submit"
            color="primary"
            :label="t('create')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { Person } from 'app/src-common/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { person } = defineProps<{
  person?: Person;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const step = ref(1);

const method = ref<string>();

const name = ref(person?.name ?? null);
const nation = ref(person?.nationality ?? null);
const supervisor = ref(person?.role === 'counselor');

const nations = [
  {
    label: t('german'),
    value: 'de',
  },
  {
    label: t('france'),
    value: 'fr',
  },
];

function onSubmit() {
  onDialogOK({
    name: name.value,
    nation: nation.value,
    supervisor: supervisor.value,
  });
}

function onReset() {
  name.value = null;
  nation.value = null;
  supervisor.value = false;
  onDialogCancel();
}
</script>

<style scoped></style>
