<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Sonner
      class="pointer-events-auto"
      :theme="colorMode.preference as any || 'system'"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
const { locale } = useI18n();
const colorMode = useColorMode();
</script>
