<template>
  <q-btn
    v-if="user"
    icon="account_circle"
    flat
    rounded
  >
    <q-menu auto-close>
      <q-list>
        <q-item>
          <q-item-section>
            {{ t('signed_in_as') }}
            <strong>{{ user?.name }}</strong>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item
          clickable
          @click="logout()"
        >
          <q-item-section class="text-red">
            {{ t('logout') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
  <q-btn
    v-else
    :label="t('login')"
    to="/login"
    stretch
    flat
  />
</template>

<script lang="ts" setup>
import { useAuthStore } from 'stores/auth';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

async function logout() {
  await authStore.logout();
}
</script>

<style scoped></style>
