<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';
import { Heart, Lock, Mail } from 'lucide-vue-next';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (authError) throw authError;
    router.push('/home');
  } catch (err) {
    error.value = 'Correo o contraseña incorrectos';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-peony-light">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 space-y-8 border border-pink-50">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Heart class="text-burgundy fill-burgundy" :size="32" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Love Rewards</h1>
        <p class="text-gray-500">Bienvenida de nuevo, mi amor.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 ml-1">Correo Electrónico</label>
          <div class="relative">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
            <input 
              v-model="email"
              type="email" 
              required
              placeholder="tu@correo.com"
              class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none transition-all"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
            <input 
              v-model="password"
              type="password" 
              required
              placeholder="••••••••"
              class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none transition-all"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-2xl">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full btn-primary"
        >
          {{ loading ? 'Iniciando sesión...' : 'Entrar con amor' }}
        </button>
      </form>
    </div>
  </div>
</template>
