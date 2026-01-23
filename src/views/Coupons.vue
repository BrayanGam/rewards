<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { Ticket, Clock, CheckCircle2 } from 'lucide-vue-next';

const coupons = ref([]);
const loading = ref(true);

const fetchCoupons = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from('user_coupons')
      .select('*, coupons_pool(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    coupons.value = data || [];
  }
  loading.value = false;
};

const redeemCoupon = async (id) => {
  const { error } = await supabase
    .from('user_coupons')
    .update({ status: 'used' })
    .eq('id', id);
  
  if (!error) {
    fetchCoupons();
  }
};

onMounted(fetchCoupons);
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-lg mx-auto">
    <header>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Cupones</h1>
      <p class="text-gray-500">Tus premios y experiencias ganadas.</p>
    </header>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy"></div>
    </div>

    <div v-else-if="coupons.length === 0" class="text-center py-20 space-y-4">
      <div class="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-pink-200">
        <Ticket :size="40" />
      </div>
      <p class="text-gray-400">Aún no tienes cupones. ¡Juega para ganar!</p>
    </div>

    <div v-else class="grid gap-4">
      <div 
        v-for="userCoupon in coupons" 
        :key="userCoupon.id"
        class="card relative overflow-hidden transition-all duration-500"
        :class="{ 'grayscale opacity-75': userCoupon.status === 'used' }"
      >
        <div class="flex gap-4">
          <div 
            class="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
            :class="userCoupon.status === 'active' ? 'bg-pink-100 text-burgundy' : 'bg-gray-200 text-gray-400'"
          >
            <Ticket :size="32" />
          </div>
          
          <div class="flex-1 space-y-1">
            <h3 class="font-bold text-lg leading-tight">{{ userCoupon.coupons_pool.title }}</h3>
            <p class="text-sm text-gray-500">{{ userCoupon.coupons_pool.description }}</p>
            
            <div class="pt-2 flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                :class="userCoupon.coupons_pool.tier === 'hard' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ userCoupon.coupons_pool.tier === 'hard' ? 'Legendario' : 'Común' }}
              </span>
              
              <button 
                v-if="userCoupon.status === 'active'"
                @click="redeemCoupon(userCoupon.id)"
                class="text-xs font-bold text-burgundy hover:underline"
              >
                Canjear ahora
              </button>
            </div>
          </div>
        </div>

        <!-- Used Stamp -->
        <div 
          v-if="userCoupon.status === 'used'"
          class="absolute top-2 right-2 rotate-12 border-4 border-gray-400 text-gray-400 px-2 py-1 rounded-lg font-black uppercase text-xs tracking-tighter"
        >
          Canjeado
        </div>
      </div>
    </div>
  </div>
</template>
