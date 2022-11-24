<template>
  <q-card class="bg-grey text-white">
    <q-card-section>
      <div class="text-h6">
        {{ project.name }}
      </div>
      <div class="text-subtitle2">
        {{ project.desciption }}
      </div>
    </q-card-section>

    <q-list>
      <q-item>
        <q-item-section avatar>
          <q-icon name="groups" />
        </q-item-section>

        <q-item-section>
          {{ $t('flights') }}
        </q-item-section>

        <q-item-section side>
          {{ project.flights.length }}
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section avatar>
          <q-icon name="flight" />
        </q-item-section>

        <q-item-section>
          {{ $t('collaborators') }}
        </q-item-section>

        <q-item-section side>
          {{ project.collaborators.length }}
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat>{{ $t('edit') }}</q-btn>
      <q-btn flat>{{ $t('open') }}</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { Project } from 'src/lib/entities';

interface Props {
  project: Project;
}

const props = defineProps<Props>();
</script>

<style scoped></style>
