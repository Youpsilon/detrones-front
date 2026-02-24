<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useGameStore } from '../stores/game'
import Sortable from 'sortablejs'
import Chat from './Chat.vue'

const gameStore = useGameStore()

// ── All data comes from reactive store refs — no more reading room.state ───
const mySessionId = computed(() => gameStore.room?.sessionId ?? '')
const players = computed(() => gameStore.gamePlayers)
const me = computed(() => players.value.find(p => p.isMe))
const otherPlayers = computed(() => players.value.filter(p => !p.isMe))
const myHand = computed(() => gameStore.gameMyHand)
const currentTrick = computed(() => gameStore.gameCurrentTrick)
const currentTurnPlayerId = computed(() => gameStore.gameCurrentTurnPlayerId)
const phase = computed(() => gameStore.gamePhase)
const isMyTurn = computed(() => currentTurnPlayerId.value !== '' && currentTurnPlayerId.value === mySessionId.value)

const NORMAL_ORDER = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];

function getCardValue(rank: string) {
  return NORMAL_ORDER.indexOf(rank);
}

function isPlayable(card: any) {
  // If it's not our turn, we usually disable them anyway visually
  if (!isMyTurn.value) return false;

  const config = gameStore.gameConfig;
  const forcedRank = gameStore.gameIsForcedRank;
  
  // A '2' can ALWAYS cut the trick (if enabled)
  if (config?.enableSpecialTwo && card.rank === "2") {
    return true;
  }

  // If a forced rank is active, ONLY that rank can be played
  if (forcedRank) {
    return card.rank === forcedRank;
  }

  // If the trick is empty, anything is playable
  if (currentTrick.value.length === 0) {
    return true;
  }

  // Otherwise check if the card's value is >= the trick's value
  // We only check against the first card of the trick for single/pairs/triples/quads
  const cardVal = getCardValue(card.rank);
  const trickVal = getCardValue(currentTrick.value[0].rank);
  
  if (cardVal < trickVal) return false;

  // New Rule: 4th card completion (activeConsecutiveCards === 3)
  const trickType = gameStore.gameCurrentTrickType;
  if (trickType === "single" && gameStore.gameActiveConsecutiveCards === 3) {
      // Must be the same rank
      return card.rank === currentTrick.value[0].rank;
  }

  // Otherwise, must play the same number of cards (except special 2s)
  // But wait! in `isPlayable(card)` we can't know the exact intent if they haven't selected multiple cards yet.
  // The backend will enforce if they play 1 card on a pair without completing a quad.
  // Visually we just allow clicking it if it's >= trick rank. 
  return true;
}

const hasPlayableCards = computed(() => {
    if (!isMyTurn.value || myHand.value.length === 0) return false;
    // We check if at least one subset of our hand could legally be played.
    // For simplicity, if they can't even play a single card or special 2, they definitely must pass.
    return myHand.value.some(card => isPlayable(card));
});

// Auto-pass if no playable cards
let autoPassTimer: ReturnType<typeof setTimeout> | null = null;
watch([isMyTurn, hasPlayableCards, phase, myHand], ([myTurn, hasCards, currentPhase, hand]) => {
    if (autoPassTimer) {
        clearTimeout(autoPassTimer);
        autoPassTimer = null;
    }

    // Only start timer if it's our turn, we are in PLAY phase, we actually hold cards (hand synced), and we have NO playable cards.
    if (myTurn && currentPhase === 'PLAY' && hand.length > 0 && !hasCards) {
        autoPassTimer = setTimeout(() => {
            if (isMyTurn.value && phase.value === 'PLAY' && !hasPlayableCards.value) {
                gameStore.room?.send('chat_message', { text: "Je n'ai pas de cartes à jouer, je passe." });
                passTurn();
            }
        }, 1500);
    }
}, { immediate: true });

// ── Card selection ─────────────────────────────────────────────────────────
const selectedCards = ref([] as any[])

function toggleCard(card: any) {
  if (!isMyTurn.value || !isPlayable(card)) return
  const key = `${card.suit}-${card.rank}`
  const idx = selectedCards.value.findIndex((c: any) => `${c.suit}-${c.rank}` === key)
  if (idx === -1) {
    if (selectedCards.value.length === 0 || selectedCards.value[0].rank === card.rank) {
      selectedCards.value = [...selectedCards.value, card]
    } else {
      selectedCards.value = [card]
    }
  } else {
    selectedCards.value = selectedCards.value.filter((_, i) => i !== idx)
  }
}

function isSelected(card: any) {
  return selectedCards.value.some(c => c.suit === card.suit && c.rank === card.rank)
}

function playSelected() {
  if (selectedCards.value.length === 0 || !isMyTurn.value) return
  gameStore.room?.send('play_card', { cards: selectedCards.value })
  selectedCards.value = []
}

function passTurn() {
  gameStore.room?.send('pass')
}

function startGame() {
  gameStore.room?.send('start_game')
}

