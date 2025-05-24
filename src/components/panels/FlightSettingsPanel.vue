<template>
  <q-tab-panel
    :name
    class="column bg-grey-2"
  >
    <q-scroll-area class="col-grow self-stretch">
      <div class="q-py-md">
        <div class="text-h6 q-py-md">Settings</div>
        <div class="q-gutter-sm">
          <q-list
            bordered
            separator
          >
            <q-item
              tag="label"
              v-ripple
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-model="showVehicleLabel"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label> Show vehicle names</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              tag="label"
              v-ripple
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-model="showVehicleIndex"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label> Show passenger index</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              tag="label"
              v-ripple
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-model="showNumberOfFlights"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label> Show number of flights</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              tag="label"
              v-ripple
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-model="showPersonWeight"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label> Show weight of person</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              tag="label"
              v-ripple
            >
              <q-item-section
                avatar
                top
              >
                <q-checkbox
                  v-model="showVehicleWeight"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label> Show total weight of balloons </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { QItem, QList } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from 'stores/settings';

const settingsStore = useSettingsStore();
const {
  showVehicleIndex,
  showVehicleLabel,
  showNumberOfFlights,
  showPersonWeight,
  showVehicleWeight,
} = storeToRefs(settingsStore);

const { name } = defineProps<{
  name: string;
}>();
</script>

<style scoped></style>
