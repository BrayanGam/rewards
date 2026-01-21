<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import { claimReward, checkWeeklyLimit } from '../gameLogic';
import { ChevronLeft, Brain, Trophy, Gift, Heart, Loader2, ArrowRight } from 'lucide-vue-next';

const router = useRouter();

// Game State
const questions = ref([]);
const currentIndex = ref(0);
const score = ref(0);
const gameStatus = ref('loading'); // 'loading', 'playing', 'finished', 'won', 'rewarded'
const selectedAnswer = ref(null);
const isCorrect = ref(null);
const loadingReward = ref(false);
const showChests = ref(false);
const reward = ref(null);

const currentQuestion = computed(() => questions.value[currentIndex.value]);
const progress = computed(() => questions.value.length ? ((currentIndex.value) / questions.value.length) * 100 : 0);

const fetchQuestions = async () => {
    try {
        const { data, error } = await supabase
            .from('trivia_questions')
            .select('*');
        
        if (error) throw error;
        if (!data || data.length === 0) {
            alert('No hay preguntas configuradas en la base de datos.');
            router.push('/home');
            return;
        }

        // Shuffle questions and pick exactly 12
        const shuffled = data.sort(() => Math.random() - 0.5);
        questions.value = shuffled.slice(0, 12);
        gameStatus.value = 'playing';
    } catch (err) {
        console.error('Error fetching questions:', err);
        alert('Error al cargar las preguntas.');
    }
};

const handleAnswer = (option) => {
    if (selectedAnswer.value !== null) return;

    selectedAnswer.value = option;
    isCorrect.value = option === currentQuestion.value.correct_answer;

    if (isCorrect.value) {
        score.value++;
    }
};

const nextQuestion = () => {
    if (currentIndex.value < questions.value.length - 1) {
        currentIndex.value++;
        selectedAnswer.value = null;
        isCorrect.value = null;
    } else {
        finishGame();
    }
};

const finishGame = () => {
    const finalPercentage = (score.value / questions.value.length) * 100;
    // 75% of 12 is 9 questions.
    if (finalPercentage >= 75) {
        gameStatus.value = 'won';
    } else {
        gameStatus.value = 'finished';
    }
};

const handleClaimReward = async () => {
  loadingReward.value = true;
  try {
    reward.value = await claimReward(2); // Tier 2 for trivia
    gameStatus.value = 'rewarded';
  } catch (err) {
    alert(err.message);
    router.push('/home');
  } finally {
    loadingReward.value = false;
  }
};

const restartGame = () => {
    currentIndex.value = 0;
    score.value = 0;
    selectedAnswer.value = null;
    isCorrect.value = null;
    showChests.value = false;
    reward.value = null;
    fetchQuestions();
};

onMounted(async () => {
    const canPlay = await checkWeeklyLimit();
    if (!canPlay) {
        alert('Has alcanzado tu límite semanal de 2 cupones. ¡Vuelve el lunes para más premios! ❤️');
        router.push('/home');
        return;
    }
    fetchQuestions();
});
</script>

