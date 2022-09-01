import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { Ref, ref } from 'vue';
import { Person, Vehicle } from 'src/lib/entities';

export const useProjectStore = defineStore('project', () => {

  const online: Ref<boolean> = ref(false);
  const project: Ref<Project | null> = ref(null);

  return {project};
});
