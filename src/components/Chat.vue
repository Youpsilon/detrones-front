<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

function sendMessage() {
  if (!messageInput.value.trim()) return
  gameStore.sendChat(messageInput.value)
  messageInput.value = ''
}

watch(() => gameStore.chatMessages.length, () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
})
</script>

<template>
  <div class="flex flex-col h-full rounded-xl overflow-hidden" style="background: rgba(15,15,26,0.85); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
    <div class="px-3 py-2 font-semibold text-sm" style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #a855f7;">
      💬 Chat
    </div>

    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-3 space-y-2">
      <div v-if="gameStore.chatMessages.length === 0" class="text-center text-sm py-4" style="color: #475569;">
        Aucun message pour l'instant...
      </div>
      <div v-for="(msg, idx) in gameStore.chatMessages" :key="idx" class="text-sm">
        <span class="font-bold" style="color: #a855f7;">{{ msg.sender }}:</span>
        <span class="ml-1" style="color: #e2e8f0;">{{ msg.text }}</span>
      </div>
    </div>

    <div class="p-2 flex gap-2" style="border-top: 1px solid rgba(255,255,255,0.08);">
      <input
        v-model="messageInput"
        @keyup.enter="sendMessage"
        placeholder="Message..."
        class="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
      />
      <button
        @click="sendMessage"
        class="rounded-lg px-3 py-2 text-sm font-semibold transition-all"
        style="background: #7c3aed; color: white;"
      >→</button>
    </div>
  </div>
</template>
