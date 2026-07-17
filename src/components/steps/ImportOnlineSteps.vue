<template>
  <q-step
    :name
    title="Server URL"
    icon="cloud"
    :done="!!server"
  >
    <div
      class="column q-gutter-md"
      style="max-width: 300px"
    >
      <q-input
        v-model="server"
        type="url"
        label="Server URL"
        :error
        :error-message
        hide-bottom-space
        :loading
        autofocus
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
        :disable="!server"
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
    :done="!!email && !!password"
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
        autofocus
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
        :disable="!email || !password"
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
        autofocus
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
    :done="!!campId"
  >
    <div
      class="column q-gutter-md"
      style="max-width: 300px"
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
    </div>

    <q-stepper-navigation>
      <q-btn
        label="Continue"
        color="primary"
        :loading
        rounded
        :disable="!campId"
        @click="downloadPeople"
      />
    </q-stepper-navigation>
  </q-step>
</template>

<script lang="ts" setup>
import { computed, ref, toRaw } from 'vue';
import type { QSelectOption } from 'quasar';
import { loadJson } from '@/components/steps/JsonInputLoader';
import { type Person } from '@/../src-common/entities';

const modelValue = defineModel<Person[]>();

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'to', name: string): void;
  (e: 'continue' | 'back'): void;
}>();

const loading = ref(false);
const errorMessage = ref<string>();

const server = ref<string>();
const email = ref<string>();
const password = ref<string>();
const otp = ref<string>();
const campId = ref<string>();

const partialToken = ref<string>();
const accessToken = ref<string>();
const locale = ref<string>();
const campOptions = ref<QSelectOption[]>();

const error = computed(() => errorMessage.value != undefined);
const url = computed(() => {
  const serverUrl = server.value?.trim();
  if (!serverUrl) {
    return undefined;
  }

  const withProtocol = serverUrl.startsWith('https://')
    ? serverUrl
    : `https://${serverUrl}`;

  return new URL('api/v1/', `${withProtocol.replace(/\/+$/, '')}/`).toString();
});

interface ErrorResponse {
  message?: string;
  status?: string;
  token?: string;
}

interface LoginResponse {
  profile: {
    locale: string;
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
  };
}

interface Camp {
  id: string;
  name: string | Record<string, string>;
}

class ServerError extends Error {
  constructor(
    readonly status: number,
    readonly data: ErrorResponse,
  ) {
    super(data.message);
  }
}

async function request<T>(
  method: 'GET' | 'POST',
  route: string,
  payload?: unknown,
): Promise<T> {
  const baseUrl = url.value;
  if (!baseUrl) {
    throw new Error('Server URL is not set.');
  }

  const headers = new Headers({ 'X-Client-Type': 'app' });
  if (accessToken.value) {
    headers.set('Authorization', `Bearer ${accessToken.value}`);
  }
  if (payload !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(new URL(route.replace(/^\/+/, ''), baseUrl), {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => undefined)) as unknown;
  if (!response.ok) {
    throw new ServerError(
      response.status,
      (data as ErrorResponse | undefined) ?? {},
    );
  }

  return data as T;
}

// Runs a step, toggling the loading flag and surfacing a friendly message on failure.
async function run(action: () => Promise<void>, fallbackMessage: string) {
  loading.value = true;
  errorMessage.value = undefined;

  try {
    await action();
  } catch (err) {
    errorMessage.value =
      err instanceof ServerError
        ? (err.data.message ?? fallbackMessage)
        : fallbackMessage;
  } finally {
    loading.value = false;
  }
}

function verifyUrl() {
  if (!url.value) {
    errorMessage.value = 'URL cannot be empty.';
    return;
  }

  return run(async () => {
    await request('GET', 'health/');
    emit('to', 'login');
  }, 'Failed to connect to the server. Please check the URL.');
}

function login() {
  return run(async () => {
    try {
      const data = await request<LoginResponse>('POST', 'auth/login/', {
        email: toRaw(email.value),
        password: toRaw(password.value),
      });

      await handleAuthResponse(data);
    } catch (err) {
      handleAuthError(err);
    }
  }, 'Login failed. Please try again.');
}

function twoFactorLogin() {
  return run(async () => {
    const data = await request<LoginResponse>('POST', 'auth/verify-otp/', {
      token: toRaw(partialToken.value),
      otp: toRaw(otp.value),
    });

    await handleAuthResponse(data);
  }, '2FA verification failed.');
}

async function handleAuthResponse(response: LoginResponse) {
  applyAuth(response);
  await loadCamps();
  emit('to', 'select-camp');
}

function handleAuthError(error: unknown) {
  if (
    error instanceof ServerError &&
    error.status === 403 &&
    error.data.status === 'PARTIAL_AUTH'
  ) {
    partialToken.value = error.data.token;
    emit('to', '2fa');
    return;
  }

  throw error;
}

function downloadPeople() {
  const camp = campId.value;
  if (!camp || !accessToken.value) {
    return;
  }

  return run(async () => {
    const data = await request('GET', `camps/${camp}/registrations/`);
    modelValue.value = loadJson(data);
    emit('continue');
  }, 'Failed to download camp data.');
}

function applyAuth(response: LoginResponse) {
  accessToken.value = response.tokens.access.token;
  locale.value = response.profile.locale;
}

async function loadCamps() {
  const response = await request<{ data: Camp[] }>(
    'GET',
    'camps/?view=assigned',
  );
  const camps = response.data;

  // Prefer the country subtag (e.g. "DE" of "de-DE") over the language ("de").
  const [language = '', country = ''] = locale.value?.split('-') ?? [];
  const preferredKeys = [country, language].filter((key) => key.length > 0);

  campOptions.value = camps.map((camp) => ({
    label: campLabel(camp, preferredKeys),
    value: camp.id,
  }));
}

function campLabel(camp: Camp, preferredKeys: string[]): string {
  const name = camp.name;
  if (typeof name === 'string') {
    return name;
  }

  const key = preferredKeys.find((candidate) => candidate in name);
  return key ? (name[key] ?? '') : (Object.values(name)[0] ?? '');
}
</script>

<style scoped></style>
