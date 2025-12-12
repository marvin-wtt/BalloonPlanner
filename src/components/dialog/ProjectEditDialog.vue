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
        <q-card-section class="text-h6"> Edit Project </q-card-section>

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
            v-model="description"
            label="Description"
            type="textarea"
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
            label="Save"
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
import { ref, toRaw } from 'vue';
import type { ProjectMeta } from 'app/src-common/entities';
import { useDialogPluginComponent } from 'quasar';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { project = undefined } = defineProps<{
  project?: ProjectMeta;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const name = ref<string | undefined>(project?.name);
const description = ref<string | undefined>(project?.description);

function onSubmit() {
  const nameValue = toRaw(name.value)?.trim();
  if (!nameValue || nameValue.length === 0) {
    throw new Error('Name is required.');
  }

  const payload: Pick<ProjectMeta, 'name' | 'description'> = {
    name: nameValue,
    description: toRaw(description.value)?.trim(),
  };

  onDialogOK(payload);
}
</script>

<style scoped></style>
