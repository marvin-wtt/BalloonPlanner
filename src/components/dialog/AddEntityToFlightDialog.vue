<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 300px">
      <q-card-section class="text-h6">
        {{ `Add ${itemName} from Project` }}
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-y-md">
        <q-list>
          <q-item v-if="items.length === 0">
            <q-item-section>
              <q-item-label>
                {{ `All ${itemName}s already present in flight` }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            v-for="item in items"
            :key="item.id"
            tag="label"
            v-ripple
          >
            <q-item-section
              side
              top
            >
              <q-checkbox
                v-model="selectedIds"
                :val="item.id"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ item.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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
          @click="onDialogCancel"
        />
        <q-btn
          label="Add"
          type="submit"
          color="primary"
          :disable="selectedIds.length === 0"
          rounded
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" generic="T extends Identifiable & { name: string }" setup>
import type { Identifiable } from 'app/src-common/entities';
import { useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const selectedIds = ref<string[]>([]);

const { items, itemName } = defineProps<{
  items: T[];
  itemName: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

function onSubmit() {
  onDialogOK(selectedIds.value);
}
</script>

<style scoped></style>
