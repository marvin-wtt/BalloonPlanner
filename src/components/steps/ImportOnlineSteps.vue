<template>
  <q-step
    :name
    title="Server URL"
    icon="cloud"
    :done="url?.length > 0"
  >
    <div
      class="column q-gutter-md"
      style="max-width: 300px"
    >
      <q-input
        v-model="url"
        type="url"
        label="Server URL"
        :error
        :error-message
        hide-bottom-space
        :loading
        outlined
        rounded
      />
    </div>

    <q-stepper-navigation class="row q-gutter-sm">
      <q-btn
        label="Continue"
        color="primary"
        :loading
        rounded
        :disable="url?.length === 0"
        @click="verifyUrl"
      />

      <q-btn
        label="Back"
        color="primary"
        :disable="loading"
        rounded
        outline
        @click="emit('back')"
      />
    </q-stepper-navigation>
  </q-step>

  <q-step
    name="login"
    title="Login"
    icon="login"
    :done="email?.length > 0 && password?.length > 0"
  >
    <div
      class="column q-gutter-md"
      style="max-width: 300px"
    >
      <q-input
        v-model="email"
        label="E-Mail"
        type="email"
        :error
        :error-message
        hide-bottom-space
        outlined
        rounded
        @change="errorMessage = undefined"
      />

      <q-input
        v-model="password"
        label="Password"
        type="password"
        :error
        :error-message
        hide-bottom-space
        outlined
        rounded
        @change="errorMessage = undefined"
      />
    </div>

    <q-stepper-navigation>
      <q-btn
        label="Continue"
        color="primary"
        :loading
        rounded
        :disable="
          !email || email?.length === 0 || !password || password?.length === 0
        "
        @click="login"
      />
    </q-stepper-navigation>
  </q-step>

  <q-step
    v-if="partialToken"
    name="2fa"
    title="2FA Token"
    icon="security"
    :done="otp?.length === 6"
  >
    <div
      class="column q-gutter-md"
      style="max-width: 300px"
    >
      <q-input
        v-model="otp"
        label="2FA Token"
        type="text"
        maxlength="6"
        :error
        :error-message
        hide-bottom-space
        outlined
        rounded
        @change="errorMessage = undefined"
      />
    </div>

    <q-stepper-navigation>
      <q-btn
        label="Continue"
        color="primary"
        :loading
        :disable="otp?.length !== 6"
        rounded
        @click="twoFactorLogin"
      />
    </q-stepper-navigation>
  </q-step>

  <q-step
    name="select-camp"
    title="Select Camp"
    icon="list"
    :done="campId != undefined"
  >
    <q-select
      v-model="campId"
      label="Select Camp"
      :options="campOptions"
      map-options
      emit-value
      :error
      :error-message
      hide-bottom-space
      outlined
      rounded
      @change="errorMessage = undefined"
    />

    <q-stepper-navigation>
      <q-btn
        label="Continue"
        color="primary"
        :loading
        rounded
        @click="downloadPeople"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import { computed, ref, toRaw } from 'vue';
import type { QSelectOption } from 'quasar';
import { loadJson } from 'components/steps/JsonInputLoader';
import { type Person } from 'app/src-common/entities';

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'to', name: string): void;
  (e: 'continue'): void;
  (e: 'back'): void;
}>();

const loading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const url = ref<string>();
const email = ref<string>();
const password = ref<string>();
const otp = ref<string>();
const campId = ref<string>();

const partialToken = ref<string>();
const accessToken = ref<string>();
const campOptions = ref<QSelectOption[]>();

const error = computed<boolean>(() => errorMessage.value != null);

async function verifyUrl() {
  if (!url.value || url.value.trim().length === 0) {
    errorMessage.value = 'URL cannot be empty.';
    return;
  }

  // Normalize string
  url.value = url.value.trim();
  if (!url.value.endsWith('/')) {
    url.value += '/';
  }

  url.value += 'api/v1/';

  // Ping server
  errorMessage.value = null;
  try {
    loading.value = true;
    errorMessage.value = null;

    const response = await fetch(url.value + 'health/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      errorMessage.value = `Server not reachable. Status: ${response.status}`;
      return;
    }

    emit('to', 'login');
  } catch {
    errorMessage.value =
      'Failed to connect to the server. Please check the URL.';
  } finally {
    loading.value = false;
  }
}

async function login() {
  errorMessage.value = null;
  try {
    const response = await fetch(url.value + 'auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: toRaw(email.value),
        password: toRaw(password.value),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 403 && errorData.status === 'PARTIAL_AUTH') {
        partialToken.value = errorData.token;

        emit('to', '2fa');
        return;
      }

      errorMessage.value =
        errorData.message || 'Login failed. Please try again.';
      return;
    }

    const data = await response.json();
    extractCamps(data);
    emit('to', 'select-camp');
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function twoFactorLogin() {
  errorMessage.value = null;

  try {
    const response = await fetch(url.value + 'auth/verify-otp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: toRaw(partialToken.value),
        otp: toRaw(otp.value),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorMessage.value = errorData.message || '2FA verification failed.';
      return;
    }

    const data = await response.json();
    extractCamps(data);
    emit('to', 'select-camp');
  } catch (error) {
    errorMessage.value = error.message;
    return;
  } finally {
    loading.value = false;
  }
}

interface Payload {
  profile: {
    locale: string;
    camps: {
      id: string;
      name: string | Record<string, string>;
    }[];
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
  };
}

function extractCamps(payload: Payload) {
  accessToken.value = payload.tokens.access.token;

  const shortLocale = payload.profile.locale.split('-')[0];

  campOptions.value = payload.profile.camps.map((camp) => {
    const label =
      typeof camp.name === 'string'
        ? camp.name
        : shortLocale in camp.name
          ? camp.name[shortLocale]
          : Object.values(camp.name)[0];

    return {
      label,
      value: camp.id,
    };
  });
}

async function downloadPeople() {
  errorMessage.value = null;

  try {
    const response = await fetch(
      url.value + 'camps/' + campId.value + '/registrations/',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.value}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      errorMessage.value = errorData.message || 'Failed to download camp data.';
      return;
    }

    const data = await response.json();
    modelValue.value = loadJson(data);

    emit('continue');
  } catch (error) {
    errorMessage.value = error.message;
    return;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
