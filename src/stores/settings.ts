import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const indexedVehicle = ref<boolean>(true);
  const labeledVehicle = ref<boolean>(true);
  const showNumberOfFlights = ref<boolean>(true);
  const presentation = ref<boolean>(false);

  // TODO load and store

  return {
    showNumberOfFlights,
    indexedVehicle,
    labeledVehicle,
    presentation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
