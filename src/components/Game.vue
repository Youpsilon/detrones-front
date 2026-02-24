<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import Chat from './Chat.vue'

const gameStore = useGameStore()

const mySessionId = computed(() => gameStore.room?.sessionId)
const players = computed(() => {
  if (!gameStore.room) return []
  return Object.values(gameStore.room.state.players).map((p: any) => ({
    ...p,
    isMe: p.id === mySessionId.value
  }))
})

const myHand = computed(() => {
  const me = players.value.find(p => p.isMe)
  return me?.hand || []
})

const currentTrick = computed(() => gameStore.room?.state.currentTrick || [])
const currentTurnPlayerId = computed(() => gameStore.room?.state.currentTurnPlayerId)
const isMyTurn = computed(() => currentTurnPlayerId.value === mySessionId.value)

function playCards(cards: any[]) {
  gameStore.room?.send("play_card", { cards })
}

function passTurn() {
  gameStore.room?.send("pass")
}

function startGame() {
  gameStore.room?.send("start_game")
}

const phase = computed(() => gameStore.room?.state.phase)

function getSuitSymbol(suit: string) {
  switch (suit) {
    case 'C': return '♣'
    case 'D': return '♦'
    case 'H': return '♥'
    case 'S': return '♠'
    default: return suit
  }
}

function isRed(suit: string) {
  return ['D', 'H'].includes(suit)
}

const roleColors: Record<string, string> = {
  PRESIDENT: '#f59e0b',
  VICE_PRESIDENT: '#a855f7',
  VICE_TDC: '#64748b',
  TDC: '#ef4444',
  NEUTRE: '#475569',
}
</script>

<template>
  <div class="flex flex-col h-screen" style="background: #0a0a14;">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <div class="flex items-center gap-3">
        <span class="text-lg">🃏</span>
        <span class="font-mono font-bold text-sm" style="color: #a855f7;">Code: {{ gameStore.currentRoomId }}</span>
        <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background: rgba(16,185,129,0.1); color: #34d399;">
          {{ phase }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <!-- Start game button (host only) -->
        <button v-if="gameStore.isHost"
          @click="startGame"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; cursor: pointer;"
        >
          🚀 Lancer la partie
        </button>
        <button @click="gameStore.leaveGame"
          class="px-3 py-2 rounded-lg text-sm"
          style="color: #64748b; border: 1px solid rgba(255,255,255,0.08); cursor: pointer;"
        >
          Quitter
        </button>
      </div>
    </div>

    <!-- Main game area -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Game board -->
      <div class="flex-1 flex flex-col relative">

        <!-- Other players (top) -->
        <div class="flex justify-center gap-4 p-4 flex-wrap">
          <div
            v-for="player in players.filter(p => !p.isMe)"
            :key="player.id"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl"
            :style="{
              background: player.id === currentTurnPlayerId ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
              border: player.id === currentTurnPlayerId ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
            }"
          >
            <div class="text-sm font-semibold" style="color: #f1f5f9;">{{ player.username }}</div>
            <div class="text-xs" style="color: #64748b;">🂠 {{ player.handCount }} cartes</div>
            <div v-if="player.id === currentTurnPlayerId" class="text-xs font-medium" style="color: #a855f7;">⚡ Son tour</div>
            <div v-if="player.role && player.role !== 'NEUTRE'" class="text-xs px-2 py-0.5 rounded-full font-medium"
              :style="{ background: 'rgba(0,0,0,0.3)', color: roleColors[player.role] }">
              {{ player.role }}
            </div>
          </div>
        </div>

        <!-- Center table / current trick -->
        <div class="flex-1 flex items-center justify-center">
          <div class="rounded-full flex items-center justify-center"
            style="width: 220px; height: 220px; background: radial-gradient(circle, rgba(124,58,237,0.1), rgba(10,10,20,0.5)); border: 2px solid rgba(124,58,237,0.2);">
            <div v-if="currentTrick.length > 0" class="flex gap-2">
              <div v-for="(card, idx) in currentTrick" :key="idx"
                class="rounded-lg flex flex-col items-center justify-center shadow-xl"
                style="width: 52px; height: 76px; background: white; border: 1px solid #e2e8f0;"
              >
                <span class="font-bold text-base leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ card.rank }}</span>
                <span class="text-xl leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ getSuitSymbol(card.suit) }}</span>
              </div>
            </div>
            <div v-else class="text-sm" style="color: rgba(255,255,255,0.2);">Tapis vide</div>
          </div>
        </div>

        <!-- My player info + action -->
        <div class="p-4 space-y-3">
          <!-- My info -->
          <div class="flex items-center justify-center gap-3">
            <div class="text-sm font-semibold" style="color: #f1f5f9;">
              {{ players.find(p => p.isMe)?.username || 'Moi' }}
            </div>
            <div v-if="isMyTurn" class="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
              style="background: rgba(124,58,237,0.2); color: #a855f7;">⚡ Ton tour</div>
          </div>

          <!-- Hand -->
          <div class="flex gap-2 justify-center overflow-x-auto pb-1">
            <div v-for="(card, idx) in myHand" :key="idx"
              @click="isMyTurn && playCards([card])"
              class="rounded-lg flex flex-col items-center justify-center shadow-xl flex-shrink-0 card-playing"
              style="width: 56px; height: 80px; background: white; border: 1px solid #e2e8f0;"
              :style="isMyTurn ? 'cursor: pointer;' : 'opacity: 0.6;'"
            >
              <span class="font-bold text-base leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ card.rank }}</span>
              <span class="text-xl leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ getSuitSymbol(card.suit) }}</span>
            </div>
            <div v-if="myHand.length === 0 && phase === 'LOBBY'" class="text-sm py-4" style="color: #475569;">
              En attente du lancement de la partie...
            </div>
          </div>

          <!-- Actions -->
          <div v-if="phase === 'PLAY'" class="flex justify-center">
            <button
              @click="passTurn"
              :disabled="!isMyTurn"
              class="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); cursor: pointer;"
              :style="!isMyTurn ? 'opacity: 0.3; cursor: not-allowed;' : ''"
            >
              Passer
            </button>
          </div>
        </div>
      </div>

      <!-- Chat sidebar -->
      <div class="w-72 flex-shrink-0 p-3" style="border-left: 1px solid rgba(255,255,255,0.06);">
        <Chat />
      </div>
    </div>
  </div>
</template>
