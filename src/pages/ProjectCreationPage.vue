<template>
  <q-page padding class="full-width">
<!--    <q-scroll-area class="col-grow full-height" style="width: 200px; height: 200px;">-->
      <!-- content -->
      <!-- TODO i18n -->

      <q-stepper v-model="step" vertical color="primary" animated flat>
        <q-step
          name="details"
          title="Enter project details"
          icon="edit_note"
          :done="name && name.length > 0"
        >
          <div class="q-gutter-md" style="max-width: 300px">
            <q-input v-model="name" label="Name" />

            <q-input
              v-model="description"
              label="Description"
              type="textarea"
            />
          </div>
          <q-stepper-navigation>
            <q-btn
              @click="step = 'people'"
              color="primary"
              label="Continue"
              :disable="!name || name.length == 0"
            />
          </q-stepper-navigation>
        </q-step>

        <ImportPeopleStep
          name="people"
          v-model="people"
          @back="step = 'details'"
          @continue="step = 'balloons'"
          @to="(dest) => (step = dest)"
        />

        <ManualPeopleStep
          name="people_manual"
          v-model="people"
          @back="step = 'details'"
          @continue="step = 'balloons_manual'"
          @to="(dest) => (step = dest)"
        />

        <ManualBalloonsStep
          name="balloons_manual"
          v-model="balloons"
          :people="people"
          @back="step = 'people_manual'"
          @continue="step = 'cars_manual'"
          @to="(dest) => (step = dest)"
        />

        <ManualCarsStep
          name="cars_manual"
          v-model="cars"
          :people="people"
          @back="step = 'balloons_manual'"
          @continue="step = 'finish'"
          @to="(dest) => (step = dest)"
        />

        <q-step name="finish" title="Finish" icon="flag" :done="completed">
          This step won't show up because it is disabled.

          <q-stepper-navigation>
            <q-btn @click="finish()" color="primary" label="Finish" />
            <q-btn
              flat
              @click="step = 'manual_cars'"
              color="primary"
              label="Back"
              class="q-ml-sm"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
<!--    </q-scroll-area>-->
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Balloon, Car, Flight, Person, Project } from 'src/lib/entities';
import ImportPeopleStep from 'components/steps/ImportPeopleStep.vue';
import ManualPeopleStep from 'components/steps/ManualPeopleStep.vue';
import ManualBalloonsStep from 'components/steps/ManualBalloonsStep.vue';
import ManualCarsStep from 'components/steps/ManualCarsStep.vue';
import { useRouter } from 'vue-router';
import { useServiceStore } from 'stores/service';

const router = useRouter();
const serviceStore = useServiceStore();

const step = ref('details');
const name = ref<string>();
const description = ref<string>();
const people = ref<Person[]>([]);
const balloons = ref<Balloon[]>([]);
const cars = ref<Car[]>([]);

const completed = computed(() => {
  return (
    name.value !== undefined &&
    balloons.value.length > 0 &&
    cars.value.length > 0 &&
    people.value.length > 0
  );
});

function finish() {
  if (!name.value) {
    return;
  }

  // TODO Why do I need to cast here???
  const b = balloons.value as Balloon[];
  const c = cars.value as Car[];
  const p = people.value as Person[];

  const flight = new Flight(b, c, p);

  const project = new Project(name.value, description.value, [flight]);

  serviceStore.dataService?.updateProject(project);
  // TODO is the flight added?

  router.push(`/projects/${project.id}/flights/${flight.id}`);
}
</script>
