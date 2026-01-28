<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-vue-next';

const currentWeekStart = ref(new Date());
const activities = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const editingActivity = ref(null);

// Datos del formulario
const form = ref({
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  color: '#8B4789'
});

const presetColors = [
  { name: 'Burgundy', value: '#8B4789' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Morado', value: '#9333EA' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Gris', value: '#6B7280' }
];

const timeSlots = computed(() => {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
});

const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  start.setHours(0, 0, 0, 0);
  
  // Obtener el lunes de la semana
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      date: date,
      dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: isToday(date)
    });
  }
  return days;
});

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const currentTimePosition = computed(() => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  if (hours < 6 || hours > 23) return null;
  
  const totalMinutes = (hours - 6) * 60 + minutes;
  const totalSlots = 18 * 60; // 6am a 12am = 18 horas
  return (totalMinutes / totalSlots) * 100;
});

const getActivitiesForDay = (date) => {
  return activities.value.filter(activity => {
    const activityDate = new Date(activity.start_time);
    return activityDate.getDate() === date.getDate() &&
           activityDate.getMonth() === date.getMonth() &&
           activityDate.getFullYear() === date.getFullYear();
  });
};

const getActivityStyle = (activity) => {
  const start = new Date(activity.start_time);
  const end = new Date(activity.end_time);
  
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  
  const top = ((startHour - 6) / 18) * 100;
  const height = ((endHour - startHour) / 18) * 100;
  
  return {
    top: `${top}%`,
    height: `${height}%`,
    backgroundColor: activity.color,
    borderLeft: `4px solid ${activity.color}`
  };
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
};

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
};

const goToToday = () => {
  currentWeekStart.value = new Date();
};

const openCreateModal = (date, timeSlot = null) => {
  editingActivity.value = null;
  
  let startTime = '09:00';
  let endTime = '10:00';
  
  if (timeSlot) {
    startTime = timeSlot;
    const [hours, minutes] = timeSlot.split(':');
    const endHour = (parseInt(hours) + 1).toString().padStart(2, '0');
    endTime = `${endHour}:${minutes}`;
  }
  
  form.value = {
    title: '',
    description: '',
    date: date.toISOString().split('T')[0],
    startTime: startTime,
    endTime: endTime,
    color: '#8B4789'
  };
  showModal.value = true;
};

const openEditModal = (activity) => {
  editingActivity.value = activity;
  const start = new Date(activity.start_time);
  const end = new Date(activity.end_time);
  
  form.value = {
    title: activity.title,
    description: activity.description || '',
    date: start.toISOString().split('T')[0],
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    color: activity.color
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingActivity.value = null;
};

const saveActivity = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  if (!form.value.title.trim()) {
    alert('Por favor ingresa un título para la actividad');
    return;
  }
  
  const startDateTime = new Date(`${form.value.date}T${form.value.startTime}`);
  const endDateTime = new Date(`${form.value.date}T${form.value.endTime}`);
  
  const activityData = {
    user_id: user.id,
    title: form.value.title,
    description: form.value.description,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    color: form.value.color
  };
  
  if (editingActivity.value) {
    // Actualizar actividad existente
    const { error } = await supabase
      .from('activities')
      .update(activityData)
      .eq('id', editingActivity.value.id);
    
    if (error) {
      console.error('Error updating activity:', error);
      alert('Error al actualizar la actividad');
      return;
    }
  } else {
    // Crear nueva actividad
    const { error } = await supabase
      .from('activities')
      .insert([activityData]);
    
    if (error) {
      console.error('Error creating activity:', error);
      alert('Error al crear la actividad');
      return;
    }
  }
  
  await fetchActivities();
  closeModal();
};

const deleteActivity = async () => {
  if (!editingActivity.value) return;
  
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!editingActivity.value) return;
  
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', editingActivity.value.id);
  
  if (error) {
    console.error('Error deleting activity:', error);
    alert('Error al eliminar la actividad');
    return;
  }
  
  showDeleteConfirm.value = false;
  await fetchActivities();
  closeModal();
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

const fetchActivities = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });
  
  activities.value = data || [];
};

