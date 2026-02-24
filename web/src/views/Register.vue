<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formValue = ref({ email: '', username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValue.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.statusMessage || 'Registration failed')
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
  <div class="min-h-screen flex items-center justify-center px-4" style="background: #0f0f1a;">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
           style="background: radial-gradient(circle, #7c3aed, transparent); filter: blur(60px);"></div>
    </div>

    <div class="w-full max-w-sm relative">
      <div class="text-center mb-8">
        <div class="text-4xl mb-2">🃏</div>
        <h1 class="text-3xl font-bold" style="color: #f1f5f9;">Président</h1>
        <p class="text-sm mt-1" style="color: #64748b;">Le jeu de cartes en ligne</p>
      </div>

      <div class="rounded-2xl p-8" style="background: rgba(22,33,62,0.8); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
        <h2 class="text-xl font-semibold mb-6" style="color: #f1f5f9;">Créer un compte</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: #94a3b8;">Email</label>
            <input v-model="formValue.email" type="email" placeholder="ton@email.com"
              class="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: #94a3b8;">Pseudo</label>
            <input v-model="formValue.username" type="text" placeholder="MonPseudo"
              class="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: #94a3b8;">Mot de passe</label>
            <input v-model="formValue.password" type="password" placeholder="•••••• (min. 6 caractères)"
              class="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
              @keyup.enter="handleRegister"
            />
          </div>

          <div v-if="error" class="text-sm p-3 rounded-lg" style="background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2);">
            {{ error }}
          </div>

          <button @click="handleRegister" :disabled="loading"
            class="w-full py-3 rounded-lg font-semibold text-sm transition-all mt-2"
            style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; cursor: pointer;"
            :style="loading ? 'opacity: 0.7' : ''"
          >
            {{ loading ? 'Création...' : 'Créer le compte' }}
          </button>
        </div>

        <p class="text-center text-sm mt-6" style="color: #64748b;">
          Déjà un compte ?
          <router-link to="/login" style="color: #a855f7;" class="font-medium hover:underline">Se connecter</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
