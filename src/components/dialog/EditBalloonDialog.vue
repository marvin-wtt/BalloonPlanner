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
            {{ t(`dialog.balloon.title.${mode}`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="name"
            :label="t('dialog.balloon.name.label')"
            lazy-rules
            :rules="[
              (val: string | undefined) =>
                (val && val.length > 0) ||
                t('dialog.balloon.name.validation.required'),
            ]"
            filled
          />

          <q-input
            v-model.number="capacity"
            type="number"
            :label="t('dialog.balloon.capacity.label')"
            :hint="t('dialog.balloon.capacity.hint')"
            lazy-rules
            :rules="[
              (val: number | undefined) =>
                (val !== undefined && val > 0) ||
                t('dialog.balloon.capacity.validation.number'),
            ]"
            filled
          />

          <q-select
            v-model="allowedOperators"
            :label="t('dialog.balloon.allowed_operators.label')"
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
import type { Person, Balloon } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

interface Props {
  balloon?: Balloon;
  people: Person[];
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const name = ref<string | undefined>(props.balloon?.name);
const capacity = ref<number | undefined>(props.balloon?.capacity);
const allowedOperators = ref<Person[]>(props.balloon?.allowedOperators ?? []);
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
  return props.balloon ? 'edit' : 'create';
});

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
    const needle = val.toLowerCase();
    filterOptions.value = options.filter(
      (value) => value.label.toLowerCase().indexOf(needle) > -1,
    );
  });
}
</script>

<style scoped></style>
