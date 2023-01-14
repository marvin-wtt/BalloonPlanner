import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const indexedVehicle = ref<boolean>(true);
  const labeledVehicle = ref<boolean>(true);
  const presentation = ref<boolean>(false);

  // TODO load and store

  return {
    indexedVehicle,
    labeledVehicle,
    presentation,
  };
});