function getSuitSymbol(suit: string) {
  return { C: '♣', D: '♦', H: '♥', S: '♠' }[suit] ?? suit
}
function isRed(suit: string) { return ['D', 'H'].includes(suit) }

const roleColors: Record<string, string> = {
  PRESIDENT: '#f59e0b',
  VICE_PRESIDENT: '#a855f7',
  VICE_TDC: '#64748b',
  TDC: '#ef4444',
  NEUTRE: '#475569',
}
const roleIcons: Record<string, string> = {
  PRESIDENT: '👑',
  VICE_PRESIDENT: '🥈',
  VICE_TDC: '🥉',
  TDC: '💩',
  NEUTRE: '👤',
}

function getMmrText(role: string) {
  if (role === 'PRESIDENT' || role === 'VICE_PRESIDENT') return '+30 MMR'
  if (role === 'TDC' || role === 'VICE_TDC') return '-30 MMR'
  return '+0 MMR'
}

function getMmrColorClass(role: string) {
  if (role === 'PRESIDENT' || role === 'VICE_PRESIDENT') return 'text-emerald-400'
  if (role === 'TDC' || role === 'VICE_TDC') return 'text-red-400'
  return 'text-slate-400'
}

// ── Hand Sorting (SortableJS) ─────────────────────────────────────────────
const handContainerRef = ref<HTMLElement | null>(null)
let handSortableInstance: Sortable | null = null

function initSortable() {
  if (handContainerRef.value && !handSortableInstance) {
    handSortableInstance = new Sortable(handContainerRef.value, {
      animation: 150,
      ghostClass: 'opacity-50',
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          const movedItem = gameStore.gameMyHand.splice(evt.oldIndex, 1)[0]
          gameStore.gameMyHand.splice(evt.newIndex, 0, movedItem)
        }
      }
    })
  }
}

watch(() => myHand.value.length, async () => {
  await nextTick()
  initSortable()
})

onMounted(async () => {
  await nextTick()
  initSortable()
})

onBeforeUnmount(() => {
  if (handSortableInstance) {
      handSortableInstance.destroy()
      handSortableInstance = null
  }
  if (autoPassTimer) {
      clearTimeout(autoPassTimer)
  }
})
</script>

