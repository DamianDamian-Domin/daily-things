import './style.css'
import './base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config';
// import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primeicons/primeicons.css'

import Lara from './themes/lara-light';  

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    unstyled: true,
    pt: Lara
})

app.mount('#app')
