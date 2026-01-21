<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import { claimReward } from '../gameLogic';
import { ChevronLeft, Trophy, Gift, Heart, Loader2, RefreshCw } from 'lucide-vue-next';

const gameStatus = ref('playing'); // 'playing', 'won', 'rewarded'
const solvedPuzzles = ref(0); // Counter for 3 puzzles requirement
const showChests = ref(false);
const loadingReward = ref(false);
const reward = ref(null);

const router = useRouter();
const loading = ref(true);
const challenge = ref(null);

// Game constants
const gridSize = ref(3); // Default 3x3
const tiles = ref([]);
const solvedState = computed(() => Array.from({ length: gridSize.value * gridSize.value }, (_, i) => i));

const difficulties = [
    { label: 'Fácil', size: 3 },
    { label: 'Normal', size: 4 },
    { label: 'Ingeniero', size: 5 }
];

const fetchChallenge = async () => {
    loading.value = true;
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('daily_challenges')
            .select('*')
            .eq('scheduled_for', today)
            .single();

        if (error || !data) {
            // BTS Fallbacks for Daily Challenge
            const btsImages = [
                'https://hips.hearstapps.com/hmg-prod/images/bts-1637753091.jpg?crop=1xw:0.843644544431946xh;0,0.0929xh',
                'https://i.pinimg.com/736x/eb/0e/5d/eb0e5d19fe5e5932da379ed718e1424f.jpg',
                'https://i.pinimg.com/736x/8b/bc/a8/8bbca8741d793d4af713ecbf91bfa7a9.jpg',
                'https://i.pinimg.com/736x/10/f3/bf/10f3bfe24ba0ad447b6a8a1af0e3ce7f.jpg',
                'https://i.pinimg.com/736x/78/39/0b/78390b52a3564280fdebea61afda26d0.jpg'
            ];
            const randomIndex = Math.floor(Math.random() * btsImages.length);
            challenge.value = {
                id: 'fallback',
                image_url: btsImages[randomIndex]
            };
        } else {
            challenge.value = data;
        }
        initGame();
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const initGame = () => {
    tiles.value = [...solvedState.value];
    shuffle();
    gameStatus.value = 'playing';
};

const shuffle = () => {
    // To guarantee solvability, we perform valid random moves from the solved state
    const size = gridSize.value;
    let currentEmptyIndex = tiles.value.indexOf(size * size - 1);
    const moves = 100 * (size - 2); 

    for (let i = 0; i < moves; i++) {
        const possibleMoves = getValidMoves(currentEmptyIndex);
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // Swap
        [tiles.value[currentEmptyIndex], tiles.value[randomMove]] = [tiles.value[randomMove], tiles.value[currentEmptyIndex]];
        currentEmptyIndex = randomMove;
    }
};

const getValidMoves = (emptyIndex) => {
    const moves = [];
    const size = gridSize.value;
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    if (row > 0) moves.push(emptyIndex - size); // Up
    if (row < size - 1) moves.push(emptyIndex + size); // Down
    if (col > 0) moves.push(emptyIndex - 1); // Left
    if (col < size - 1) moves.push(emptyIndex + 1); // Right

    return moves;
};

const movePiece = (index) => {
    if (gameStatus.value !== 'playing') return;

    const size = gridSize.value;
    const emptyIndex = tiles.value.indexOf(size * size - 1);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
        // Swap
        const newTiles = [...tiles.value];
        [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
        tiles.value = newTiles;

        checkWin();
    }
};

const checkWin = () => {
    const isWin = tiles.value.every((tile, index) => tile === solvedState.value[index]);
    if (isWin) {
        solvedPuzzles.value++;
        
        if (solvedPuzzles.value >= 3) {
            gameStatus.value = 'won';
            setTimeout(() => {
                showChests.value = true;
            }, 1000);
            saveAttempt();
        } else {
            // Logic for next puzzle in the sequence
            setTimeout(() => {
                fetchChallenge(); // Fetch another random image or the same one updated
            }, 1000);
        }
    }
};

const saveAttempt = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && challenge.value.id !== 'fallback') {
        await supabase.from('challenge_attempts').insert({
            user_id: user.id,
            challenge_id: challenge.value.id
        });
    }
};

const handleClaimReward = async () => {
    loadingReward.value = true;
    try {
        // Sliding puzzle is intermediate difficulty, so tier 2
        reward.value = await claimReward(2);
        gameStatus.value = 'rewarded';
        showChests.value = false;
    } catch (error) {
        alert(error.message);
    } finally {
        loadingReward.value = false;
    }
};

const changeDifficulty = (size) => {
    gridSize.value = size;
    initGame();
};

const getBackgroundPosition = (tileValue) => {
    const size = gridSize.value;
    if (tileValue === size * size - 1) return 'none';
    const row = Math.floor(tileValue / size);
    const col = tileValue % size;
    const percent = 100 / (size - 1);
    return `${col * percent}% ${row * percent}%`;
};

