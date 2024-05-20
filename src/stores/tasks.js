import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useTasksStore = defineStore('tasks', () => {

  const refDate = ref(new Date())
  const dateFormated = computed(() => formatDate(refDate.value))

  function formatDate(date) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('en-GB', options).replace(/,/g, '').split(' ');
  }

  function changeDate(direction) {
    refDate.value.setDate(refDate.value.getDate() + direction)
    refDate.value = new Date(refDate.value)
  }

  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { refDate, dateFormated, changeDate }
})
