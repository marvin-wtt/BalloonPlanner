import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const indexedVehicle = ref<boolean>(true);
  const labeledVehicle = ref<boolean>(true);

  // TODO load and store

  return {
    indexedVehicle,
    labeledVehicle
  };
});