<template>
  <div class="flex flex-col h-screen" style="background: #0a0a14;">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3"
      style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <div class="flex items-center gap-3">
        <span class="text-lg">🃏</span>
        <span class="font-mono font-bold text-sm" style="color: #a855f7;">
          Code: {{ gameStore.currentRoomId }}
        </span>
        <span v-if="phase" class="text-xs px-2 py-0.5 rounded-full font-medium"
          style="background: rgba(16,185,129,0.1); color: #34d399;">
          {{ phase }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="gameStore.isHost && (!phase || phase === 'LOBBY')"
          @click="startGame"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; cursor: pointer;">
          🚀 Lancer la partie
        </button>
        <button @click="gameStore.leaveGame"
          class="px-3 py-2 rounded-lg text-sm"
          style="color: #64748b; border: 1px solid rgba(255,255,255,0.08); cursor: pointer;">
          Quitter
        </button>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Board -->
      <div class="flex-1 flex flex-col relative">

        <!-- Other players -->
        <div class="flex justify-center gap-4 p-4 flex-wrap">
          <div v-for="player in otherPlayers" :key="player.id"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl"
            :style="{
              background: player.id === currentTurnPlayerId ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
              border: player.id === currentTurnPlayerId ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
            }">
            <div class="text-sm font-semibold" style="color: #f1f5f9;">{{ player.username }}</div>
            <div class="text-xs" style="color: #64748b;">🂠 {{ player.handCount }} cartes</div>
            <div v-if="player.id === currentTurnPlayerId" class="text-xs font-medium" style="color: #a855f7;">⚡ Son tour</div>
            <div v-if="player.role && player.role !== 'NEUTRE'"
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :style="{ background: 'rgba(0,0,0,0.3)', color: roleColors[player.role] }">
              {{ player.role }}
            </div>
          </div>
        </div>

        <!-- Center table -->
        <div class="flex-1 flex flex-col items-center justify-center gap-4">
          <div class="rounded-full flex items-center justify-center"
            style="width: 220px; height: 220px; background: radial-gradient(circle, rgba(124,58,237,0.1), rgba(10,10,20,0.5)); border: 2px solid rgba(124,58,237,0.2);">
            <div v-if="currentTrick.length > 0" class="flex gap-2">
              <div v-for="(card, idx) in currentTrick" :key="idx"
                class="rounded-lg flex flex-col items-center justify-center shadow-xl"
                style="width: 52px; height: 76px; background: white; border: 1px solid #e2e8f0;">
                <span class="font-bold text-base leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ card.rank }}</span>
                <span class="text-xl leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ getSuitSymbol(card.suit) }}</span>
              </div>
            </div>
            <div v-else class="text-sm pointer-events-none" style="color: rgba(255,255,255,0.2);">Tapis vide</div>
          </div>

          <!-- Actions -->
          <div v-if="phase === 'PLAY'" class="flex gap-3 items-center">
            <div v-if="isMyTurn" class="text-xs px-3 py-1 rounded-full font-medium animate-pulse"
              style="background: rgba(124,58,237,0.2); color: #a855f7;">⚡ Ton tour</div>
            <button v-if="isMyTurn && selectedCards.length > 0"
              @click="playSelected"
              class="px-5 py-2 rounded-xl font-semibold text-sm transition-all"
              style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; cursor: pointer;">
              Jouer ({{ selectedCards.length }})
            </button>
            <button v-if="isMyTurn"
              @click="passTurn"
              class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); cursor: pointer;">
              Passer
            </button>
          </div>
        </div>

        <!-- My hand -->
        <div class="p-4 space-y-2">
          <div class="text-center text-xs mb-2" style="color: #475569;">
            <span v-if="!phase || phase === 'LOBBY'">En attente du lancement...</span>
            <span v-else-if="isMyTurn" style="color: #a855f7; font-weight: 600;">Sélectionne tes cartes puis clique Jouer</span>
            <span v-else>Tour de l'adversaire...</span>
          </div>
          <div class="flex gap-2 justify-center overflow-x-auto pb-2" ref="handContainerRef">
            <div v-for="(card, idx) in myHand" :key="`${card.suit}-${card.rank}-${idx}`"
              :data-rank="card.rank"
              :data-suit="card.suit"
              @click="toggleCard(card)"
              class="rounded-lg flex flex-col items-center justify-center shadow-xl flex-shrink-0 transition-all duration-150"
              :class="{ 
                 'cursor-pointer': isMyTurn && isPlayable(card),
                 'unplayable': (!isPlayable(card) && !isSelected(card))
              }"
              style="width: 56px; height: 80px; background: white; border: 1px solid #e2e8f0;"
              :style="{
                transform: isSelected(card) ? 'translateY(-12px)' : 'translateY(0)',
                boxShadow: isSelected(card) ? '0 0 0 2px #7c3aed, 0 8px 16px rgba(124,58,237,0.4)' : undefined,
                opacity: (!isPlayable(card)) && !isSelected(card) ? '0.3' : '1',
                filter: (!isPlayable(card)) && !isSelected(card) ? 'grayscale(80%)' : 'none',
              }">
              <span class="font-bold text-base leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ card.rank }}</span>
              <span class="text-xl leading-none" :style="{ color: isRed(card.suit) ? '#ef4444' : '#1e293b' }">{{ getSuitSymbol(card.suit) }}</span>
            </div>
            <div v-if="myHand.length === 0 && phase === 'PLAY'"
              class="text-sm py-4" style="color: #475569;">
              Tu n'as plus de cartes 🎉
            </div>
          </div>
        </div>
      </div>

      <!-- Chat -->
      <div class="w-72 flex-shrink-0 p-3" style="border-left: 1px solid rgba(255,255,255,0.06);">
        <Chat />
      </div>
    </div>

    <!-- Modale de Fin de Partie (RESULTS) -->
    <div v-if="phase === 'RESULTS'"
      class="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(255,255,255,0.1);">
        
        <div class="p-6 text-center border-b border-white/10">
          <h2 class="text-3xl font-bold bg-clip-text text-transparent"
              style="background-image: linear-gradient(to right, #a855f7, #ec4899);">
            Fin de la Manche
          </h2>
          <p class="text-sm text-slate-400 mt-2">Le Président a triomphé !</p>
        </div>

        <div class="p-6 space-y-3">
          <div v-for="(player, idx) in players" :key="player.id"
            class="flex items-center justify-between p-3 rounded-lg"
            :style="{ background: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${roleColors[player.role || 'NEUTRE']}` }">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ roleIcons[player.role || 'NEUTRE'] }}</span>
              <div class="flex flex-col">
                <span class="font-bold text-slate-100">{{ player.username }}</span>
                <span class="text-xs" :style="{ color: roleColors[player.role || 'NEUTRE'] }">
                  {{ player.role }}
                </span>
              </div>
            </div>
            <!-- Fake MMR variance for now based strictly on role -->
            <div class="font-mono text-sm font-bold" :class="getMmrColorClass(player.role || 'NEUTRE')">
              {{ getMmrText(player.role || 'NEUTRE') }}
            </div>
          </div>
        </div>

        <div class="p-6 flex justify-center gap-4 bg-black/20">
          <button v-if="gameStore.isHost" @click="startGame"
            class="w-full py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105"
            style="background: linear-gradient(135deg, #7c3aed, #ec4899); box-shadow: 0 4px 15px rgba(124,58,237,0.3);">
            Relancer une Manche
          </button>
          <div v-else class="text-sm font-medium text-slate-400 py-3">
            En attente du chef de salon...
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
