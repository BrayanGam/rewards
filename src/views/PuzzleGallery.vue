<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import { ChevronLeft, Loader2, RefreshCw, Layers, Sparkles } from 'lucide-vue-next';

const router = useRouter();
const loading = ref(true);
const currentImage = ref(null);
// Game constants
const gridSize = ref(4); // Fixed 4x4 for Memories
const tiles = ref([]);
const isWon = ref(false);

const fetchRandomImage = async () => {
    loading.value = true;
    isWon.value = false;
    try {
        const { data, error } = await supabase
            .from('puzzle_gallery')
            .select('*');

        const romanticImages = [
            'https://images.unsplash.com/photo-1518199266791-739d6ffc8ec1?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1516589174184-c68526671ee6?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522673607200-164848374c0f?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=1000&auto=format&fit=crop'
        ];

        if (error || !data || data.length === 0) {
            // Fallback Romantic images if none in DB
            const randomIndex = Math.floor(Math.random() * romanticImages.length);
            currentImage.value = {
                image_url: romanticImages[randomIndex]
            };
        } else {
            const randomIndex = Math.floor(Math.random() * data.length);
            currentImage.value = data[randomIndex];
        }
        initGame();
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const initGame = () => {
    const totalTiles = gridSize.value * gridSize.value;
    tiles.value = Array.from({ length: totalTiles }, (_, i) => i);
    shuffle();
};

const shuffle = () => {
    let emptyIndex = tiles.value.indexOf(tiles.value.length - 1);
    const moves = 100 * (gridSize.value - 2); // More moves for harder grids

    for (let i = 0; i < moves; i++) {
        const possibleMoves = getValidMoves(emptyIndex);
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        [tiles.value[emptyIndex], tiles.value[randomMove]] = [tiles.value[randomMove], tiles.value[emptyIndex]];
        emptyIndex = randomMove;
    }
};

const getValidMoves = (idx) => {
    const moves = [];
    const size = gridSize.value;
    const row = Math.floor(idx / size);
    const col = idx % size;

    if (row > 0) moves.push(idx - size);
    if (row < size - 1) moves.push(idx + size);
    if (col > 0) moves.push(idx - 1);
    if (col < size - 1) moves.push(idx + 1);

    return moves;
};

const movePiece = (idx) => {
    if (isWon.value) return;

    const emptyTileValue = tiles.value.length - 1;
    const emptyIndex = tiles.value.indexOf(emptyTileValue);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(idx)) {
        const newTiles = [...tiles.value];
        [newTiles[emptyIndex], newTiles[idx]] = [newTiles[idx], newTiles[emptyIndex]];
        tiles.value = newTiles;
        checkWin();
    }
};

const checkWin = () => {
    const won = tiles.value.every((tile, index) => tile === index);
    if (won) {
        isWon.value = true;
    }
};

const getBackgroundPosition = (tileValue) => {
    const size = gridSize.value;
    const emptyValue = size * size - 1;
    if (tileValue === emptyValue) return 'none';
    
    const row = Math.floor(tileValue / size);
    const col = tileValue % size;
    const percent = 100 / (size - 1);
    return `${col * percent}% ${row * percent}%`;
};

onMounted(fetchRandomImage);
</script>

<template>
  <div class="min-h-screen bg-peony-light p-6 pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button @click="router.back()" class="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-burgundy transition-colors">
        <ChevronLeft :size="24" />
      </button>
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 font-serif">Galería de tus Recuerdos</h1>
        <p class="text-xs text-gray-500 font-medium uppercase tracking-widest italic">Vas a poder?</p>
      </div>
      <button @click="fetchRandomImage" class="p-3 bg-white rounded-2xl shadow-sm text-burgundy hover:scale-110 transition-all">
        <RefreshCw :size="20" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <Loader2 class="text-burgundy animate-spin mb-4" :size="40" />
      <p class="text-gray-400 font-medium font-serif italic">Buscando un recuerdo especial...</p>
    </div>

    <!-- Game Board -->
    <div v-else class="max-w-md mx-auto space-y-8">
      <div 
        class="relative aspect-square bg-white p-2 rounded-[2rem] shadow-2xl border-[4px] border-burgundy overflow-hidden transition-all duration-500"
        :class="{ 'ring-8 ring-burgundy/10': isWon }"
      >
        <div 
            class="grid w-full h-full gap-0.5"
            :style="{ 
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)` 
            }"
        >
          <div 
            v-for="(tile, index) in tiles" 
            :key="index"
            @click="movePiece(index)"
            class="relative w-full h-full transition-all duration-300 cursor-pointer overflow-hidden border-[0.5px] border-white/10"
            :class="tile === gridSize * gridSize - 1 ? 'bg-[#FFF5F5]' : 'bg-gray-100 active:scale-95'"
          >
            <div 
              v-if="tile !== gridSize * gridSize - 1"
              class="w-full h-full bg-cover"
              :style="{ 
                backgroundImage: `url(${currentImage.image_url})`,
                backgroundPosition: getBackgroundPosition(tile),
                backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`
              }"
            ></div>
          </div>
        </div>

        <!-- Win Overlay -->
        <transition name="fade">
            <div v-if="isWon" class="absolute inset-0 bg-burgundy/40 backdrop-blur-sm flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div class="bg-white p-8 rounded-[3rem] shadow-2xl space-y-4 scale-up">
                    <div class="w-16 h-16 bg-pink-100 rounded-full mx-auto flex items-center justify-center text-burgundy">
                        <Heart class="text-burgundy fill-burgundy" :size="32" />
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 font-serif">¡Completado!</h3>
                    <button @click="fetchRandomImage" class="btn-primary w-full">
                        Siguiente Recuerdo
                    </button>
                </div>
            </div>
        </transition>
      </div>

      <!-- Footer Info -->
      <div class="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-widest">
        <Layers :size="14" />
        <span>Modo Recreativo - Sin Premios</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scale-up {
    animation: scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scale-up {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
