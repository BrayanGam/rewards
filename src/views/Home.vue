<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { Gift, Gamepad2, Heart, Award, ChevronRight, Brain, Sparkles } from 'lucide-vue-next';

import { getWeeklyRewardCount, getNextResetDate } from '../gameLogic';

const profile = ref(null);
const totalCoupons = ref(0);
const weeklyCount = ref(0);
const canPlay = ref(true);
const loading = ref(true);
const countdown = ref('');

// Days together calculation
const startDate = new Date('2024-06-01T00:00:00');
const daysTogether = ref(0);

const calculateDays = () => {
  const now = new Date();
  const diff = now - startDate;
  daysTogether.value = Math.floor(diff / (1000 * 60 * 60 * 24));
};

const updateCountdown = () => {
  const now = new Date();
  const nextReset = getNextResetDate();
  const diff = nextReset - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  countdown.value = `${days}d ${hours}h ${minutes}m`;
};

let timerInterval;

onMounted(async () => {
  calculateDays();
  updateCountdown();
  timerInterval = setInterval(updateCountdown, 60000); // Update every minute

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Fetch profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile.value = profileData;

    // Fetch total coupons count
    const { count } = await supabase
      .from('user_coupons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    totalCoupons.value = count || 0;

    // Fetch weekly count
    weeklyCount.value = await getWeeklyRewardCount();
    canPlay.value = weeklyCount.value < 2;
  }
  loading.value = false;
});
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-lg mx-auto">
    <!-- Header/Greeting -->
    <header class="space-y-2">
      <p class="text-sm sm:text-base text-gray-500 font-medium">Hola, mi vida ✨</p>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
        {{ profile?.special_message || '¡Qué alegría verte de nuevo!' }}
      </h1>
    </header>

    <!-- Stats Preview -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <div class="card flex flex-col items-center text-center space-y-1 bg-pink-50/50">
        <Heart class="text-burgundy fill-burgundy mb-2" :size="20" />
        <span class="text-sm text-gray-500">Días Juntos</span>
        <span class="text-xl font-bold text-burgundy">{{ daysTogether }}</span>
      </div>
      <div class="card flex flex-col items-center text-center space-y-1 bg-burgundy/5">
        <Gift class="text-burgundy mb-2" :size="20" />
        <span class="text-sm text-gray-500">Cupones</span>
        <span class="text-xl font-bold text-burgundy">{{ totalCoupons }}</span>
      </div>
    </div>

    <!-- Games Section -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-gray-900 ml-1">Mini-Juegos</h2>
      
      <div class="space-y-3">
        <!-- Memory Match -->
        <component 
          :is="canPlay ? 'router-link' : 'div'"
          to="/game/memory" 
          class="w-full card flex items-center justify-between group transition-all"
          :class="canPlay ? 'hover:border-burgundy/20 cursor-pointer' : 'opacity-75 grayscale cursor-not-allowed'"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" :class="canPlay ? 'bg-pink-100 text-burgundy' : 'bg-gray-100 text-gray-400'">
              <Gamepad2 :size="24" />
            </div>
            <div class="text-left">
              <h3 class="font-bold transition-colors" :class="canPlay ? 'text-gray-900' : 'text-gray-400'">Encuentra el Par</h3>
              <p class="text-xs text-gray-500">{{ canPlay ? 'Dificultad: Suave' : 'Límite alcanzado' }}</p>
            </div>
          </div>
          <ChevronRight v-if="canPlay" class="text-gray-300 group-hover:text-burgundy transition-colors" :size="20" />
          <Heart v-else class="text-gray-200" :size="20" />
        </component>

        <!-- Trivia -->
        <component 
          :is="canPlay ? 'router-link' : 'div'"
          to="/game/trivia" 
          class="w-full card flex items-center justify-between group transition-all"
          :class="canPlay ? 'hover:border-burgundy/20 cursor-pointer' : 'opacity-75 grayscale cursor-not-allowed'"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" :class="canPlay ? 'bg-pink-100 text-burgundy' : 'bg-gray-100 text-gray-400'">
              <Brain :size="24" />
            </div>
            <div class="text-left">
              <h3 class="font-bold transition-colors" :class="canPlay ? 'text-gray-900' : 'text-gray-400'">Trivia del Amor</h3>
              <p class="text-xs text-gray-500">{{ canPlay ? 'Dificultad: Inteligente' : 'Límite alcanzado' }}</p>
            </div>
          </div>
          <ChevronRight v-if="canPlay" class="text-gray-300 group-hover:text-burgundy transition-colors" :size="20" />
          <Heart v-else class="text-gray-200" :size="20" />
        </component>

        <!-- Daily Puzzle -->
        <component 
          :is="canPlay ? 'router-link' : 'div'"
          to="/game/puzzle" 
          class="w-full card flex items-center justify-between group transition-all"
          :class="canPlay ? 'hover:border-burgundy/20 cursor-pointer' : 'opacity-75 grayscale cursor-not-allowed'"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" :class="canPlay ? 'bg-pink-100 text-burgundy' : 'bg-gray-100 text-gray-400'">
              <Award :size="24" />
            </div>
            <div class="text-left">
              <h3 class="font-bold transition-colors" :class="canPlay ? 'text-gray-900' : 'text-gray-400'">Desafío BTS</h3>
              <p class="text-xs text-gray-500">{{ canPlay ? 'Gana premios con tus idols 💜' : 'Límite alcanzado' }}</p>
            </div>
          </div>
          <ChevronRight v-if="canPlay" class="text-gray-300 group-hover:text-burgundy transition-colors" :size="20" />
          <Heart v-else class="text-gray-200" :size="20" />
        </component>

        <!-- Puzzle Gallery (Infinite) -->
        <router-link 
          to="/game/puzzle-gallery" 
          class="w-full card flex items-center justify-between group transition-all hover:border-burgundy/20 cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-pink-100 text-burgundy flex items-center justify-center transition-colors">
              <Gamepad2 :size="24" />
            </div>
            <div class="text-left">
              <h3 class="font-bold text-gray-900">Galería de tus Recuerdos</h3>
              <p class="text-xs text-gray-500">Resuelvelo solo si puedes</p>
            </div>
          </div>
          <ChevronRight class="text-gray-300 group-hover:text-burgundy transition-colors" :size="20" />
        </router-link>
      </div>
    </section>

    <!-- Weekly Reward Banner -->
    <div class="relative group overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <!-- Background with pattern -->
      <div class="absolute inset-0 bg-burgundy/95 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-90"></div>
      
      <div class="relative z-10 p-7 text-white space-y-4">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <h3 class="text-xl font-bold font-serif tracking-tight">Cofre Semanal</h3>
            <p v-if="canPlay" class="text-white/70 text-xs font-medium">Desbloquea premios jugando</p>
            <p v-else class="text-white/70 text-[10px] font-bold uppercase tracking-widest">Reinicia en: {{ countdown }}</p>
          </div>
          <Award class="text-white/30" :size="32" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em]">
            <span>{{ canPlay ? 'Progreso Semanal' : 'Límite Semanal Completado' }}</span>
            <span>{{ weeklyCount }} / 2</span>
          </div>
          <div class="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              class="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" 
              :style="{ width: `${(weeklyCount / 2) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      <Heart class="absolute -right-6 -bottom-6 text-white/5 rotate-12" :size="140" />
    </div>
  </div>
</template>
