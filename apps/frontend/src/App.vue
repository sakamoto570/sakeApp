<script setup lang="ts">
import AppHeader from "./components/layout/AppHeader.vue";
</script>

<template>
  <AppHeader />
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  background: #fbfcfa;
  color: #1b241d;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  margin: 0;
}

.app-main {
  margin: 0 auto;
  max-width: 960px;
  padding: 28px 24px;
}
</style>
