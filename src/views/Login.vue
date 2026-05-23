<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppInput from '../components/Input.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.statusMessage || 'Identifiants incorrects')
    authStore.setAuth(data.token, data.user)
    router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: #070c15;">

    <!-- Ambient glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]"
           style="background: radial-gradient(circle, #9b7134, transparent); filter: blur(80px);"></div>
      <div class="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full opacity-[0.04]"
           style="background: radial-gradient(circle, #b8935c, transparent); filter: blur(60px);"></div>
    </div>

    <div class="w-full max-w-[400px] relative z-10">

      <!-- Logo / Branding -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/5 mb-5 shadow-[0_0_30px_rgba(155,113,52,0.12)]">
          <img src="/logo.png" alt="Président" class="w-10 h-10 object-contain" />
        </div>
        <h1 class="text-2xl font-bold text-white font-cinzel tracking-widest uppercase">Président</h1>
        <p class="text-sm text-slate-500 mt-1.5 font-medium">Le jeu de cartes en ligne</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl p-8 border"
           style="background: rgba(17,22,33,0.95); border-color: rgba(255,255,255,0.07); backdrop-filter: blur(16px);">

        <h2 class="text-lg font-bold text-white mb-1">Connexion</h2>
        <p class="text-xs text-slate-500 mb-7">Content de te revoir ! Connecte-toi pour jouer.</p>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <AppInput
            v-model="form.email"
            label="Adresse email"
            type="email"
            placeholder="ton@email.com"
            :required="true"
            autocomplete="email"
          />

          <AppInput
            v-model="form.password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            :required="true"
            autocomplete="current-password"
          />

          <!-- Error -->
          <div v-if="error"
               class="flex items-start gap-2.5 text-sm p-3.5 rounded-xl"
               style="background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.18);">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading || !form.email || !form.password"
            class="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 mt-2 relative overflow-hidden"
            :class="loading || !form.email || !form.password
              ? 'bg-primary/30 text-primary/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-light hover:to-primary shadow-lg shadow-primary/15 active:scale-[0.98] cursor-pointer'"
          >
            <span v-if="!loading">Se connecter</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Connexion…
            </span>
          </button>
        </form>
      </div>

      <!-- Footer link -->
      <p class="text-center text-sm mt-6 text-slate-500">
        Pas encore de compte ?
        <router-link to="/register" class="text-primary font-semibold hover:text-primary-light transition-colors ml-1">
          S'inscrire
        </router-link>
      </p>
    </div>
  </div>
</template>
