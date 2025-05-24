import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const showVehicleIndex = ref<boolean>(true);
  const showVehicleLabel = ref<boolean>(true);
  const showNumberOfFlights = ref<boolean>(true);
  const showPersonWeight = ref<boolean>(false);
  const showVehicleWeight = ref<boolean>(false);
  const isPresentationMode = ref<boolean>(false);

  // TODO load and store

  return {
    showNumberOfFlights,
    showPersonWeight,
    showVehicleWeight,
    showVehicleIndex,
    showVehicleLabel,
    isPresentationMode,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
