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
            {{ t(`dialog.car.title.${mode}`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="name"
            :label="t('dialog.car.name.label')"
            lazy-rules
            :rules="[
              (val: string | undefined) =>
                (val && val.length > 0) ||
                t('dialog.car.name.validation.required'),
            ]"
            filled
          />

          <q-input
            v-model.number="capacity"
            type="number"
            :label="t('dialog.car.capacity.label')"
            :hint="t('dialog.car.capacity.hint')"
            lazy-rules
            :rules="[
              (val: number | undefined) =>
                (val !== undefined && val > 0) ||
                t('dialog.car.capacity.validation.number'),
            ]"
            filled
          />

          <q-checkbox
            v-model="trailerHitch"
            :label="$t('dialog.car.trailer_hitch.label')"
            :hint="$t('dialog.car.trailer_hitch.hint')"
          />

          <q-select
            v-model="allowedOperators"
            :label="t('dialog.car.allowed_operators.label')"
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
            :label="t(mode)"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Car, Person } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

interface Props {
  car?: Car;
  people: Person[];
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const name = ref<string | undefined>(props.car?.name);
const capacity = ref<number | undefined>(props.car?.capacity);
const trailerHitch = ref<boolean>(props.car?.trailerHitch ?? false);
const allowedOperators = ref<Person[]>(props.car?.allowedOperators ?? []);
const options = [...props.people]
  .sort((a, b) => a.name.localeCompare(b.name))
  .sort((a, b) => (a.supervisor == b.supervisor ? 0 : a.supervisor ? -1 : 1))
  .map((value) => {
    return {
      label: value.name,
      value: value,
    };
  });
const filterOptions = ref(options);

const mode = computed<'create' | 'edit'>(() => {
  return props.car ? 'edit' : 'create';
});

function onSubmit() {
  onDialogOK({
    name: name.value,
    capacity: capacity.value,
    allowedOperators: allowedOperators.value,
    trailerHitch: trailerHitch.value,
  });
}

function onReset() {
  name.value = undefined;
  capacity.value = undefined;
  allowedOperators.value = [];
  trailerHitch.value = false;
  onDialogCancel();
}

function filterFn(val: string, update: (a: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    filterOptions.value = options.filter(
      (value) => value.label.toLowerCase().indexOf(needle) > -1,
    );
  });
}
</script>

<style scoped></style>
