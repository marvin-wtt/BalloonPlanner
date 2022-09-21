<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-form @reset="onReset" @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="text-h6">{{ $t('dialog_edit_person_title') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- TODO unique rule -->
          <q-input
            v-model="name"
            :label="$t('name')"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.length > 0) ||
                $t('dialog_edit_person_validation_name_required'),
            ]"
            filled
          />

          <q-input
            v-model.number="flights"
            type="number"
            :label="$t('flights')"
            :hint="$t('dialog_edit_person_hint_flights')"
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== '' && val >= 0) ||
                $t('dialog_edit_vehicle_validation_capacty'),
            ]"
            filled
          />

          <q-select
            v-model="nation"
            :options="nations"
            :label="$t('nationality')"
            :rules="[
              (val) =>
                (val && nations.map(val => val.value).includes(val)) ||
                $t('dialog_edit_vehicle_validation_type'),
            ]"
            emit-value
            map-options
            filled
          />

          <q-checkbox
            v-model="supervisor"
            :label="$t('supervisor')"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            type="reset"
            color="primary"
            :label="$t('cancel')"
            v-close-popup
            flat
          />
          <q-btn type="submit" color="primary" :label="$t('create')"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Balloon, Car, Person, Vehicle } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar'

interface Props {
  mode: 'create' | 'edit',
  person?: Person;
}

const props = defineProps<Props>();

defineEmits([
  ...useDialogPluginComponent.emits
]);

// const emit = defineEmits<{
//   (e: 'update:modelValue', value: boolean): void;
//   (e: 'update:person', value: Person): void;
//   (e: 'update:people', value: Person[]): void;
// }>();

const {t} = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const name = ref(props.person?.name ?? null);
const nation = ref(props.person?.nation ?? null);
const flights = ref(props.person?.numberOfFlights ?? 0);
const supervisor = ref(props.person?.supervisor ?? false);

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
    flights: flights.value,
    supervisor: supervisor.value
  });
}

function onReset() {
  name.value = null;
  nation.value = null;
  flights.value = 0;
  supervisor.value = false;
  onDialogCancel();
}

</script>

<style scoped></style>