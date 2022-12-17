<template>
  <q-page class="full-width row justify-start no-wrap bg-grey-5">
    <template v-if="!flightNotFOund && !flightLoading">
      <!-- Menu -->
      <div class="self-stretch row no-wrap" :class="menuClasses">
        <q-tabs
          v-model="menuTabs"
          vertical
          active-bg-color="grey-6"
          class="bg-grey-10 text-white"
        >
          <q-tab name="overview" icon="home" :label="$t('overview')" />
          <q-separator spaced inset color="white" />
          <q-tab
            name="balloons"
            icon="mdi-airballoon"
            :label="$t('balloon', 2)"
          >
            <q-badge v-if="showBalloonsMenuBadge" color="red" floating>
              {{ availableBalloons.length }}
            </q-badge>
          </q-tab>
          <q-tab name="cars" icon="airport_shuttle" :label="$t('car', 2)">
            <q-badge v-if="showCarsMenuBadge" color="red" floating>
              {{ availableCars.length }}
            </q-badge>
          </q-tab>
          <q-tab
            name="supervisors"
            icon="supervisor_account"
            :label="$t('supervisor', 2)"
          >
            <q-badge v-if="showSupervisorsMenuBadge" color="red" floating>
              {{ availableSupervisors.length }}
            </q-badge>
          </q-tab>
          <q-tab name="participants" icon="group" :label="$t('participant', 2)">
            <q-badge v-if="showParticiapntsMenuBadge" color="red" floating>
              {{ availableParticipants.length }}
            </q-badge>
          </q-tab>
          <q-separator spaced inset color="white" />
          <q-tab name="settings" icon="settings" :label="$t('settings')" />
        </q-tabs>

        <div
          class="col-grow self-stretch column"
          v-if="menuTabs !== 'overview'"
        >
          <q-tab-panels
            v-model="menuTabs"
            animated
            transition-next="jump-up"
            transition-prev="jump-down"
            vertical
            class="no-wrap col-grow shadow-24"
          >
            <q-tab-panel name="balloons" class="column bg-grey-2">
              <q-scroll-area class="col-grow self-stretchs">
                <editable-list
                  :title="$t('balloon', 2)"
                  :item-name="$t('balloon')"
                  :itens="availableBalloons"
                  @create="dialogs.showCreateVehicle('balloon', flight)"
                  @edit="(balloon) => dialogs.showEditVehicle(balloon, flight)"
                  @delete="(balloon) => dialogs.showDeleteVehicle(balloon)"
                >
                  <template #main="{ item }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }">
                    {{ item.capacity - 1 + ' + 1' }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="cars" class="column bg-grey-2">
              <q-scroll-area class="col-grow self-stretchs">
                <editable-list
                  :title="$t('car', 2)"
                  :item-name="$t('car')"
                  :itens="availableCars"
                  @create="dialogs.showCreateVehicle('car', flight)"
                  @edit="(car) => dialogs.showEditVehicle(car, flight)"
                  @delete="(car) => dialogs.showDeleteVehicle(car)"
                >
                  <template #main="{ item }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }">
                    {{ item.capacity - 1 + ' + 1' }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="supervisors" class="column bg-grey-2">
              <q-scroll-area class="col-grow self-stretchs">
                <editable-list
                  :title="$t('supervisor', 2)"
                  :item-name="$t('supervisor')"
                  :itens="availableSupervisors"
                  @create="dialogs.showCreatePerson(flight.people)"
                  @edit="(person) => dialogs.showEditPerson(person)"
                  @delete="(person) => dialogs.showDeletePerson(person)"
                >
                  <template #main="{ item }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }">
                    {{ item.numberOfFlights }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="participants" class="column bg-grey-2">
              <q-scroll-area class="col-grow self-stretchs">
                <editable-list
                  :title="$t('participant', 2)"
                  :item-name="$t('participant')"
                  :itens="availableParticipants"
                  @create="dialogs.showCreatePerson(flight.people)"
                  @edit="(person) => dialogs.showEditPerson(person)"
                  @delete="(person) => dialogs.showDeletePerson(person, flight)"
                  :dense="availableParticipants.length > 10"
                >
                  <template #main="{ item }">
                    {{ item.name }}
                  </template>
                  <template #side="{ item }">
                    {{ item.numberOfFlights }}
                  </template>
                </editable-list>
              </q-scroll-area>
            </q-tab-panel>

            <q-tab-panel name="settings">
              <div class="q-py-md">
                <div class="text-h6 q-py-md">
                  {{ $t('settings') }}
                </div>
                <div class="q-gutter-sm">
                  <q-list bordered>
                    <q-item tag="label" v-ripple>
                      <q-item-section avatar top>
                        <q-checkbox
                          v-model="color"
                          val="teal"
                          color="primary"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label> Teal</q-item-label>
                        <q-item-label caption>With description</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>

      <!-- Flight overview -->
      <!-- TODO FIXME add loader or skeleton -->
      <div v-if="showFlightView" class="col-grow flex">
        <base-flight
          :flight="flight"
          @balloon-add="onBalloonAdd"
          class="col-grow content-stretch"
        >
          <base-vehicle-group
            v-for="group in flight.vehicleGroups"
            :key="group.id"
            :group="group"
            @car-add="(car) => onCarAdd(group, car)"
          >
            <template #balloon>
              <base-vehicle
                :key="group.balloon.id"
                type="balloon"
                :vehicle="group.balloon"
                @balloon-remove="(b) => onVehicleGroupRemove(group)"
                @passenger-add="(p) => onBalloonPersonAdd(group.balloon, p)"
                @passenger-remove="
                  (p) => onBalloonPersonRemove(group.balloon, p)
                "
                @operator-add="(p) => onBalloonOperatorAdd(group.balloon, p)"
                @operator-remove="(p) => onBalloonOperatorRemove(group.balloon)"
              />
            </template>
            <template #cars>
              <base-vehicle
                v-for="vehicle in group.cars"
                :key="vehicle.id"
                type="car"
                :vehicle="vehicle"
                @car-remove="(car) => onCarRemove(group, car)"
                @passenger-add="(p) => onCarPersonAdd(vehicle, p)"
                @passenger-remove="(p) => onCarPersonRemove(vehicle, p)"
                @operator-add="(p) => onCarOperatorAdd(vehicle, p)"
                @operator-remove="(p) => onCarOperatorRemove(vehicle)"
              />
            </template>
          </base-vehicle-group>
        </base-flight>

        <q-page-sticky position="bottom-right" :offset="[18, 18]">
          <q-fab icon="add" direction="up" color="primary" external-label>
            <q-fab-action
              external-label
              label-position="left"
              :label="$t('actions.add_car')"
              icon="airport_shuttle"
              color="primary"
            />
            <q-fab-action
              external-label
              label-position="left"
              :label="$t('actions.add_balloon')"
              icon="mdi-airballoon"
              color="primary"
            />
            <q-fab-action
              external-label
              label-position="left"
              :label="$t('actions.smart_fill')"
              icon="fast_forward"
              color="accent"
              @click="onSmartFill"
            />
          </q-fab>
        </q-page-sticky>
      </div>
    </template>

    <template v-if="flightLoading"> Loading...</template>

    <template v-if="flightNotFOund">
      <!-- TODO -->
      Flight not Found
    </template>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, onMounted, Ref, ref, watch } from 'vue';
import { QItem, QList, useQuasar } from 'quasar';
import { onBeforeRouteUpdate } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from 'stores/project';
import { useDialogs } from 'src/composables/dialogs';
import BaseFlight from 'components/BaseFlight.vue';
import BaseVehicleGroup from 'components/BaseVehicleGroup.vue';
import BaseVehicle from 'components/BaseVehicle.vue';
import {
  Balloon,
  Car,
  Flight,
  Person,
  Project,
  VehicleGroup,
} from 'src/lib/entities';
import EditableList from 'components/EditableList.vue';
import { useI18n } from 'vue-i18n';
import { solve } from 'src/lib/solver/solver';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { useServiceStore } from 'stores/service';
import { solveX } from 'src/lib/solver/policySolver';

const { t } = useI18n();
const $q = useQuasar();
const projectStore = useProjectStore();
const serviceStore = useServiceStore();

// FIXME Convert correctly
const {
  project,
  flight,
}: {
  project: Ref<Project | null>;
  flight: Ref<Flight | null>;
} = storeToRefs(projectStore) as any;
const {
  dataService,
}: {
  dataService: Ref<PersistenceService | null>;
} = storeToRefs(serviceStore) as any;

const dialogs = useDialogs($q, t);

const menuTabs = ref('overview');
const flightLoading = ref(true);
const flightNotFOund = ref(false);

onMounted(async () => {
  projectStore
    .load()
    .catch(() => {
      flightNotFOund.value = true;
    })
    .finally(() => {
      flightLoading.value = false;

      const flights = solveX(flight.value!);

      function myLoop(i = 0) {
        setTimeout(() => {
          flight.value = flights[i];

          if (i + 1 < flights.length) {
            myLoop(i + 1);
          } else {
            flight.value!.clear();
            flight.value!.vehicleGroups = [];
          }
        }, 500);
      }
      if (flights.length > 0) {
        myLoop();
      }
    });
});

watch(
  flight,
  () => {
    // TODO maybe just redo the logic with computed
    if (flight.value == null) return [];
    availablePeople.value = flight.value.availablePeople();
    availableBalloons.value = flight.value.availableBalloons();
    availableCars.value = flight.value.availableCars();
  },
  { deep: true }
);

onBeforeRouteUpdate((to) => {
  flightNotFOund.value = false;
  flightLoading.value = true;

  projectStore
    .load(to.params)
    .catch(() => {
      flightNotFOund.value = true;
    })
    .finally(() => {
      flightLoading.value = false;
    });
});

function onSmartFill() {
  if (!flight.value) {
    return;
  }

  const f = solve(flight.value);
  const notif = $q.notify({
    type: 'ongoing',
    message: t('smart_fill_loading'),
  });
  f.then((value) => {
    dataService.value?.updateFLight(value);
    notif({
      type: 'positive',
      message: t('smart_fill_success'),
      timeout: 1000,
    });
  }).catch((reason) => {
    notif({
      type: 'warning',
      message: t('smart_fill_error') + ': ' + reason,
      timeout: 2000,
    });
  });
}

function monitorService(
  cb: (service: PersistenceService) => Promise<void>
): void {
  if (!dataService.value) {
    $q.notify({
      type: 'negative',
      message: t('service_not_available'),
    });
    return;
  }

  const promise = cb(dataService.value);
  const notif = $q.notify({
    type: 'ongoing',
    message: t('saving_in_progress'),
  });
  promise
    .then(() => {
      notif({
        type: 'positive',
        message: t('saving_success'),
        timeout: 1000,
      });
    })
    .catch((reason) => {
      notif({
        type: 'warning',
        message: t('saving_failed') + ': ' + reason,
        timeout: 5000,
      });
    });
}

function onBalloonAdd(balloon: Balloon) {
  monitorService((service) =>
    service.addVehicleGroup(new VehicleGroup(balloon))
  );
}

function onVehicleGroupRemove(group: VehicleGroup) {
  monitorService((service) => service.deleteVehicleGroup(group));
}

function onCarAdd(group: VehicleGroup, car: Car) {
  monitorService((service) => service.addCarToVehicleGroup(car, group));
}

function onCarRemove(group: VehicleGroup, car: Car) {
  monitorService((service) => service.removeCarFromVehicleGroup(car, group));
}

function onBalloonOperatorAdd(balloon: Balloon, person: Person) {
  monitorService((service) => service.setBalloonOperator(person, balloon));
}

function onCarOperatorAdd(car: Car, person: Person) {
  monitorService((service) => service.setCarOperator(person, car));
}

function onBalloonOperatorRemove(balloon: Balloon) {
  monitorService((service) => service.setBalloonOperator(undefined, balloon));
}

function onCarOperatorRemove(car: Car) {
  monitorService((service) => service.setCarOperator(undefined, car));
}

function onBalloonPersonAdd(balloon: Balloon, person: Person) {
  monitorService((service) => service.addBalloonPassenger(person, balloon));
}

function onCarPersonAdd(car: Car, person: Person) {
  monitorService((service) => service.addCarPassenger(person, car));
}

function onBalloonPersonRemove(balloon: Balloon, person: Person) {
  monitorService((service) => service.removeBalloonPassenger(person, balloon));
}

function onCarPersonRemove(car: Car, person: Person) {
  monitorService((service) => service.removeCarPassenger(person, car));
}

const showBalloonsMenuBadge = computed<boolean>(() => {
  return availableBalloons.value.length > 0;
});
const showCarsMenuBadge = computed<boolean>(() => {
  return availableCars.value.length > 0;
});
const showParticiapntsMenuBadge = computed<boolean>(() => {
  return availableParticipants.value.length > 0;
});
const showSupervisorsMenuBadge = computed<boolean>(() => {
  return availableSupervisors.value.length > 0;
});

const availablePeople = ref(flight.value?.availablePeople() ?? []);
const availableBalloons = ref(flight.value?.availableBalloons() ?? []);
const availableCars = ref(flight.value?.availableCars() ?? []);

const availableParticipants = computed(() => {
  return availablePeople.value
    .filter((value) => !value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const availableSupervisors = computed(() => {
  return availablePeople.value
    .filter((value) => value.supervisor)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const showFlightView = computed<boolean>(() => {
  return !$q.screen.xs || menuTabs.value === 'overview';
});

const menuClasses = computed<string>(() => {
  return menuTabs.value !== 'overview'
    ? 'col-xl-3 col-lg-3 col-md-4 col-sm-6 col-xs-12'
    : '';
});
</script>

<style>
.q-tab__content {
  width: 90px !important;
}

.q-tab .q-badge {
  right: 0 !important;
}
</style>
