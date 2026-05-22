<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Loader2 } from '@lucide/vue'
import Button from '../components/Button.vue'

const router = useRouter()
const leaderboard = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/leaderboard')
    if (res.ok) {
      leaderboard.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch leaderboard', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="px-8 py-10">
    <div class="w-full">
      <div class="flex flex-col items-center mb-10">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5 mb-4">
          <Trophy class="w-8 h-8 text-amber-500" />
        </div>
        <h1 class="text-3xl font-black tracking-wide text-slate-100 uppercase">Classement Général</h1>
        <p class="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Les meilleurs présidents de l'arène</p>
      </div>
      
      <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <span class="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Chargement de l'arène...</span>
      </div>
      
      <div v-else-if="leaderboard.length === 0" 
           class="rounded-3xl p-10 text-center flex flex-col items-center justify-center bg-background-2 border"
           style="border-color: rgba(255, 255, 255, 0.06); backdrop-filter: blur(10px);">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-slate-500">
          <Trophy class="w-8 h-8 opacity-40" />
        </div>
        <h2 class="text-xl font-bold text-slate-300">Le classement est vide</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-sm">
          Il n'y a actuellement aucun joueur dans le classement. Rejoignez ou créez une partie pour être le premier à inscrire votre nom !
        </p>
        <Button variant="primary" size="md" class="mt-6" @click="router.push('/')">
          Lancer une partie
        </Button>
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="(user, index) in leaderboard" :key="user.id" 
             @click="router.push(`/profile/${user.id}`)"
             class="rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer hover:bg-white/5 hover:border-primary/20 bg-background-2 border"
             style="border-color: rgba(255,255,255,0.06);">
          <div class="flex items-center gap-4">
            <div class="text-xl font-black w-8 text-center" :style="{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#64748b' }">
              #{{ index + 1 }}
            </div>
            
            <div class="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border" style="border-color: rgba(255,255,255,0.08);" v-if="user.avatarUrl">
              <img :src="user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:3000${user.avatarUrl}`" :alt="user.username" class="w-full h-full object-cover" @error="(e: any) => e.target.style.display='none'" />
            </div>
            <div v-else class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold bg-gradient-to-br from-primary/15 to-primary-light/15 text-primary-light border border-primary/15">
              {{ (user.username || '?').slice(0, 2).toUpperCase() }}
            </div>
            
            <div class="font-bold text-lg text-slate-200">{{ user.username }}</div>
          </div>
          <div class="font-mono font-black text-lg text-primary">
            {{ user.mmr }} <span class="text-xs text-slate-500 uppercase">MMR</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
