<template>
  <template v-if="project != null">
    <q-btn
      stretch
      flat
      icon="add"
      :loading="addFlightLoading"
      @click="addFlight"
      v-if="editable"
    />
    <q-separator dark vertical />
    <q-btn-dropdown stretch flat :label="t('flights')">
      <!-- TODO Fix list style -->
      <q-item
        v-for="(flight, index) in project.flights"
        :key="flight.id"
        clickable
        v-close-popup
        :to="'/projects/' + project.id + '/flights/' + flight.id"
      >
        <q-item-section>{{ $t('flight') }} {{ index + 1 }}</q-item-section>
        <q-item-section side>
          <q-btn dense round flat icon="more_vert">
            <q-menu auto-close>
              <!-- Move, delete -->
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-btn-dropdown>
    <q-separator dark vertical />
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const { t } = useI18n();

const { project } = storeToRefs(projectStore);
const addFlightLoading = ref(false);

const editable = computed<boolean>(() => {
  if (!authStore.user || !project.value) {
    return false;
  }

  const userId = authStore.user.email ?? authStore.user.id;
  return project.value.collaborators.includes(userId);
});

function addFlight() {
  addFlightLoading.value = true;

  const projectPath = project.value ? `/projects/${project.value!.id}` : '';
  projectStore
    .createFlight()
    .then((flight) => {
      router.push({
        path: `${projectPath}/flights/${flight.id}`,
      });
    })
    .catch(() => {
      // TODO error
    })
    .finally(() => {
      addFlightLoading.value = false;
    });
}
</script>

<style scoped></style>
