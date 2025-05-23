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
        <q-card-section class="text-h6">
          <template v-if="mode === 'create'">Create Car</template>
          <template v-else> Edit Car</template>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-input
            v-model="name"
            label="Name"
            lazy-rules
            :rules="[
              (val?: string | null) =>
                (!!val && val.length > 0) || 'Name is required.',
            ]"
            hide-bottom-space
            rounded
            outlined
          />

          <q-input
            v-model.number="maxCapacity"
            type="number"
            label="Maximum Capacity"
            hint="Including the pilot"
            lazy-rules
            :rules="[
              (val?: number | null) =>
                (!!val && val > 0) || 'Maximum Capacity is required.',
              (val?: string | null) =>
                !existingNames?.includes(val) || 'Name must be unique.',
            ]"
            rounded
            outlined
          />

          <q-select
            v-model="allowedOperatorIds"
            label="Allowed operators"
            use-input
            use-chips
            multiple
            input-debounce="0"
            :options="filterOptions"
            emit-value
            map-options
            @filter="filterFn"
            outlined
            rounded
          />

          <q-toggle
            v-model="hasTrailerHitch"
            label="Has trailer hitch"
          />
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
            label="Create"
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
import { computed, ref, toRaw } from 'vue';
import type { Car, Person } from 'app/src-common/entities';
import { type QSelectOption, useDialogPluginComponent } from 'quasar';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { car, people } = defineProps<{
  car?: Car;
  existingNames?: string[];
  people: Person[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const name = ref<string | undefined>(car?.name);
const maxCapacity = ref<number | undefined>(car?.maxCapacity);
const hasTrailerHitch = ref<boolean>(car?.hasTrailerClutch ?? true);
const allowedOperatorIds = ref<string[]>(car?.allowedOperatorIds ?? []);

const operatorOptions = computed<QSelectOption[]>(() => {
  return people
    .filter((value) => value.role === 'counselor')
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((value) => ({
      label: value.name,
      value: value.id,
    }));
});

const filterOptions = ref<QSelectOption[]>(operatorOptions.value);

const mode = computed<'create' | 'edit'>(() => {
  return car ? 'edit' : 'create';
});

function onSubmit() {
  const payload: Omit<Car, 'id'> = {
    type: 'car',
    name: toRaw(name.value),
    maxCapacity: toRaw(maxCapacity.value),
    allowedOperatorIds: toRaw(allowedOperatorIds.value),
    hasTrailerClutch: toRaw(hasTrailerHitch.value),
  };

  onDialogOK(payload);
}

function filterFn(val: string, update: (a: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    filterOptions.value = operatorOptions.value.filter(
      (value) => value.label.toLowerCase().indexOf(needle) > -1,
    );
  });
}
</script>

<style scoped></style>
