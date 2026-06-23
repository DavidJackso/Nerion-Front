<script setup lang="ts">
const route = useRoute()
await navigateTo(`/spaces/${route.params.slug}/tables`, { replace: true })
</script>
<template>
  <div></div>
</template>
