<template>
  <q-page class="flex">
    <q-scroll-area style="width: 100%">
      <!-- content -->
      <template v-if="flight !== undefined">
        <div class="row">
          <div
            class="column"
            v-for="group in flight.vehicleGroups"
            :key="group.id"
          >
            <vehicle-group-component :data="group" />
          </div>
        </div>
      </template>
    </q-scroll-area>

    <!--    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>-->
    <q-drawer v-model="rightDrawerOpen" side="right" :overlay="false" bordered>
      <!-- drawer content -->
      <div class="column">
        <q-scroll-area class="fit">
          <div class="q-pa-sm">
            <!-- TODO -->
          </div>
        </q-scroll-area>
      </div>
    </q-drawer>

    <!--    <div class="q-px-sm q-py-lg">-->
    <!--      <div class="column items-center" style="margin-top: 100px; margin-bottom: 100px;">-->
    <!--        <q-fab color="secondary" push icon="add" direction="left">-->
    <!--          <q-fab-action color="green" text-color="black" icon="balloon"/>-->
    <!--        </q-fab>-->
    <!--        <q-fab color="secondary" push icon="add" direction="left">-->
    <!--          <q-fab-action color="blue" text-color="black" icon="balloon"/>-->
    <!--        </q-fab>-->
    <!--      </div>-->
    <!--    </div>-->
  </q-page>

  <q-footer bordered class="bg-grey-8 text-white">
    <q-toolbar>
      <q-toolbar-title>
        <div>Title</div>
      </q-toolbar-title>

      <q-btn class="bg-primary" @click="flight.findSolution()">
        Fill flight
      </q-btn>
    </q-toolbar>
  </q-footer>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';
import VehicleGroupComponent from 'src/components/VehicleGroupComponent.vue';
import {
  onBeforeRouteUpdate,
  RouteParams,
  useRoute,
  useRouter,
} from 'vue-router';
import { useProjectStore } from 'stores/project-store';
import { storeToRefs } from 'pinia';

export default defineComponent({
  name: 'FlightPage',
  components: { VehicleGroupComponent },
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    const router = useRouter();
    const projectStore = useProjectStore();

    const flight = ref();
    const rightDrawerOpen = ref(false);

    function toggleRightDrawer() {
      rightDrawerOpen.value = !rightDrawerOpen.value;
    }

    const { project } = storeToRefs(projectStore);
    if (project.value === null) {
      $q.notify({
        type: 'warning',
        message: 'No project found.',
      });
      router.push({ name: 'projects' });
      return { rightDrawerOpen };
    }

    if (Array.isArray(route.params.flight)) {
      router.push({ name: 'projects' }); // TODO change route
      return { rightDrawerOpen };
    }

    updateFlightPage(route.params);

    if (flight.value === undefined) {
      // TODO Maybe update the store?
      $q.notify({
        type: 'warning',
        message: 'Flight does not exist.',
      });
      router.push({ name: 'projects' });
      return { rightDrawerOpen };
    }

    function updateFlightPage(params: RouteParams) {
      flight.value = null;
      if (Array.isArray(params.fligh)) return;

      const flightId = Number(params.flight);
      flight.value = project.value?.flights.find(
        (value) => value.id == flightId
      );
    }

    onBeforeRouteUpdate((to, from) => {
      if (from.params.flight == to.params.flight) return false;
      updateFlightPage(to.params);
      return flight.value !== undefined;
    });

    return {
      rightDrawerOpen,
      toggleRightDrawer,

      flight,
    };
  },
});
</script>