onMounted(() => {
  fetchActivities();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Encabezado -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 py-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button @click="previousWeek" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft :size="18" />
            </button>
            <button @click="nextWeek" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight :size="18" />
            </button>
            <h2 class="text-base font-semibold text-gray-700">
              {{ weekDays[0]?.date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) }}
            </h2>
          </div>
          <button @click="goToToday" class="px-3 py-1.5 text-xs font-medium text-burgundy hover:bg-burgundy/5 rounded-lg transition-colors">
            Hoy
          </button>
        </div>
      </div>
    </div>

    <!-- Cuadrícula del Calendario -->
    <div class="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <!-- Encabezado de Días -->
        <div class="grid grid-cols-8 border-b border-gray-200 min-w-[640px]">
          <div class="p-2 border-r border-gray-200"></div>
          <div 
            v-for="day in weekDays" 
            :key="day.date.toISOString()"
            class="p-2 sm:p-3 text-center border-r border-gray-200 last:border-r-0"
          >
            <div class="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">{{ day.dayName }}</div>
            <div 
              class="text-xl sm:text-2xl font-bold mt-1 w-8 h-8 sm:w-10 sm:h-10 mx-auto flex items-center justify-center rounded-full"
              :class="day.isToday ? 'bg-burgundy text-white' : 'text-gray-900'"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        </div>

        <!-- Cuadrícula de Horarios -->
        <div class="relative min-w-[640px]">
          <div class="grid grid-cols-8">
            <!-- Etiquetas de Hora -->
            <div class="border-r border-gray-200">
              <div 
                v-for="time in timeSlots" 
                :key="time"
                class="h-12 sm:h-14 border-b border-gray-100 px-1 sm:px-2 py-1 text-[10px] sm:text-xs text-gray-500 text-right"
              >
                {{ time }}
              </div>
            </div>

            <!-- Columnas de Días -->
            <div 
              v-for="day in weekDays" 
              :key="day.date.toISOString()"
              class="relative border-r border-gray-200 last:border-r-0"
            >
              <!-- Franjas Horarias -->
              <div 
                v-for="time in timeSlots" 
                :key="time"
                class="h-12 sm:h-14 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="openCreateModal(day.date, time)"
              ></div>

              <!-- Actividades -->
              <div class="absolute inset-0 pointer-events-none">
                <div 
                  v-for="activity in getActivitiesForDay(day.date)" 
                  :key="activity.id"
                  :style="getActivityStyle(activity)"
                  @click.stop="openEditModal(activity)"
                  class="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 rounded-lg p-1.5 sm:p-2 text-white text-[10px] sm:text-xs font-medium shadow-md cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity overflow-hidden"
                >
                  <div class="font-bold truncate">{{ activity.title }}</div>
                  <div class="text-[9px] sm:text-[10px] opacity-90">{{ formatTime(activity.start_time) }}</div>
                </div>
              </div>

              <!-- Indicador de Hora Actual -->
              <div 
                v-if="day.isToday && currentTimePosition !== null"
                class="absolute left-0 right-0 pointer-events-none z-20"
                :style="{ top: `${currentTimePosition}%` }"
              >
                <div class="relative">
                  <div class="absolute -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  <div class="h-0.5 bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Actividad -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-900">
            {{ editingActivity ? 'Editar' : 'Nueva Actividad' }}
          </h3>
          <button @click="closeModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X :size="20" />
          </button>
        </div>

        <div class="p-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Título</label>
            <input 
              v-model="form.title"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
              placeholder="Ej: Reunión con..."
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              v-model="form.description"
              rows="2"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none resize-none"
              placeholder="Detalles adicionales..."
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
            <input 
              v-model="form.date"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Inicio</label>
              <input 
                v-model="form.startTime"
                type="time"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Fin</label>
              <input 
                v-model="form.endTime"
                type="time"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Color</label>
            <div class="grid grid-cols-8 gap-1.5">
              <button
                v-for="color in presetColors"
                :key="color.value"
                @click="form.color = color.value"
                class="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                :class="form.color === color.value ? 'ring-2 ring-offset-1 ring-burgundy' : ''"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              ></button>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 p-4 bg-gray-50">
          <div class="flex gap-2">
            <button 
              v-if="editingActivity"
              @click.stop="deleteActivity"
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 :size="14" />
              Eliminar
            </button>
            <div class="flex-1"></div>
            <button 
              @click="closeModal"
              type="button"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click="saveActivity"
              type="button"
              class="px-3 py-2 text-sm bg-burgundy text-white rounded-xl font-medium hover:bg-burgundy/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div 
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
        <div class="text-center space-y-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Trash2 class="text-red-500" :size="32" />
          </div>
          <h3 class="text-xl font-bold text-gray-900">¿Eliminar actividad?</h3>
          <p class="text-gray-600">Esta acción no se puede deshacer.</p>
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="cancelDelete"
            type="button"
            class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="confirmDelete"
            type="button"
            class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.grid-cols-8 {
  grid-template-columns: 80px repeat(7, 1fr);
}

@media print {
  @page {
    margin: 0.5cm;
    size: landscape;
  }

  /* Hide headers, navigation, and controls not needed for print */
  button, 
  .sticky, 
  [aria-label="Encabezado"],
  .fixed,
  /* Hide the main sidebar or external layout elements if they exist globally */
  nav, 
  header {
    display: none !important;
  }

  /* Reset main container styles */
  .min-h-screen {
    min-height: auto !important;
    padding-bottom: 0 !important;
    background-color: white !important;
  }

  /* Ensure calendar takes full width/height */
  .max-w-7xl,
  .bg-white {
    max-width: none !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
  }

  /* Handle scroll containers */
  .overflow-x-auto {
    overflow: visible !important;
  }

  .min-w-\[640px\] {
    min-width: auto !important;
  }

  /* Adjust grid for print */
  .grid-cols-8 {
    display: grid !important;
    grid-template-columns: 60px repeat(7, 1fr) !important; /* Smaller time column */
    width: 100% !important;
  }

  /* Typography adjustments for print */
  body {
    font-size: 10pt;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .text-\[10px\], .text-xs, .text-sm, .text-base, .text-xl, .text-2xl {
    /* Normalize text sizes for print */
  }

  /* Ensure activities look good */
  .absolute.rounded-lg {
    box-shadow: none !important;
    border: 1px solid rgba(0,0,0,0.1) !important;
  }

  /* Force background colors */
  * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
}
</style>
