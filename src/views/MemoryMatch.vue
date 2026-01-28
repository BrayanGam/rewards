<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { claimReward, checkWeeklyLimit } from '../gameLogic';
import { Heart, Trophy, RefreshCw, ChevronLeft, Gift, Timer } from 'lucide-vue-next';

const router = useRouter();

// Game State
const cards = ref([]);
const flippedCards = ref([]);
const matchedPairs = ref(0);
const moves = ref(0);
const gameStatus = ref('playing'); // 'playing', 'won', 'rewarding', 'lost'
const reward = ref(null);
const loadingReward = ref(false);
const showChests = ref(false);

// Countdown Timer State (5 minutes = 300 seconds)
const timeLeft = ref(300);
let timerInterval;

// Photos Configuration (18 photos - using public URLs)
const photoPool = [
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image1.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image10.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image11.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image12.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image14.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image15.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image16.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image17.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image18.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image19.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image2.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image3.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image4.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image5.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image6.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image7.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image8.jpeg',
  'https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/image9.jpeg'
];

const totalPairs = 8; // Resetting to 8 pairs for the full 4x4 experience

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const setupGame = () => {
  // Reset state
  flippedCards.value = [];
  matchedPairs.value = 0;
  moves.value = 0;
  gameStatus.value = 'playing';
  showChests.value = false;
  reward.value = null;
  timeLeft.value = 300;

  // Pick 8 random photos from the pool and generate cards
  const selectedPhotos = [...photoPool].sort(() => 0.5 - Math.random()).slice(0, totalPairs);
  const cardData = [...selectedPhotos, ...selectedPhotos].map((photoUrl, index) => ({
    id: index,
    photoUrl,
    isFlipped: false,
    isMatched: false,
  }));
  
  // Shuffle and assign
  cards.value = cardData.sort(() => Math.random() - 0.5);
  
  startTimer();
};

const startTimer = () => {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0 && gameStatus.value === 'playing') {
      timeLeft.value--;
    } else if (timeLeft.value === 0 && gameStatus.value === 'playing') {
      gameStatus.value = 'lost';
      clearInterval(timerInterval);
    }
  }, 1000);
};

const flipCard = (card) => {
  if (gameStatus.value !== 'playing' || card.isFlipped || card.isMatched || flippedCards.value.length === 2) return;

  card.isFlipped = true;
  flippedCards.value.push(card);

  if (flippedCards.value.length === 2) {
    moves.value++;
    checkMatch();
  }
};

const checkMatch = () => {
  const [card1, card2] = flippedCards.value;
  
  if (card1.photoUrl === card2.photoUrl) {
    card1.isMatched = true;
    card2.isMatched = true;
    matchedPairs.value++;
    flippedCards.value = [];
    
    if (matchedPairs.value === totalPairs) {
      gameStatus.value = 'won';
      clearInterval(timerInterval);
      setTimeout(() => {
        showChests.value = true;
      }, 500);
    }
  } else {
    setTimeout(() => {
      card1.isFlipped = false;
      card2.isFlipped = false;
      flippedCards.value = [];
    }, 1000);
  }
};

const handleClaimReward = async () => {
  loadingReward.value = true;
  try {
    reward.value = await claimReward(1);
    gameStatus.value = 'rewarded';
  } catch (err) {
    alert(err.message);
    router.push('/home');
  } finally {
    loadingReward.value = false;
  }
};

onMounted(async () => {
  const canPlay = await checkWeeklyLimit();
  if (!canPlay) {
    alert('Has alcanzado tu límite semanal de 2 cupones. ¡Vuelve el lunes para más premios! ❤️');
    router.push('/home');
    return;
  }
  setupGame();
});

onUnmounted(() => clearInterval(timerInterval));
</script>

