<template>
  <q-tab-panel
    :name
    class="column bg-grey-2 q-pa-none"
  >
    <q-scroll-area class="col-grow self-stretch q-pa-md">
      <div class="text-h6">Settings</div>
      <div class="q-gutter-sm">
        <q-list separator>
          <q-item-label header>General</q-item-label>
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
              <q-item-label>Show vehicle name</q-item-label>
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
                v-model="showGroupLabel"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>Show group name</q-item-label>
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
              <q-item-label>Show passenger index</q-item-label>
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
              <q-item-label>Show number of flights</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item-label header>Weight</q-item-label>
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
              <q-item-label>Show weight of person</q-item-label>
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
              <q-item-label>Show total weight</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Default Weight</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model.number="personDefaultWeight"
                type="number"
                suffix=" kg"
                style="width: 75px"
                dense
                rounded
                outlined
              />
            </q-item-section>
          </q-item>
          <q-item-label header>Appearance</q-item-label>
          <q-item>
            <q-item-section>
              <q-select
                v-model="groupAlignment"
                label="Group Alignment"
                :options="[
                  { label: 'Vertical', value: 'vertical' },
                  { label: 'Horizontal', value: 'horizontal' },
                ]"
                emit-value
                map-options
                rounded
                outlined
                dense
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="groupStyle"
                label="Group Alignment"
                :options="[
                  { label: 'Dashed', value: 'dashed' },
                  { label: 'Highlighted', value: 'highlighted' },
                ]"
                emit-value
                map-options
                rounded
                outlined
                dense
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { QItem, QList } from 'quasar';
import { useProjectSettings } from 'src/composables/projectSettings';

const {
  showVehicleIndex,
  showVehicleLabel,
  showGroupLabel,
  showNumberOfFlights,
  showPersonWeight,
  showVehicleWeight,
  personDefaultWeight,
  groupAlignment,
  groupStyle,
} = useProjectSettings();

const { name } = defineProps<{
  name: string;
}>();
</script>

<style scoped></style>
