<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from '../components/Button.vue'

const router = useRouter()
const authStore = useAuthStore()
const formValue = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValue.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.statusMessage || 'Login failed')
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
  <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background-1">


    <div class="w-full max-w-sm relative">
      <!-- Logo -->
      <div class="text-center mb-8 flex flex-col items-center">
        <div class="mb-3 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Président Logo" 
            class="w-14 h-auto object-contain"
          />
        </div>
        <div>
          <h1 class="font-extrabold text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-primary to-primary-dark uppercase leading-none font-cinzel" style="filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.45));">Président</h1>
          <div class="flex items-center justify-center gap-2.5 mt-3 w-full">
            <span class="h-[1px] w-5 bg-primary/50"></span>
            <span class="text-[9px] font-bold text-primary-light tracking-[0.25em] uppercase">Online Arena</span>
            <span class="h-[1px] w-5 bg-primary/50"></span>
          </div>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-2xl p-8 bg-background-2 border" style="border-color: rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
        <h2 class="text-xl font-semibold mb-6" style="color: #f1f5f9;">Connexion</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: #94a3b8;">Email</label>
            <input v-model="formValue.email" type="email" placeholder="ton@email.com"
              class="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
              @focus="($event.target as HTMLElement).style.borderColor='var(--primary)'"
              @blur="($event.target as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: #94a3b8;">Mot de passe</label>
            <input v-model="formValue.password" type="password" placeholder="••••••"
              class="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f1f5f9;"
              @keyup.enter="handleLogin"
              @focus="($event.target as HTMLElement).style.borderColor='var(--primary)'"
              @blur="($event.target as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'"
            />
          </div>

          <div v-if="error" class="text-sm p-3 rounded-lg" style="background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2);">
            {{ error }}
          </div>

          <Button 
            @click="handleLogin" 
            :loading="loading" 
            variant="primary" 
            full-width
            size="lg"
            class="mt-2"
          >
            Se connecter
          </Button>
        </div>

        <p class="text-center text-sm mt-6" style="color: #64748b;">
          Pas de compte ?
          <router-link to="/register" style="color: var(--accent);" class="font-medium hover:underline">S'inscrire</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
