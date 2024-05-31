<template>
  <template v-if="project != null">
    <q-btn-dropdown
      :label="t('flights')"
      rounded
      flat
    >
      <!-- TODO Fix list style -->
      <q-item
        v-for="(flight, index) in project.flights"
        :key="flight.id"
        clickable
        v-close-popup
        :to="'/projects/' + project.id + '/flights/' + flight.id"
      >
        <q-item-section>{{ t('flight') }} {{ index + 1 }}</q-item-section>
        <q-item-section side>
          <q-btn
            dense
            round
            flat
            icon="more_vert"
            @click.stop
          >
            <q-menu>
              <q-list>
                <q-item
                  clickable
                  v-close-popup
                >
                  <q-item-section color="negative">
                    {{ t('delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-btn-dropdown>
    <q-separator
      dark
      vertical
      inset
    />
    <q-btn
      v-if="editable"
      icon="add"
      rounded
      flat
      dense
      :loading="addFlightLoading"
      @click="addFlight"
    />
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

  const projectPath = project.value ? `/projects/${project.value.id}` : '';
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
