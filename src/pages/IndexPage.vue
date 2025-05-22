<template>
  <q-page class="bg-primary row justify-center content-center">
    <q-spinner-ios
      color="white"
      size="25%"
      :thickness="2"
    />
  </q-page>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();

onMounted(async () => {
  await router.push({ name: 'projects' });
});
</script>
