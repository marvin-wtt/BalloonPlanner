<template>
  <q-tab-panel
    :name
    class="column bg-grey-2 q-pa-none"
  >
    <q-scroll-area class="col-grow self-stretch q-pa-md">
      <div class="text-h6">Settings</div>
      <div class="q-gutter-sm">
        <q-list separator>
          <q-item-label header>Behaviour</q-item-label>
          <setting-toggle
            v-model="disableAssignmentProtection"
            label="Disable assignment protection"
            caption="The protection prohibits changes across vehicle groups after the first leg"
          />
          <setting-toggle
            v-model="disableVehicleGroupProtection"
            label="Disable vehicle group protection"
            caption="The protection prohibits changes to the vehicle groups after the first leg"
          />
          <q-item-label header>Information</q-item-label>
          <setting-toggle
            v-model="showVehicleLabel"
            label="Show vehicle name"
          />
          <setting-toggle
            v-if="showVehicleLabel"
            v-model="showVehicleIcon"
            label="Show vehicle Icon"
          />
          <setting-toggle
            v-model="showGroupLabel"
            label="Show group name"
          />
          <setting-toggle
            v-model="showVehicleIndex"
            label="Show passenger index"
          />
          <setting-toggle
            v-model="showNumberOfFlights"
            label="Show number of flights"
          />
          <setting-toggle
            v-model="showHandover"
            label="Show handover list"
            caption="Lists who swaps groups before the next leg, so drivers know who to hand over"
          />
          <q-item-label header>Alerts</q-item-label>
          <setting-select
            v-for="row in WARNING_ROWS"
            :key="row.type"
            :model-value="visibilityOf(row.type)"
            :label="row.label"
            :caption="row.caption"
            :options="VISIBILITY_OPTIONS"
            @update:model-value="
              (v) => {
                if (v !== undefined) setVisibility(row.type, v);
              }
            "
          />
          <q-separator />
          <q-item-label header>Weight</q-item-label>
          <setting-toggle
            v-model="showPersonWeight"
            label="Show weight of person"
          />
          <setting-toggle
            v-model="showVehicleWeight"
            label="Show total weight"
          />
          <q-item>
            <q-item-section>
              <q-item-label>Default Person Weight</q-item-label>
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
          <setting-select
            v-model="groupAlignment"
            label="Group Alignment"
            :options="[
              { label: 'Vertical', value: 'vertical' },
              { label: 'Horizontal', value: 'horizontal' },
            ]"
          />
          <setting-select
            v-model="groupStyle"
            label="Group Style"
            :options="[
              { label: 'Dashed', value: 'dashed' },
              { label: 'Highlighted', value: 'highlighted' },
            ]"
          />
          <q-item>
            <q-item-section>
              <q-input
                v-model="balloonColor"
                label="Balloon Color"
                :rules="['anyColor']"
                hide-bottom-space
                clearable
                clear-icon="sym_o_undo"
                rounded
                outlined
                dense
              >
                <template #append>
                  <q-icon
                    name="colorize"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-color
                        v-model="balloonColor"
                        no-header
                        default-view="palette"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-input
                v-model="carColor"
                label="Car Color"
                :rules="['anyColor']"
                hide-bottom-space
                clearable
                clear-icon="sym_o_undo"
                rounded
                outlined
                dense
              >
                <template #append>
                  <q-icon
                    name="colorize"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-color
                        v-model="carColor"
                        no-header
                        default-view="palette"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-scroll-area>
  </q-tab-panel>
</template>

<script lang="ts" setup>
import { QItem, QList } from 'quasar';
import { useProjectSettings } from '@/composables/projectSettings';
import { useWarningVisibility } from '@/composables/warningVisibility';
import SettingToggle from '@/components/panels/SettingToggle.vue';
import SettingSelect from '@/components/panels/SettingSelect.vue';
import type {
  WarningCategory,
  WarningVisibility,
} from '@/../src-common/entities';

const {
  disableAssignmentProtection,
  disableVehicleGroupProtection,
  showVehicleIndex,
  showVehicleLabel,
  showVehicleIcon,
  showGroupLabel,
  showNumberOfFlights,
  showHandover,
  showPersonWeight,
  showVehicleWeight,
  personDefaultWeight,
  groupAlignment,
  groupStyle,
  balloonColor,
  carColor,
} = useProjectSettings();

const { visibilityOf, setVisibility } = useWarningVisibility();

// Adding a new hideable notice only needs the right category
// (data-export-hide/-declass tag, plus isHiddenAlways(category) where it
// renders) — visibility itself is controlled per category, not per notice.
interface WarningRow {
  type: WarningCategory;
  label: string;
  caption?: string;
}

const WARNING_ROWS: WarningRow[] = [
  {
    type: 'warning',
    label: 'Warnings',
    caption: 'Language mismatch, balloon overweight',
  },
  {
    type: 'error',
    label: 'Errors',
    caption:
      'Capacity exceeded, operator not allowed, blocked place, missing trailer clutch',
  },
  {
    type: 'swap',
    label: 'Group swaps',
    caption: 'Person assigned to a different group than the previous leg',
  },
];

const VISIBILITY_OPTIONS: { label: string; value: WarningVisibility }[] = [
  { label: 'Show', value: 'show' },
  { label: 'Hide in export', value: 'hide-export' },
  { label: 'Hide always', value: 'hide' },
];

const { name } = defineProps<{
  name: string;
}>();
</script>

<style scoped></style>
