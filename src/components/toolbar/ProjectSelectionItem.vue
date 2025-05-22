<template>
  <q-btn
    :label
    :to="{ name: 'projects' }"
    class="ellipsis"
    rounded
    flat
  />
</template>

<script lang="ts" setup>
import { useProjectStore } from 'stores/project';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);

const label = computed<string>(() => {
  if (project.value == null || route.name === 'projects') {
    return t('projects');
  }

  return project.value.name;
});
</script>

<style scoped></style>
