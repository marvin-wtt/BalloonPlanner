<template>
  <q-page padding>
    <div class="q-pa-md">
      <div
        class="q-gutter-sm row"
        v-if="user"
      >
        <project-card
          v-for="project in user.projects"
          :project="project"
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
        >
          <q-card-section>
            <div class="text-h6">
              {{ project.name }}
            </div>
            <div class="text-subtitle2">
              {{ project.description }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              flat
              rounded
              @click.stop="editProject()"
            >
              {{ t('edit') }}
            </q-btn>
            <q-btn
              color="negative"
              flat
              rounded
              @click.stop="deleteProject()"
            >
              {{ t('delete') }}
            </q-btn>
          </q-card-actions>
        </project-card>

        <project-card v-if="user.local">
          <q-btn
            class="add-btn"
            icon="folder_open"
            size="md"
            stack
            @click="loadProject()"
          >
            {{ t('open_project') }}
          </q-btn>
        </project-card>

        <project-card @click="createProject()">
          <div class="fit column justify-center content-center text-center">
            <div>
              <q-icon
                name="add"
                size="lg"
              />
            </div>
            <div class="text-subtitle1">
              {{ t('add_project') }}
            </div>
          </div>
        </project-card>
      </div>
    </div>

    <!-- content -->
  </q-page>
</template>

<script lang="ts" setup>
import ProjectCard from 'components/ProjectCard.vue';
import { useAuthStore } from 'stores/auth';
import { storeToRefs } from 'pinia';
import { useServiceStore } from 'stores/service';
import { Ref } from 'vue';
import { Project, User } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const serviceStore = useServiceStore();
const router = useRouter();
const quasar = useQuasar();

const { t } = useI18n();
const { user } = storeToRefs(authStore) as unknown as {
  user: Ref<User>;
};

function loadProject() {
  if (!serviceStore.dataService) {
    return;
  }

  // TODO Open electron file chooser
}

function openProject(project: Project) {
  router.push(`/projects/${project.id}/flights`);
}

function deleteProject() {
  // TODO Add dialog
  quasar.dialog({});
}

function editProject() {
  // TODO Add dialog
  quasar.dialog({});
}

function createProject() {
  // TODO Add dialog
  quasar.dialog({});
}
</script>

<style>
.project-card {
  width: 15em;
  aspect-ratio: 1.5;
}

.project-card .add-btn {
  width: 100%;
  height: 100%;
}
</style>
