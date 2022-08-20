<template>
  <q-page class="row items-center justify-evenly">
    <router-link to="/projects/1">Test</router-link>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Project } from 'src/lib/entities';
import { useProjectStore } from 'stores/project-store';

export default defineComponent({
  name: 'IndexPage',
  components: {},
  setup() {
    const project = new Project();

    const store = useProjectStore();
    store.project = project;

    return {};
  },
});
</script>
