<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-form @reset="onReset" @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="text-h6">
            {{ $t('dialog.vehicle.title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-if="type === undefined"
            v-model="vehicleType"
            :options="vehicleTypes"
            :label="$t('dialog.vehicle.type.label')"
            :rules="[
              (val) =>
                (val && vehicleTypes.map((val) => val.value).includes(val)) ||
                $t('dialog.vehicle.validation.required'),
            ]"
            emit-value
            map-options
            filled
          />

          <!-- TODO unique rule -->
          <q-input
            v-model="name"
            :label="$t('dialog.vehicle.name.label')"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.length > 0) ||
                $t('dialog.vehicle.name.validation.required'),
            ]"
            filled
          />

          <q-input
            v-model.number="capacity"
            type="number"
            :label="$t('dialog.vehicle.capacity.label')"
            :hint="$t('dialog.vehicle.capacity.hint')"
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== '' && val > 0) ||
                $t('dialog.vehicle.capacity.validation.number'),
            ]"
            filled
          />

          <q-select
            v-model="allowedOperators"
            :label="$t('dialog.vehicle.allowed_operators.label')"
            use-input
            use-chips
            multiple
            input-debounce="0"
            :options="filterOptions"
            @filter="filterFn"
            style="width: 250px"
            emit-value
            map-options
            filled
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
          <q-btn type="submit" color="primary" :label="$t('create')" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Person, Vehicle } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

interface Props {
  type?: 'balloon' | 'car';
  vehicle?: Vehicle;
  people: Person[];
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const name = ref(props.vehicle?.name);
const capacity = ref(props.vehicle?.capacity);
const allowedOperators = ref(props.vehicle?.allowedOperators);

const filterOptions = ref();
const vehicleType = ref(props.type);
const vehicleTypes = [
  {
    label: t('balloon'),
    value: 'balloon',
  },
  {
    label: t('car'),
    value: 'car',
  },
];

function onSubmit() {
  onDialogOK({
    name: name.value,
    capacity: capacity.value,
    allowedOperators: allowedOperators.value,
  });
}

function onReset() {
  name.value = undefined;
  capacity.value = undefined;
  allowedOperators.value = [];
  onDialogCancel();
}

function filterFn(val: string, update: (a: () => void) => void) {
  update(() => {
    let filter: Person[];
    if (val === '') {
      filter = props.people;
    } else {
      const needle = val.toLowerCase();
      filter = props.people.filter(
        (v) => v.name.toLowerCase().indexOf(needle) > -1
      );
    }

    filter.sort((a, b) => a.name.localeCompare(b.name));
    filter.sort((a, b) =>
      a.supervisor == b.supervisor ? 0 : a.supervisor ? -1 : 1
    );

    filterOptions.value = filter.map((value) => {
      return {
        label: value.name,
        value: value,
      };
    });
  });
}
</script>

<style scoped></style>
