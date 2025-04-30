import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', () => {

    const isDarkMode = ref(false)

    return { isDarkMode }

})