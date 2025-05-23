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
          <template v-if="mode === 'create'"> Create Person</template>
          <template v-else> Edit Person</template>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-input
            v-model="name"
            label="Name"
            lazy-rules
            :rules="[
              (val?: string | null) =>
                (!!val && val.length > 0) || 'Name is required.',
              (val?: string | null) =>
                nameIsUnique(val) || 'Name must be unique.',
            ]"
            hide-bottom-space
            outlined
            rounded
          />

          <q-select
            v-model="nationality"
            label="Nationality"
            :options="nationalityOptions"
            emit-value
            map-options
            :rules="[
              (val?: string | null) => !!val || 'Nationality is required.',
            ]"
            hide-bottom-space
            outlined
            rounded
          />

          <q-input
            v-model.number="weight"
            type="number"
            label="Weight"
            hint="Optional"
            suffix=" kg"
            lazy-rules
            :rules="[
              (val?: number | null) =>
                !val || val > 0 || 'Weight must be greater than 0.',
            ]"
            clearable
            rounded
            outlined
          />

          <q-select
            v-model="role"
            label="Role"
            :options="roleOptions"
            emit-value
            map-options
            :rules="[(val?: string | null) => !!val || 'Role is required.']"
            hide-bottom-space
            outlined
            rounded
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
import type { Person, PersonRole } from 'app/src-common/entities';
import { useDialogPluginComponent } from 'quasar';

const { person, existingNames } = defineProps<{
  person?: Person;
  existingNames?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const name = ref<string>(person?.name ?? null);
const nationality = ref<string>(person?.nationality ?? null);
const role = ref<PersonRole>(person?.role ?? 'participant');
const weight = ref<number>(person?.weight ?? undefined);

const mode = computed<'create' | 'edit'>(() => {
  return person ? 'edit' : 'create';
});

const nationalityOptions = [
  {
    label: 'German',
    value: 'de',
  },
  {
    label: 'French',
    value: 'fr',
  },
];

const roleOptions = [
  {
    label: 'Counselor',
    value: 'counselor',
  },
  {
    label: 'Participant',
    value: 'participant',
  },
];

function onSubmit() {
  const payload: Omit<Person, 'id'> = {
    name: toRaw(name.value).trim(),
    nationality: toRaw(nationality.value),
    role: toRaw(role.value),
    weight: toRaw(weight.value) ?? undefined,
  };

  onDialogOK(payload);
}

function nameIsUnique(name: string): boolean {
  name = name.trim().toLowerCase();
  if (name === person?.name.toLowerCase()) {
    return true;
  }

  return !existingNames?.some((existingName) => {
    return existingName.toLowerCase() === name;
  });
}
</script>

<style scoped></style>