<template>
  <div class="min-h-screen p-6 max-w-lg mx-auto space-y-8 bg-peony-light flex flex-col pt-10">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <button @click="router.push('/home')" class="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-burgundy transition-colors">
        <ChevronLeft :size="20" />
      </button>
      
      <div v-if="gameStatus === 'playing'" class="flex-1 px-10">
        <div class="h-2 w-full bg-pink-100 rounded-full overflow-hidden">
            <div class="h-full bg-burgundy transition-all duration-500" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Trophy :size="20" class="text-burgundy" />
        <span class="font-bold text-burgundy">{{ score }} / {{ questions.length }}</span>
      </div>
    </div>

    <!-- Question View -->
    <div v-if="gameStatus === 'playing' && currentQuestion" class="flex-1 flex flex-col gap-6">
        <div class="glass p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <Brain class="absolute -top-4 -right-4 text-burgundy/5" :size="100" />
            <span class="text-[10px] font-black uppercase tracking-widest text-burgundy/40">Pregunta {{ currentIndex + 1 }} de {{ questions.length }}</span>
            <h2 class="text-2xl font-bold text-gray-900 leading-tight font-serif relative z-10">{{ currentQuestion.question }}</h2>
        </div>

        <div class="grid gap-3">
            <button 
                v-for="option in currentQuestion.options" 
                :key="option"
                @click="handleAnswer(option)"
                :disabled="selectedAnswer !== null"
                class="w-full card transition-all duration-300 text-left py-5 px-6 flex items-center justify-between border-2"
                :class="{
                    'border-green-500 bg-green-50 text-green-700': selectedAnswer !== null && option === currentQuestion.correct_answer,
                    'border-burgundy bg-burgundy/5 text-burgundy': selectedAnswer === option && !isCorrect,
                    'border-transparent bg-white': selectedAnswer === null || (selectedAnswer !== option && option !== currentQuestion.correct_answer),
                    'opacity-50 grayscale-0': selectedAnswer !== null && selectedAnswer !== option && option !== currentQuestion.correct_answer
                }"
            >
                <span class="font-bold pr-4">{{ option }}</span>
                <div v-if="selectedAnswer !== null">
                  <Heart v-if="option === currentQuestion.correct_answer" class="text-green-500 fill-green-500" :size="20" />
                  <span v-else-if="selectedAnswer === option && !isCorrect" class="text-burgundy font-bold">X</span>
                </div>
            </button>
        </div>

        <!-- Next Button -->
        <transition name="fade">
          <div v-if="selectedAnswer !== null" class="pt-4">
            <button @click="nextQuestion" class="btn-primary w-full group py-4">
              <span>{{ currentIndex === questions.length - 1 ? 'Ver Resultado' : 'Siguiente Pregunta' }}</span>
              <ArrowRight :size="20" class="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </transition>
    </div>

    <!-- Loading State -->
    <div v-if="gameStatus === 'loading'" class="flex-1 flex flex-col items-center justify-center gap-4 text-burgundy/40">
        <Loader2 class="animate-spin" :size="48" />
        <p class="font-bold uppercase tracking-widest text-[10px]">Cargando preguntas...</p>
    </div>

    <!-- Won State (Show Results first) -->
    <div v-if="gameStatus === 'won'" class="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div class="relative">
          <div class="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
              <Trophy :size="64" />
          </div>
          <div class="absolute -top-2 -right-2 bg-burgundy text-white w-12 h-12 rounded-full flex items-center justify-center font-bold border-4 border-peony-light">
            {{ Math.round((score / questions.length) * 100) }}%
          </div>
        </div>
        <div class="space-y-2">
            <h2 class="text-3xl font-bold font-serif">¡Eres increíble! 🌟</h2>
            <p class="text-gray-500">Has respondido correctamente <b>{{ score }}</b> de <b>{{ questions.length }}</b> preguntas.</p>
        </div>
        <button @click="showChests = true" class="btn-primary w-full py-4 text-lg">Reclamar mi Cofre 🎁</button>
    </div>

    <!-- Finished (Failed) State -->
    <div v-if="gameStatus === 'finished'" class="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div class="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-burgundy">
            <Brain :size="48" />
        </div>
        <div class="space-y-2">
            <h2 class="text-3xl font-bold font-serif">¡Buen intento!</h2>
            <p class="text-gray-500">Has acertado {{ score }} de {{ questions.length }}. Necesitas un 75% (9 aciertos) para ganar un premio.</p>
        </div>
        <button @click="restartGame" class="btn-primary w-full">Reintentar con amor</button>
    </div>

    <!-- Gacha Overlay (3 Chests) -->
    <transition name="scale">
      <div v-if="showChests && gameStatus === 'won'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy/95 backdrop-blur-md">
        <div class="text-center space-y-8 w-full max-w-lg">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold text-white font-serif">¡Escoge tu premio! 🏆</h2>
            <p class="text-white/70 text-sm">Tu sabiduría merece ser recompensada.</p>
          </div>
          
          <div class="grid grid-cols-3 gap-2 sm:gap-4 items-center justify-items-center">
            <button 
              v-for="i in 3"
              :key="i"
              @click="handleClaimReward"
              :disabled="loadingReward"
              class="relative w-full aspect-square group transition-all duration-500 hover:scale-110 active:scale-90 touch-manipulation flex flex-col items-center"
            >
              <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse group-hover:bg-white/20"></div>
              <img 
                src="https://mfgxzbtrouajckgidpwg.supabase.co/storage/v1/object/sign/images/pngaaa.com-5330731__1_-removebg-preview-1-e1649640330290.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNDk1NWI1Ny0wMmM5LTRhYmUtODhmZS04ZmNmODI0ODA1ZjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvcG5nYWFhLmNvbS01MzMwNzMxX18xXy1yZW1vdmViZy1wcmV2aWV3LTEtZTE2NDk2NDAzMzAyOTAud2VicCIsImlhdCI6MTc2OTAyNzI0NSwiZXhwIjo0OTIyNjI3MjQ1fQ.mO8iTfqb8QbKdoOF3MyLuQeyhRC_XdBisHsbzX6VgrY" 
                alt="Treasure Chest" 
                class="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] animate-float"
                :style="{ animationDelay: `${(i-1) * 0.2}s` }"
              />
            </button>
          </div>
          <p v-if="loadingReward" class="text-white/50 text-xs animate-pulse">Abriendo cofre mágico...</p>
        </div>
      </div>
    </transition>

     <!-- Reward Result -->
    <transition name="fade">
      <div v-if="gameStatus === 'rewarded'" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-white bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]">
        <div class="text-center space-y-8 max-w-xs relative">
          <div class="absolute -top-20 left-1/2 -translate-x-1/2 text-burgundy animate-bounce">
              <Trophy :size="80" />
          </div>
          <div class="space-y-4 pt-10">
            <h2 class="text-4xl font-black text-burgundy font-serif leading-none italic">¡Sorpresa!</h2>
            <p class="text-gray-400 text-sm font-medium tracking-widest uppercase">Has ganado un premio:</p>
            <div class="py-8 px-6 bg-pink-50 rounded-[2.5rem] border-2 border-pink-100 shadow-inner space-y-3 relative overflow-hidden">
               <div class="absolute top-0 right-0 p-4 opacity-10"><Gift :size="60" /></div>
               <h3 class="text-2xl font-black text-gray-900 leading-tight relative z-10">{{ reward.coupons_pool.title }}</h3>
               <p class="text-gray-600 font-medium relative z-10">{{ reward.coupons_pool.description }}</p>
            </div>
          </div>
          <button @click="router.push('/cupones')" class="w-full btn-primary mt-8">Ver en mis cupones ✨</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.scale-enter-active, .scale-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.6) translateY(50px);
  opacity: 0;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
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
