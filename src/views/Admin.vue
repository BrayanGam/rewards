<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { Save, MessageSquareHeart } from 'lucide-vue-next';

const message = ref('');
const loading = ref(false);
const success = ref(false);

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase.from('profiles').select('special_message').eq('id', user.id).single();
    message.value = data?.special_message || '';
  }
});

const saveMessage = async () => {
  loading.value = true;
  success.value = false;
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('profiles')
    .update({ special_message: message.value })
    .eq('id', user.id);
  
  if (!error) {
    success.value = true;
    setTimeout(() => success.value = false, 3000);
  }
  loading.value = false;
};
</script>

<template>
  <div class="p-6 space-y-6 max-w-lg mx-auto">
    <header>
      <h1 class="text-3xl font-bold text-gray-900 font-serif">Panel de Control</h1>
      <p class="text-gray-500">Configura el mensaje del inicio.</p>
    </header>

    <div class="card space-y-6">
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-burgundy mb-2">
          <MessageSquareHeart :size="20" />
          <label class="font-bold">Mensaje del Día</label>
        </div>
        <textarea 
          v-model="message"
          rows="4"
          class="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none transition-all resize-none"
          placeholder="Escribe algo tierno..."
        ></textarea>
      </div>

      <button 
        @click="saveMessage"
        :disabled="loading"
        class="w-full btn-primary"
      >
        <Save v-if="!loading" :size="20" />
        {{ loading ? 'Guardando...' : 'Actualizar mensaje' }}
      </button>

      <div v-if="success" class="bg-green-50 text-green-600 p-4 rounded-2xl text-center text-sm font-medium animate-bounce">
        ¡Mensaje actualizado con éxito!
      </div>
    </div>
  </div>
</template>
