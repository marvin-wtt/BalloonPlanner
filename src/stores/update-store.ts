import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { AppUpdate } from 'app/src-common/api';
import { useQuasar } from 'quasar';

export const useUpdaterStore = defineStore('updater', () => {
  const quasar = useQuasar();

  const version = ref<string>();
  const status = ref<AppUpdate>();

  watch(status, () => {
    sendNotification();
  });

  window.appAPI
    .getVersion()
    .then((value) => (version.value = value))
    .catch((reason: unknown) => {
      console.error(`Failed to check for latest version: ${String(reason)}`);
    });

  window.appAPI.onUpdateInfo((data) => {
    status.value = data;
  });

  function sendNotification() {
    if (status.value?.name !== 'update-available') {
      return;
    }

    quasar.notify({
      color: 'primary',
      message: `New app version available`,
      caption: `${status.value.info.version} (${status.value.info.releaseDate})`,
      actions: [
        {
          icon: 'download',
          'aria-label': 'Download update',
          color: 'white',
          round: true,
          handler: window.appAPI.downloadUpdate,
        },
      ],
    });
  }

  return {
    status,
    version,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUpdaterStore, import.meta.hot));
}