onMounted(fetchChallenge);
</script>

<template>
  <div class="min-h-screen bg-peony-light p-6 pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button @click="router.back()" class="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-burgundy transition-colors">
        <ChevronLeft :size="24" />
      </button>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 font-serif">Desafío BTS</h1>
        <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            {{ gameStatus === 'won' ? '¡Reto Completado!' : `Progreso: ${solvedPuzzles}/3` }}
        </p>
      </div>
      <button 
        @click="initGame" 
        class="p-3 bg-white rounded-2xl shadow-sm text-burgundy hover:scale-110 transition-all"
        title="Reiniciar Puzzle"
      >
        <RefreshCw :size="20" />
      </button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 animate-pulse">
      <Loader2 class="text-burgundy animate-spin mb-4" :size="40" />
      <p class="text-gray-400 font-medium font-serif italic">Preparando el desafío...</p>
    </div>

    <div v-else class="max-w-md mx-auto space-y-6">
      <!-- Difficulty Selector -->
      <div class="flex justify-center gap-2 mb-4">
          <button 
              v-for="diff in difficulties" 
              :key="diff.size"
              @click="changeDifficulty(diff.size)"
              class="px-4 py-2 rounded-2xl text-[10px] font-bold transition-all border-2"
              :class="gridSize === diff.size 
                  ? 'bg-burgundy text-white border-burgundy shadow-lg scale-105' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-pink-200'"
          >
              {{ diff.label }} ({{ diff.size }}x{{ diff.size }})
          </button>
      </div>

      <!-- Puzzle Container -->
      <div class="relative aspect-square bg-white p-3 rounded-[2.5rem] shadow-2xl border-[4px] border-burgundy overflow-hidden">
        <div 
          class="grid gap-1 w-full h-full"
          :style="{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)` 
          }"
        >
          <div 
            v-for="(tile, index) in tiles" 
            :key="index"
            @click="movePiece(index)"
            class="relative w-full h-full rounded-xl transition-all duration-300 cursor-pointer overflow-hidden border-[0.5px] border-white/10"
            :class="tile === gridSize * gridSize - 1 ? 'bg-[#FFF5F5]' : 'bg-gray-100 shadow-sm active:scale-95'"
          >
            <div 
              v-if="tile !== gridSize * gridSize - 1"
              class="w-full h-full bg-cover"
              :style="{ 
                backgroundImage: `url(${challenge.image_url})`,
                backgroundPosition: getBackgroundPosition(tile),
                backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Game Controls/Info -->
      <div class="text-center space-y-4">
        <p class="text-gray-500 text-sm">
            {{ gameStatus === 'playing' ? 'Desliza las piezas para completar la imagen' : '¡Imagen completada!' }}
        </p>
      </div>
    </div>

    <!-- Gacha Overlay (Chest Selection) -->
    <transition name="scale">
      <div v-if="showChests && gameStatus === 'won'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy/95 backdrop-blur-md">
        <div class="text-center space-y-8 w-full max-w-lg">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold text-white font-serif">¡ARMY lo logró! 💜</h2>
            <p class="text-white/70 text-sm">Completaste el desafío de hoy. Elige un cofre:</p>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <button 
              v-for="i in 3"
              :key="i"
              @click="handleClaimReward"
              :disabled="loadingReward"
              class="relative aspect-square group transition-all duration-500 hover:scale-110 active:scale-90"
            >
              <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <img 
                src="https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/public/images/pngaaa.com-5330731.png" 
                alt="Treasure Chest" 
                class="relative z-10 w-full h-full object-contain drop-shadow-xl animate-float"
                :style="{ animationDelay: `${(i-1) * 0.2}s` }"
              />
              <div class="mt-2 text-white/80 font-bold uppercase text-[10px]">
                {{ loadingReward ? '...' : 'Abrir' }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Reward Result -->
    <transition name="fade">
      <div v-if="gameStatus === 'rewarded'" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-white">
        <div class="text-center space-y-8 max-w-xs relative">
          <Trophy class="text-burgundy mx-auto animate-bounce" :size="80" />
          <div class="space-y-4">
            <h2 class="text-4xl font-black text-burgundy font-serif italic">¡Lo lograste!</h2>
            <p class="text-gray-400 text-sm font-medium uppercase tracking-widest">Hoy has ganado:</p>
            
            <div class="py-8 px-6 bg-pink-50 rounded-[2.5rem] border-2 border-pink-100 shadow-inner">
               <h3 class="text-2xl font-black text-gray-900 leading-tight">{{ reward.coupons_pool.title }}</h3>
               <p class="text-gray-600 font-medium">{{ reward.coupons_pool.description }}</p>
            </div>
          </div>

          <button @click="router.push('/cupones')" class="w-full btn-primary mt-8">
            Ver en mi billetera ✨
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
</style>
