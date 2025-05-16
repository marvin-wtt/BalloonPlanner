<template>
  <q-page
    class="row bg-grey-4 window-height window-width row justify-center items-center"
  >
    <div class="column col-shrink">
      <div class="row">
        <h5 class="text-h5 q-my-md">
          {{ $t('app_name') }}
        </h5>
      </div>
      <div class="row">
        <q-card
          square
          bordered
          class="q-pa-lg shadow-1"
        >
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input
                ref="emailRef"
                v-model="email"
                type="email"
                label="email"
                rounded
                outlined
                lazy-rules
                :rules="emailRules"
              />

              <q-input
                ref="passwordRef"
                rounded
                outlined
                clearable
                v-model="password"
                type="password"
                label="password"
                :rules="passwordRules"
                @keydown.enter.prevent="onLoginEmail"
              />
            </q-form>
          </q-card-section>

          <q-card-actions class="q-px-md">
            <q-btn
              rounded
              color="primary"
              size="lg"
              class="full-width"
              label="Login"
              :loading="loading"
              @click="onLoginEmail"
            />
          </q-card-actions>
          <q-card-section class="text-center q-pa-none">
            <p class="text-grey-6">Not reigistered? Create an Account</p>
          </q-card-section>

          <template v-if="true">
            <q-separator />
            <q-card-actions class="q-pa-md">
              <q-btn
                rounded
                color="secondary"
                size="lg"
                class="full-width"
                label="Use Offline instead"
                @click="onUseOffline"
              />
            </q-card-actions>
          </template>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useAuthStore } from 'stores/auth';
import { QInput, useQuasar } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n();
const q = useQuasar();

const email = ref<string>('');
const emailRef = ref<QInput | null>(null);
const emailRules = [
  (val: string) => val.length > 0 || t('login.validation.email.required'),
  (val: string, rules: { email: (s: string) => boolean }) =>
    rules.email(val) || t('login.valiation.format'),
];

const password = ref<string>('');
const passwordRef = ref<QInput | null>(null);
const passwordRules = [
  (val: string) => val.length > 0 || t('login.validation.password.required'),
];

const loading = ref<boolean>(false);

async function onLoginEmail() {
  loading.value = true;

  await emailRef.value?.validate();
  await passwordRef.value?.validate();

  if (emailRef.value?.hasError || passwordRef.value?.hasError) {
    loading.value = false;
    return;
  }

  authStore
    .loginEmail(email.value, password.value)
    .then(async () => {
      const origin = route.query.origin ?? '/';
      await router.push({
        path: origin as string,
      });
    })
    .catch((error) => {
      loading.value = false;

      const translationKey = 'login' + error.code;
      const message = te(translationKey) ? t(translationKey) : error.message;

      q.notify({
        message: message,
        color: 'negative',
      });
    });
}

function onUseOffline() {
  authStore.loginLocal();
}
</script>

<style scoped>
.q-card {
  min-width: 360px;
}
</style>
