import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { Ref, ref } from 'vue';

export const useProjectStore = defineStore('project', () => {
  const project: Ref<Project | null> = ref(null);

  return { project };
});
