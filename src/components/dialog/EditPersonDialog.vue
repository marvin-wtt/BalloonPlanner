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
          <template v-if="mode === 'create'">Create Person</template>
          <template v-else>Edit Person</template>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <q-input
            v-model="newPerson.name"
            label="Name"
            lazy-rules
            :rules="[
              (val?: string | null) =>
                (!!val && val.length > 0) || 'Name is required.',
              (val: string) => nameIsUnique(val) || 'Name must be unique.',
            ]"
            hide-bottom-space
            outlined
            rounded
          />

          <q-select
            v-model="newPerson.nationality"
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

          <q-select
            v-model="newPerson.languages"
            label="Languages"
            :options="languagesOptions"
            hint="Optional"
            multiple
            emit-value
            map-options
            use-chips
            hide-bottom-space
            outlined
            rounded
          />

          <q-toggle
            v-model="newPerson.firstTime"
            label="Is first time"
            toggle-indeterminate
          />

          <q-input
            v-model.number="newPerson.weight"
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
            v-model="newPerson.role"
            label="Role"
            :options="roleOptions"
            :disable="!!role"
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
import { computed, reactive } from 'vue';
import type { Person, PersonRole } from 'app/src-common/entities';
import { useDialogPluginComponent } from 'quasar';

const {
  person = undefined,
  role = undefined,
  existingNames = [],
} = defineProps<{
  person?: Person;
  role?: PersonRole;
  existingNames?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const newPerson = reactive<Partial<Person>>({
  name: person?.name ?? undefined,
  nationality: person?.nationality ?? undefined,
  role: person?.role ?? role ?? 'participant',
  weight: person?.weight ?? undefined,
  firstTime: person?.firstTime ?? undefined,
  languages: person?.languages ?? undefined,
});

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

const languagesOptions = [
  {
    label: 'German',
    value: 'de',
  },
  {
    label: 'French',
    value: 'fr',
  },
  {
    label: 'English',
    value: 'en',
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
  onDialogOK(newPerson);
}

function nameIsUnique(name: string): boolean {
  name = name.trim().toLowerCase();
  if (name === person?.name.toLowerCase()) {
    return true;
  }

  return !existingNames.some((existingName) => {
    return existingName.toLowerCase() === name;
  });
}
</script>

<style scoped></style>
