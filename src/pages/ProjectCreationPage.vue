<template>
  <q-page
    padding
    class="full-width"
  >
    <q-stepper
      v-model="step"
      vertical
      color="primary"
      animated
      flat
    >
      <q-step
        name="details"
        title="Enter project details"
        icon="edit_note"
        :done="name && name.length > 0"
      >
        <div
          class="q-gutter-md"
          style="max-width: 300px"
        >
          <q-input
            v-model="name"
            label="Name"
            :rules="[
              (val: string | undefined) =>
                (val && val.trim().length > 0) || 'Name is required.',
            ]"
            hide-bottom-space
            outlined
            rounded
          />

          <q-input
            v-model="description"
            label="Description"
            type="textarea"
            outlined
            rounded
          />
        </div>
        <q-stepper-navigation>
          <q-btn
            @click="step = people.length === 0 ? 'people' : 'people_manual'"
            color="primary"
            label="Continue"
            :disable="!name || name.length === 0"
            rounded
          />
        </q-stepper-navigation>
      </q-step>

      <import-people-step
        v-model="people"
        name="people"
        @continue="step = 'people_manual'"
        @to="(dest) => (step = dest)"
      />

      <manual-people-step
        v-model="people"
        name="people_manual"
        @back="step = 'details'"
        @continue="step = 'balloons_manual'"
        @to="(dest) => (step = dest)"
      />

      <manual-balloons-step
        v-model="balloons"
        name="balloons_manual"
        :people
        @back="step = 'people_manual'"
        @continue="step = 'cars_manual'"
        @to="(dest) => (step = dest)"
      />

      <manual-cars-step
        v-model="cars"
        name="cars_manual"
        :people
        @back="step = 'balloons_manual'"
        @continue="step = 'finish'"
        @to="(dest) => (step = dest)"
      />

      <q-step
        name="finish"
        title="Finish"
        icon="flag"
        :done="completed"
      >
        All done! You may edit the data later too.
        <q-stepper-navigation class="row q-gutter-sm">
          <q-btn
            label="Create"
            color="primary"
            rounded
            @click="finish()"
          />
          <q-btn
            label="Back"
            color="primary"
            rounded
            outline
            @click="step = 'cars_manual'"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Balloon, Car, Person, Project } from 'app/src-common/entities';
import ImportPeopleStep from 'components/steps/ImportPeopleStep.vue';
import ManualPeopleStep from 'components/steps/ManualPeopleStep.vue';
import ManualBalloonsStep from 'components/steps/ManualBalloonsStep.vue';
import ManualCarsStep from 'components/steps/ManualCarsStep.vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from 'stores/project';

const router = useRouter();
const projectStore = useProjectStore();

const step = ref('details');
const name = ref<string>();
const description = ref<string>();
const people = ref<Person[]>([]);
const balloons = ref<Balloon[]>([]);
const cars = ref<Car[]>([]);

const completed = computed<boolean>(() => {
  return (
    name.value !== undefined &&
    balloons.value.length > 0 &&
    cars.value.length > 0 &&
    people.value.length > 0
  );
});

async function finish() {
  if (!name.value) {
    return;
  }

  // Every ref needs to be converted to raw
  const project: Project = {
    id: crypto.randomUUID(),
    name: name.value,
    description: description.value,
    createdAt: new Date().toISOString(),
    flights: [
      {
        id: crypto.randomUUID(),
        vehicleGroups: [],
        carIds: cars.value.map(({ id }) => id),
        balloonIds: balloons.value.map(({ id }) => id),
        personIds: people.value.map(({ id }) => id),
      },
    ],
    balloons: balloons.value,
    cars: cars.value,
    people: people.value,
  };

  await projectStore.createProject(project);

  await router.push(`/projects/${project.id}/flights/${project.flights[0].id}`);
}
</script>
