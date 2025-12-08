<template>
  <q-btn
    v-bind="attrs"
    :icon
  >
    <slot />
    <q-menu
      v-model="menuOpen"
      anchor="bottom end"
      self="top right"
      style="min-width: 200px"
    >
      <div class="column no-wrap q-pa-md q-gutter-y-sm">
        <div
          v-if="status?.name === 'checking-for-update'"
          class="column"
        >
          <a class="q-mb-sm">Searching for updates...</a>

          <q-linear-progress
            rounded
            indeterminate
          />
        </div>

        <!-- update-available -->
        <div
          v-else-if="status?.name === 'update-available'"
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <div class="column">
            New update available!

            <div class="text-caption">
              {{ status.info.version }} / {{ updateSize(status.info) }}
            </div>
          </div>

          <q-btn
            aria-label="Download"
            icon="download"
            dense
            rounded
            color="primary"
            class="self-center"
            @click="downloadUpdate"
          />
        </div>

        <!-- update-not-available -->
        <div
          v-else-if="status?.name === 'update-not-available'"
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <div class="column">
            App is up to date!

            <div class="text-caption">v{{ status.info.version }}</div>
          </div>

          <q-btn
            aria-label="Check for updates"
            icon="sync"
            rounded
            dense
            color="primary"
            class="self-center"
            @click="checkForUpdates"
          />
        </div>

        <!-- download-progress -->
        <div
          v-else-if="status?.name === 'download-progress'"
          class="column no-wrap q-gutter-y-xs"
        >
          Downloading update...

          <div class="text-right text-caption">
            {{ humanStorageSize(status.info.transferred) }} /
            {{ humanStorageSize(status.info.total) }}
          </div>

          <div class="row q-gutter-sm">
            <div class="col-grow column justify-center">
              <q-linear-progress
                :value="status.info.percent / 100"
                stripe
              />
            </div>

            <q-btn
              aria-label="Cancel"
              icon="close"
              size="xs"
              dense
              rounded
              @click="cancelDownload"
            />
          </div>
        </div>

        <!-- update-cancelled -->
        <div
          v-else-if="status?.name === 'update-cancelled'"
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <div class="column">
            Update cancelled.

            <div class="text-caption">
              {{ status.info.version }} / {{ updateSize(status.info) }}
            </div>
          </div>

          <q-btn
            aria-label="Download"
            icon="download"
            dense
            rounded
            color="primary"
            class="self-center"
            @click="downloadUpdate"
          />
        </div>

        <!-- update-downloaded -->
        <div
          v-else-if="status?.name === 'update-downloaded'"
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <div class="column">
            Update downloaded!

            <div class="text-caption">
              {{ status.info.version }}
            </div>
          </div>

          <q-btn
            aria-label="Install"
            icon="restart_alt"
            dense
            rounded
            color="primary"
            class="self-center"
            @click="installUpdate"
          />
        </div>

        <!-- error -->
        <div
          v-else-if="status?.name === 'error'"
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <q-icon
            size="lg"
            name="error_outline"
            class="self-center"
          />
          <div class="column q-gutter-sm">
            Error:
            <a class="text-caption">
              {{ status.error.message }}
            </a>
          </div>
        </div>

        <div
          v-else
          class="row no-wrap justify-between q-gutter-x-sm"
        >
          <div class="column">
            Search for new updates

            <div class="text-caption">v{{ version }}</div>
          </div>

          <q-btn
            aria-label="Check for updates"
            dense
            rounded
            color="primary"
            icon="sync"
            class="self-center"
            @click="checkForUpdates"
          />
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { computed, ref, useAttrs } from 'vue';
import { format } from 'quasar';
import type { UpdateInfo } from 'electron-updater';
import { storeToRefs } from 'pinia';
import { useUpdaterStore } from 'stores/update-store';

const updaterStore = useUpdaterStore();
const { status, version } = storeToRefs(updaterStore);
const { humanStorageSize } = format;

const attrs = useAttrs();

const menuOpen = ref<boolean>(false);

const icon = computed<string>(() => {
  switch (status.value?.name) {
    case 'update-available':
      return 'download';
    case 'checking-for-update':
    case 'download-progress':
      return 'sync';
    case 'update-downloaded':
      return 'update';
    case 'error':
      return 'error_outline';
    case 'update-not-available':
    default:
      return 'o_info';
  }
});

function updateSize(info: UpdateInfo): string {
  const bytes = info.files.reduce(
    (total, file) => (file.size ? total + file.size : total),
    0,
  );

  return humanStorageSize(bytes);
}

function checkForUpdates() {
  window.appAPI.checkForUpdate();
}

function downloadUpdate() {
  window.appAPI.downloadUpdate();
}

function cancelDownload() {
  window.appAPI.cancelUpdate();
}

function installUpdate() {
  window.appAPI.installUpdate();
}
</script>

<style scoped></style>
