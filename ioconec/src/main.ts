import { createApp } from 'vue'
import { setupStore } from './stores'

import App from './App.vue'
import router from './router'

import './index.css'

const app = createApp(App);

setupStore(app);

app.use(router);

app.mount('#app');
