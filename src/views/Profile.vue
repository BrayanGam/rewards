<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';
import { User, LogOut, Calendar, Heart } from 'lucide-vue-next';

const router = useRouter();
const profile = ref(null);
const user = ref(null);
const stats = ref({
  total: 0,
  active: 0,
  used: 0
});

// Time together counter
const startDate = new Date('2024-06-01T00:00:00');
const timeTogether = ref({
  days: 0,
  minutes: 0,
  seconds: 0
});

const updateCounter = () => {
  const now = new Date();
  const diff = now - startDate;
  
  timeTogether.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    minutes: Math.floor(diff / (1000 * 60)).toLocaleString(),
    seconds: Math.floor(diff / 1000).toLocaleString()
  };
};

let counterInterval;

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};

onMounted(async () => {
  updateCounter();
  counterInterval = setInterval(updateCounter, 1000);

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  user.value = currentUser;
  
  if (currentUser) {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    profile.value = profileData;

    const { data: coupons } = await supabase.from('user_coupons').select('status').eq('user_id', currentUser.id);
    if (coupons) {
      stats.value = {
        total: coupons.length,
        active: coupons.filter(c => c.status === 'active').length,
        used: coupons.filter(c => c.status === 'used').length
      };
    }
  }
});
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-lg mx-auto pb-24">
    <div class="text-center space-y-3 sm:space-y-4">
      <div class="w-32 h-40 sm:w-36 sm:h-44 bg-pink-50 rounded-[2rem] mx-auto flex items-center justify-center border-4 border-white shadow-sm overflow-hidden relative p-1">
        <img 
          src="https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/sign/images/image13.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNDk1NWI1Ny0wMmM5LTRhYmUtODhmZS04ZmNmODI0ODA1ZjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaW1hZ2UxMy5qcGVnIiwiaWF0IjoxNzY5MDE5NjE3LCJleHAiOjQ5MjI2MTk2MTd9.YU6x_3uRIL4_OshS0WaTwDuiMaqH2R1iRns9VMwx_yc" 
          alt="Foto de perfil"
          class="w-full h-full object-cover rounded-[1.8rem]"
        />
      </div>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold font-serif">{{ profile?.username || 'Mi Amor' }}</h1>
        <p class="text-gray-500 text-xs sm:text-sm">{{ user?.email }}</p>
      </div>
    </div>

    <!-- Relationship Stats -->
    <div class="glass p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl ring-1 ring-white/20">
      <div class="flex flex-col items-center gap-2 text-center border-b border-burgundy/5 pb-6">
        <Heart class="text-burgundy fill-burgundy animate-pulse" :size="32" />
        <h2 class="text-3xl font-bold text-burgundy font-serif tracking-tight">{{ timeTogether.days }} Días</h2>
        <p class="text-[10px] text-burgundy/40 uppercase font-black tracking-widest">Comprometidos en amor</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white/40 p-4 rounded-3xl text-center border border-white/50">
          <p class="text-[10px] text-burgundy/60 uppercase font-bold mb-1">Minutos</p>
          <p class="text-sm font-bold text-gray-700 font-sans tracking-wide">{{ timeTogether.minutes }}</p>
        </div>
        <div class="bg-white/40 p-4 rounded-3xl text-center border border-white/50">
          <p class="text-[10px] text-burgundy/60 uppercase font-bold mb-1">Segundos</p>
          <p class="text-sm font-bold text-gray-700 font-sans tracking-wide">{{ timeTogether.seconds }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-burgundy/5">
        <div class="text-center">
          <p class="text-[10px] text-gray-400 uppercase font-bold">Ganados</p>
          <p class="text-2xl font-bold text-burgundy">{{ stats.total }}</p>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-gray-400 uppercase font-bold">Activos</p>
          <p class="text-2xl font-bold text-burgundy">{{ stats.active }}</p>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-gray-400 uppercase font-bold">Usados</p>
          <p class="text-2xl font-bold text-burgundy">{{ stats.used }}</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-4">
      <router-link to="/admin" class="w-full glass flex items-center gap-4 py-5 px-6 text-burgundy hover:bg-white/90 transition-all active:scale-[0.98]">
        <Heart :size="20" class="flex-shrink-0" />
        <span class="font-bold text-sm tracking-tight text-gray-800">Mensaje Inicial</span>
      </router-link>
      
      <button @click="handleLogout" class="w-full glass flex items-center gap-4 py-5 px-6 text-red-500 hover:bg-red-50/20 transition-all active:scale-[0.98] border-red-500/10">
        <LogOut :size="20" class="flex-shrink-0" />
        <span class="font-bold text-sm tracking-tight">Cerrar sesión</span>
      </button>
    </div>
  </div>
</template>
