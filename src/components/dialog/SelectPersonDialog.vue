<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-list>
        <q-expansion-item
          :label="t('counselor', 2)"
          icon="supervisor_account"
          group="people"
        >
          <q-list>
            <q-item
              v-for="person in counselors"
              :key="person.id"
              clickable
              @click="onSelection(person)"
            >
              <q-item-section>{{ person.name }}</q-item-section>
              <q-item-section side>{{ person.numberOfFlights }}</q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
        <q-expansion-item
          :label="t('participant', 2)"
          icon="group"
          group="people"
          default-opened
        >
          <q-list>
            <q-item
              v-for="person in participants"
              :key="person.id"
              clickable
              @click="onSelection(person)"
            >
              <q-item-section>{{ person.name }}</q-item-section>
              <q-item-section side>{{ person.numberOfFlights }}</q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import type { Person } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const { participants, counselors } = defineProps<{
  participants: Person[];
  counselors: Person[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

function onSelection(person: Person) {
  onDialogOK(person);
}
</script>

<style scoped></style>