<template>
  <div class="min-h-screen p-6 max-w-lg mx-auto space-y-6 bg-peony-light">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <button @click="router.push('/home')" class="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-burgundy transition-colors">
        <ChevronLeft :size="20" />
      </button>
      
      <div class="flex items-center gap-4">
        <div class="flex flex-col items-center">
          <span class="text-[10px] uppercase font-bold tracking-widest text-burgundy/40">Tiempo</span>
          <div class="flex items-center gap-1 text-xl font-bold" :class="timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-burgundy'">
            <Timer :size="18" />
            <span>{{ formatTime(timeLeft) }}</span>
          </div>
        </div>
        <div class="w-px h-8 bg-pink-100"></div>
        <div class="flex flex-col items-center">
          <span class="text-[10px] uppercase font-bold tracking-widest text-burgundy/40">Movimientos</span>
          <span class="text-xl font-bold text-burgundy">{{ moves }}</span>
        </div>
      </div>

      <button @click="setupGame" class="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-burgundy transition-colors">
        <RefreshCw :size="20" />
      </button>
    </div>

    <!-- Game Board (4x4 Grid for 16 cards) -->
    <div v-if="gameStatus === 'playing' || gameStatus === 'won'" class="grid grid-cols-4 gap-2 sm:gap-4 pb-10">
      <div 
        v-for="card in cards" 
        :key="card.id"
        @click="flipCard(card)"
        class="aspect-[3/4] cursor-pointer perspective"
      >
        <div 
          class="relative w-full h-full transition-transform duration-500 transform-style-3d"
          :class="{ 'rotate-y-180': card.isFlipped || card.isMatched }"
        >
          <!-- Back -->
          <div class="absolute inset-0 bg-burgundy rounded-xl sm:rounded-[2rem] flex items-center justify-center backface-hidden shadow-lg border-2 border-white/20 overflow-hidden">
             <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <Heart class="text-white/40 drop-shadow-sm" :size="20" />
          </div>
          <!-- Front -->
          <div class="absolute inset-0 bg-white rounded-xl sm:rounded-[2rem] flex items-center justify-center backface-hidden rotate-y-180 shadow-lg border-2 overflow-hidden"
            :class="card.isMatched ? 'border-green-400' : 'border-pink-200'"
          >
            <img :src="card.photoUrl" class="w-full h-full object-cover" />
            <div v-if="card.isMatched" class="absolute inset-0 bg-green-400/20 flex items-center justify-center">
               <Heart class="text-white fill-white" :size="24" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Time Out State -->
    <div v-if="gameStatus === 'lost'" class="text-center space-y-6 py-20">
       <div class="w-24 h-24 bg-red-50 rounded-full mx-auto flex items-center justify-center text-red-500">
          <Timer :size="48" />
       </div>
       <div class="space-y-2">
         <h2 class="text-2xl font-bold text-gray-900 font-serif">¡Se acabó el tiempo!</h2>
         <p class="text-gray-500 text-sm px-10">No te preocupes mi amor, ¡inténtalo de nuevo!</p>
       </div>
       <button @click="setupGame" class="btn-primary mx-auto">
         Reintentar con amor
       </button>
    </div>

    <!-- Gacha Overlay (3 Chests) -->
    <transition name="scale">
      <div v-if="showChests && gameStatus === 'won'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy/95 backdrop-blur-md">
        <div class="text-center space-y-8 w-full max-w-lg">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold text-white font-serif">¡Eres la mejor! 🏆</h2>
            <p class="text-white/70 text-sm">Escoge uno de los 3 cofres para ver tu premio</p>
          </div>
          
          <div class="grid grid-cols-3 gap-2 sm:gap-4 items-center justify-items-center">
            <button 
              v-for="i in 3"
              :key="i"
              @click="handleClaimReward"
              :disabled="loadingReward"
              class="relative w-full aspect-square group transition-all duration-500 hover:scale-110 active:scale-90 touch-manipulation flex flex-col items-center"
            >
              <!-- Glowing effect -->
              <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse group-hover:bg-white/20"></div>
              
              <img 
                src="https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/pngaaa.com-5330731__1_-removebg-preview-1-e1649640330290.webp" 
                alt="Treasure Chest" 
                class="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                :class="loadingReward ? '' : 'animate-float'"
                :style="{ animationDelay: `${(i-1) * 0.2}s` }"
              />
              
              <div class="mt-2 bg-white/10 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full uppercase tracking-tighter text-[8px] shadow-sm">
                {{ loadingReward ? '...' : 'Abrir' }}
              </div>
            </button>
          </div>

          <div v-if="loadingReward" class="text-white/50 text-xs animate-pulse">
            Abriendo cofre mágico...
          </div>
        </div>
      </div>
    </transition>

    <!-- Reward Result -->
    <transition name="fade">
      <div v-if="gameStatus === 'rewarded'" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-white bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]">
        <div class="text-center space-y-8 max-w-xs relative">
          <!-- Confetti placeholder or celebration icon -->
          <div class="absolute -top-20 left-1/2 -translate-x-1/2 text-burgundy animate-bounce">
              <Trophy :size="80" />
          </div>

          <div class="space-y-4 pt-10">
            <h2 class="text-4xl font-black text-burgundy font-serif leading-none italic">¡Sorpresa!</h2>
            <p class="text-gray-400 text-sm font-medium tracking-widest uppercase">Has ganado un premio:</p>
            
            <div class="py-8 px-6 bg-pink-50 rounded-[2.5rem] border-2 border-pink-100 shadow-inner space-y-3 relative overflow-hidden">
               <div class="absolute top-0 right-0 p-4 opacity-10">
                  <Gift :size="60" />
               </div>
               <h3 class="text-2xl font-black text-gray-900 leading-tight relative z-10">{{ reward.coupons_pool.title }}</h3>
               <p class="text-gray-600 font-medium relative z-10">{{ reward.coupons_pool.description }}</p>
            </div>
          </div>

          <button @click="router.push('/cupones')" class="w-full btn-primary mt-8 shadow-[0_10px_30px_rgba(99,3,48,0.3)]">
            Ver en mi billetera ✨
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1200px;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.6) translateY(50px);
  opacity: 0;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
