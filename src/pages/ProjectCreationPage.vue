<template>
  <q-page class="creation-page row justify-center">
    <div class="creation-shell column">
      <header class="creation-header">
        <div class="creation-header__eyebrow">New project</div>
        <h1 class="creation-header__title">Create a project</h1>
        <p class="creation-header__subtitle">
          Add people, balloons, and cars. You can change any of it later.
        </p>
      </header>

      <q-card
        flat
        class="creation-card"
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
            :done="!!name && name.length > 0"
          >
            <div class="q-gutter-md creation-fields">
              <q-input
                v-model="name"
                label="Name"
                :rules="[
                  (val: string | undefined) =>
                    (val && val.trim().length > 0) || 'Name is required.',
                ]"
                hide-bottom-space
                autofocus
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
                color="primary"
                label="Continue"
                :disable="!name || name.length === 0"
                rounded
                @click="step = people.length === 0 ? 'people' : 'people_manual'"
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
            <p class="finish__lead">
              Ready to create <strong>{{ name || 'your project' }}</strong> with
              {{ people.length }}
              {{ people.length === 1 ? 'person' : 'people' }},
              {{ balloons.length }}
              {{ balloons.length === 1 ? 'balloon' : 'balloons' }}, and
              {{ cars.length }} {{ cars.length === 1 ? 'car' : 'cars' }}.
            </p>
            <p class="finish__note">You can edit all of this later.</p>
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
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Balloon, Car, Person } from '@/../src-common/entities';
import ImportPeopleStep from '@/components/steps/ImportPeopleStep.vue';
import ManualPeopleStep from '@/components/steps/ManualPeopleStep.vue';
import ManualBalloonsStep from '@/components/steps/ManualBalloonsStep.vue';
import ManualCarsStep from '@/components/steps/ManualCarsStep.vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';

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

  const project = await projectStore.createProject({
    name: name.value,
    description: description.value,
    balloons: balloons.value,
    cars: cars.value,
    people: people.value,
  });

  await router.push({
    name: 'flight',
    params: {
      projectId: project.id,
      flightId: project.flights[0]?.legs[0]?.id,
    },
  });
}
</script>

<style scoped>
/* Centered wizard on the flight-board canvas, framed by a titled card so it
   reads as one focused task instead of a full-width form stranded left. */
.creation-page {
  background: var(--surface-canvas);
  padding: clamp(1.5rem, 4vw, 3rem) 1rem;
}

.creation-shell {
  width: 100%;
  max-width: 900px;
}

.creation-header {
  margin-bottom: 1.25rem;
  padding-left: 0.25rem;
}

.creation-header__eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.creation-header__title {
  margin: 0.25rem 0 0;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--ink-strong);
}

.creation-header__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: var(--ink-muted);
}

.creation-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  padding: 0.75rem 0.5rem;
}

/* Single-line fields don't benefit from spanning the whole card. */
.creation-fields {
  max-width: 420px;
}

.finish__lead {
  margin: 0;
  font-size: 1rem;
  color: var(--ink-strong);
}

.finish__lead strong {
  font-weight: 700;
}

.finish__note {
  margin: 0.35rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}
</style>
