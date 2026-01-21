<script setup>
import { useRouter } from 'vue-router';
import { supabase } from './supabase';
import { onMounted, ref } from 'vue';
import { Heart, Wallet, User, Home as HomeIcon } from 'lucide-vue-next';

const router = useRouter();
const session = ref(null);

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  session.value = data.session;

  supabase.auth.onAuthStateChange((_event, _session) => {
    session.value = _session;
  });
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <router-view v-slot="{ Component }">
      <transition 
        name="fade" 
        mode="out-in"
      >
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Fixed Bottom Navigation -->
    <div v-if="session" class="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-burgundy/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <nav class="flex justify-around items-center py-2 px-6 max-w-lg mx-auto">
        <router-link to="/home" class="nav-item" active-class="nav-item-active">
          <HomeIcon :size="24" />
          <span class="text-[10px] font-bold uppercase tracking-tighter">Inicio</span>
        </router-link>
        
        <router-link to="/cupones" class="nav-item" active-class="nav-item-active">
          <Wallet :size="24" />
          <span class="text-[10px] font-bold uppercase tracking-tighter">Cupones</span>
        </router-link>

        <router-link to="/perfil" class="nav-item" active-class="nav-item-active">
          <User :size="24" />
          <span class="text-[10px] font-bold uppercase tracking-tighter">Perfil</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style>
@reference "./style.css";

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.nav-item {
  @apply flex flex-col items-center gap-1 text-gray-400 transition-all duration-300 px-4 py-1 rounded-2xl;
}

.nav-item-active {
  @apply text-burgundy bg-burgundy/5 scale-110;
}

.nav-item:active {
  @apply scale-95;
}
</style>
