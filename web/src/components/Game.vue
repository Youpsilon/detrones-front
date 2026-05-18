<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useGameStore } from '../stores/game'
import Sortable from 'sortablejs'
import Chat from './Chat.vue'

const gameStore = useGameStore()

const showRules = ref(false)

// ── All data comes from reactive store refs — no more reading room.state ───
const mySessionId = computed(() => gameStore.room?.sessionId ?? '')
const players = computed(() => gameStore.gamePlayers)
const me = computed(() => players.value.find(p => p.isMe))
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
  
  // If a forced rank is active, ONLY that rank can be played
  if (forcedRank) {
    return card.rank === forcedRank;
  }

  // If the trick is empty, anything is playable
  if (currentTrick.value.length === 0) {
    return true;
  }

  // Check if we have enough cards of this rank to match the trick
  const countInHand = myHand.value.filter((c: any) => c.rank === card.rank).length;
  if (countInHand < currentTrick.value.length) {
      return false;
  }

  // A '2' can ALWAYS cut the trick (if enabled), provided we have enough of them
  if (config?.enableSpecialTwo && card.rank === "2") {
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
  // Visually we allow clicking it if it's >= trick rank and we have enough cards.
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

const turnStartTime = ref(Date.now())
const now = ref(Date.now())

watch([currentTurnPlayerId, () => currentTrick.value], () => {
  turnStartTime.value = Date.now()
})

watch(currentTurnPlayerId, () => {
  selectedCards.value = []
})

const turnProgress = computed(() => {
  const timeoutMs = gameStore.gameConfig?.turnTimeoutMs || 30000;
  if (!timeoutMs) return 0;
  const elapsed = now.value - turnStartTime.value;
  const p = 1 - (elapsed / timeoutMs);
  return Math.max(0, p);
})

function toggleCard(card: any) {
  if (!isMyTurn.value || !isPlayable(card)) return
  const key = `${card.suit}-${card.rank}`
  const idx = selectedCards.value.findIndex((c: any) => `${c.suit}-${c.rank}` === key)
  
  if (idx === -1) {
    if (selectedCards.value.length === 0 || selectedCards.value[0].rank !== card.rank) {
      selectedCards.value = [card]
    } else {
      let limit = 4;
      if (currentTrick.value.length > 0 && card.rank !== '2') {
        limit = currentTrick.value.length;
      }
      if (selectedCards.value.length < limit) {
        selectedCards.value = [...selectedCards.value, card]
      }
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

let timerInterval: any = null;

onMounted(async () => {
  await nextTick()
  initSortable()
  timerInterval = setInterval(() => {
    now.value = Date.now()
  }, 100)
})

onBeforeUnmount(() => {
  if (handSortableInstance) {
      handSortableInstance.destroy()
      handSortableInstance = null
  }
  if (autoPassTimer) {
      clearTimeout(autoPassTimer)
  }
  if (timerInterval) {
      clearInterval(timerInterval)
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
        <button @click="showRules = true" class="px-3 py-2 rounded-lg text-sm" style="color: #64748b; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; background: rgba(255,255,255,0.05);">
          📖 Règles
        </button>
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

        <!-- All players -->
        <div class="flex justify-center gap-4 p-4 flex-wrap">
          <div v-for="player in players" :key="player.id"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl relative overflow-hidden"
            :style="{
              background: player.id === currentTurnPlayerId ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
              border: player.id === currentTurnPlayerId ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
            }">
            <div class="text-sm font-semibold" style="color: #f1f5f9;">
              {{ player.username }} <span v-if="player.isMe" class="text-xs" style="color: #a855f7;">(Moi)</span>
            </div>
            <div class="text-xs" style="color: #64748b;">🂠 {{ player.handCount }} cartes</div>
            <div v-if="player.id === currentTurnPlayerId" class="text-xs font-medium" style="color: #a855f7;">⚡ Son tour</div>
            <div v-if="player.role && player.role !== 'NEUTRE'"
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :style="{ background: 'rgba(0,0,0,0.3)', color: roleColors[player.role] }">
              {{ player.role }}
            </div>
            <div v-if="player.id === currentTurnPlayerId && phase === 'PLAY'" 
                 class="absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear"
                 :style="{ 
                    width: `${turnProgress * 100}%`,
                    background: turnProgress < 0.25 ? '#ef4444' : '#a855f7'
                 }">
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
          <div class="flex gap-2 justify-center overflow-x-auto pt-4 pb-2" ref="handContainerRef">
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

    <!-- Règles Modale -->
    <div v-if="showRules" class="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4" @click.self="showRules = false">
      <div class="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1);">
        <div class="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">📖 Règles du Président</h2>
          <button @click="showRules = false" class="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">✕</button>
        </div>
        <div class="p-6 overflow-y-auto text-sm text-slate-300 space-y-4">
          <p><strong>Hiérarchie des cartes :</strong> 3, 4, 5, 6, 7, 8, 9, 10, Valet, Dame, Roi, As, 2.</p>
          <p><strong>Le but :</strong> Se débarrasser de toutes ses cartes en premier.</p>
          <p><strong>Déroulement :</strong> Le premier joueur pose une carte (ou une paire, brelan, carré). Les joueurs suivants doivent poser le <strong>même nombre de cartes</strong>, d'une valeur <strong>égale ou supérieure</strong>.</p>
          <p><strong>Le 2 :</strong> C'est la carte spéciale. Elle permet de couper n'importe quel pli et donne instantanément la main au joueur qui l'a posée.</p>
          <p><strong>Couper un pli :</strong> Jouer une carte de même valeur que la précédente oblige le joueur suivant à jouer cette même valeur (et non une valeur supérieure) ou à passer son tour.</p>
          <p><strong>Le Carré :</strong> Si 4 cartes de même valeur se retrouvent sur la table (jouées en une ou plusieurs fois), le pli se termine immédiatement. Le joueur qui a complété le carré remporte le pli.</p>
          <p><strong>Passer :</strong> Si vous ne pouvez ou ne voulez pas jouer, vous passez. Vous pourrez rejouer au prochain tour, sauf si tous les joueurs passent consécutivement.</p>
          <p><strong>Rôles :</strong> Le 1er à finir est Président 👑, le 2ème Vice-Président 🥈, l'avant-dernier Vice-Trou du Cul 🥉, le dernier Trou du Cul 💩. À la manche suivante, le Président échange ses 2 pires cartes contre les 2 meilleures du TDC (et inversement). Idem pour 1 carte avec les Vices.</p>
        </div>
        <div class="p-4 border-t border-white/10 flex justify-end">
           <button @click="showRules = false" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all" style="background: rgba(255,255,255,0.1); color: white; cursor: pointer;">
             Fermer
           </button>
        </div>
      </div>
    </div>
  </div>
</template>
