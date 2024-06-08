<template>
  <template v-if="project != null">
    <q-btn-dropdown
      :label="label"
      rounded
      flat
    >
      <!-- TODO Fix list style -->
      <q-item
        v-for="(flight, index) in project.flights"
        :key="flight.id"
        clickable
        v-close-popup
        :to="{
          name: 'flight',
          params: {
            projectId: project.id,
            flightId: flight.id,
          },
        }"
      >
        <q-item-section>{{ flightName(index) }}</q-item-section>
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
import { useFlightStore } from 'stores/flight';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const flightStore = useFlightStore();
const { t } = useI18n();

const { project } = storeToRefs(projectStore);
const { flight } = storeToRefs(flightStore);
const addFlightLoading = ref(false);

const label = computed<string>(() => {
  const flightId = flight.value?.id;
  if (!project.value || !flightId) {
    return t('flight', 2);
  }

  return flightName(
    project.value.flights.findIndex((value) => value.id === flightId),
  );
});

function flightName(index: number): string {
  return `${t('flight')} ${index + 1}`;
}

const editable = computed<boolean>(() => {
  if (!authStore.user || !project.value) {
    return false;
  }

  const userId = authStore.user.email ?? authStore.user.id;
  return project.value.collaborators.includes(userId);
});

async function addFlight() {
  addFlightLoading.value = true;

  if (!project.value) {
    return false;
  }

  const projectId = project.value.id;
  const flight = await flightStore.create();
  await router.push({
    name: 'flight',
    params: {
      projectId,
      flightId: flight.id,
    },
  });
  addFlightLoading.value = false;
}
</script>

<style scoped></style>
