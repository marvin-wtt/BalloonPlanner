import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const indexedVehicle = ref<boolean>(false);

  return {
    indexedVehicle,
  };
});