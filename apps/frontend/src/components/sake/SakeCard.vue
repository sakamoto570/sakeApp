<script setup lang="ts">
import type { SakeSummary } from "@sake-app/shared";

defineProps<{ sake: SakeSummary }>();
</script>

<template>
  <article>
    <h2>{{ sake.name }}</h2>
    <p>{{ sake.brewery }} / {{ sake.prefecture }}</p>
  </article>
</template>

