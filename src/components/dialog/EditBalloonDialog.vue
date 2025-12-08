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
          <template v-if="mode === 'create'">Create Balloon</template>
          <template v-else> Edit Balloon</template>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-input
            v-model="newBalloon.name"
            label="Name"
            lazy-rules
            :rules="[
              (val?: string | null) =>
                (!!val && val.length > 0) || 'Name is required.',
              (val?: string | null) =>
                nameIsUnique(val) || 'Name must be unique.',
            ]"
            hide-bottom-space
            rounded
            outlined
          />

          <q-input
            v-model.number="newBalloon.maxCapacity"
            type="number"
            label="Maximum Capacity"
            hint="Including the pilot"
            lazy-rules
            :rules="[
              (val?: number | null) =>
                (!!val && val > 0) || 'Maximum Capacity is required.',
            ]"
            rounded
            outlined
          />

          <q-input
            v-model.number="newBalloon.maxWeight"
            type="number"
            label="Maximum Weight"
            hint="Optional"
            suffix=" kg"
            lazy-rules
            :rules="[
              (val?: number | null) =>
                !val || val > 0 || 'Max weight must be greater than 0.',
            ]"
            clearable
            rounded
            outlined
          />

          <q-select
            v-model="newBalloon.allowedOperatorIds"
            label="Allowed operators"
            use-input
            use-chips
            multiple
            input-debounce="0"
            :options="filterOptions"
            emit-value
            map-options
            outlined
            rounded
            @filter="filterFn"
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
            :label="mode === 'create' ? 'Create' : 'Save'"
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
import { computed, reactive, ref } from 'vue';
import type { Person, Balloon } from 'app/src-common/entities';
import { useDialogPluginComponent, type QSelectOption } from 'quasar';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const {
  people,
  balloon = undefined,
  existingNames = [],
} = defineProps<{
  balloon?: Balloon;
  existingNames?: string[];
  people: Person[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const newBalloon = reactive<Partial<Balloon>>({
  name: balloon?.name ?? null,
  maxCapacity: balloon?.maxCapacity ?? null,
  maxWeight: balloon?.maxWeight ?? null,
  allowedOperatorIds: balloon?.allowedOperatorIds ?? [],
});

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
  return balloon ? 'edit' : 'create';
});

function onSubmit() {
  const payload: Omit<Balloon, 'id'> = {
    ...newBalloon,
    type: 'balloon',
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

function nameIsUnique(name: string): boolean {
  name = name.trim().toLowerCase();
  if (name === balloon?.name.toLowerCase()) {
    return true;
  }

  return !existingNames.some((existingName) => {
    return existingName.toLowerCase() === name;
  });
}
</script>

<style scoped></style>
