<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NGlobalStyle } from 'naive-ui'
</script>

<template>
  <NConfigProvider>
    <NGlobalStyle />
    <NMessageProvider>
      <div class="min-h-screen bg-gray-900 text-white">
        <router-view />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
